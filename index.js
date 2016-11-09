'use strict';

// We use express for our webserver
var express = require('express');
// body-parser allows us to get an incomming request's JSON body as an object
var bodyParser = require('body-parser');
// We use crypto to generate a random password for our user
var crypto = require('crypto');
// We use the storj client to generate a new user on the bridge
var storj = require('storj');
// We use basic-auth to parse the Authentication header on incomming requests
var auth = require('basic-auth');
// Load in the db to keep track of registered users and their plan tiers
var db = require('./db.js');
// Load in our runtime config as a read-only object
var config = require('./config');
// node-uuid allows us to generate a UUID for each request, so we can use it
// when logging to help with tracing
var uuid = require('node-uuid');
// We use bole for logging
var log = require('bole')('storj-heroku');
// Crypto is used to verify the SSO endpoint
var crypto = require('crypto');
// We use async for our retry logic
var async = require('async');

// Begin building our http server
var app = express();
// Parse all incomming requests as having a JSON body (gives us an object to
// work with on req.body)
app.use('/heroku/resources', bodyParser.json());
app.use('/heroku/sso', bodyParser.urlencoded());

// Create a new client to communicate with the storj bridge
var storjClient = storj.BridgeClient(config.storj.api);

// Ensure all incomming requests are given a UUID for this service to help
// us identify logs
app.use('*', function addUUID(req, res, next) {
  req.uuid = uuid.v4();
  next();
});

// Health check
app.get('/health', function(req, res) {
  return res.status(200).end();
});
// Health check Kubernetes
app.get('/', function(req, res) {
  return res.status(200).end();
});

app.post('/heroku/sso', function(req,res) {
  // Ensure all the pieces for a valid SSO request are present
  if( !req.body ||
      !req.body.id ||
      !req.body.token ||
      !req.body.timestamp) {
    // If we are missing any pieces necessary to validate the request, simply
    // return access denied
    log.info(`${req.uuid}: Rejected SSO request`);
    return res.status(401).end();
  }

  log.info(`${req.uuid}: Received SSO request for ${req.body.id}`);

  // Generate the valid token hash using the shared secret from our mainfest
  var hash = crypto
    .createHash('sha1')
    .update(`${req.body.id}:${config.heroku.sso_salt}:${req.body.timestamp}`)
    .digest('hex');

  // Make sure the timestamp we were given is recent. The timestamp we are
  // given is in seconds, so we convert that to milliseconds. The binary OR
  // operator forces the timestamp to be a positive integer no matter what
  // was provided. This protects against trying to create a Date object with
  // an invalid string.
  var time = Math.abs(Date.now() - new Date((req.body.timestamp | 0) * 1000));

  // Make sure the timestamp was recent and that the hash was valid
  if(hash !== req.body.token || time > 100000) {
    // If not, return access denied
    log.info(`${req.uuid}: Failed ${hash} !== ${req.body.token} || ${time}`);
    return res.status(403).end();
  }

  // The heroku endpoint only checks that this cookie is set, nothing more. So
  // we can return whatever we want as the value.
  res.cookie('heroku-nav-data', 'foobar');

  // Render SSO page
  return res.redirect('http://storj.io/heroku');
});


// Ensure incomming requests are authenticated using our heroku shared secrets
app.use('/heroku', function enforceAuth(req, res, next) {
  var creds = auth(req);

  if ( typeof creds === 'undefined' ) {
    log.error(`${req.uuid}: Incoming request provided no auth data`);
    return res.status(401).end();
  }

  if ( creds.pass !== config.heroku.password ||
       creds.name !== config.heroku.id ) {
    // If either the id or password don't match, reject the request
    log.error(`${req.uuid}: Incomming request failed authentication`);
    log.error(`${req.uuid}: ID: "${creds.name}" Password: "${creds.pass}"`);
    return res.status(401).end();
  }
  // If we pass authentication, let the next handler take over
  next();
});

/*
 * POST /horoku/resources
 *
 * Create a new storj resource for a customer
 */
app.post('/heroku/resources', function provisionRequest(req, res) {
  // We generate the user's email address for this add-on by using the UUID
  // of the heroku add-on at our own email service. This allows the bridge to
  // send an email to this user in it's normal fashion, that email will be
  // intercepted by another one of our services and forwarded onto the user's
  // real email address
  var email = `${req.body.uuid}@heroku.storj.io`;
  // Generate a random password for our user
  var password = crypto.randomBytes(48).toString('base64');
  log.info(`${req.uuid}: Creating user: "${email}"`);
  // Create a new account on the bridge using the email address and password
  // generated above
  storjClient.createUser({
    email: email,
    password: password
  }, function(e) {
    // If we fail to create the user on the bridge, return a message asking the
    // user to try again later, and give heroku a 503.
    if (e) {
      log.info(`${req.uuid}: "${e.message}"`);
      return res.status(503).json({
        'message': `${req.uuid}: ` +
          `Unable to create user on bridge, please try again later`
      });
    }

    // At this point, we have already created a user on the bridge. Since the
    // bridge already has a bucket registered on behalf of the user, we can
    // safely let the heroku API know the credentials. We don't want the heroku
    // plugin to "try again" if we have already created a user.
    res.json({
      // Since we are using heroku's UUID for our index key when creating
      // plans, we can go ahead and send that back to heroku for future
      // reference
      'id': req.body.uuid,
      // The email and password will be provided to the user's dynos as
      // the environment variables below
      'config': {
        'STORJ_EMAIL': email,
        'STORJ_PASSWORD': password
      }
    });

    // Now that the HTTP request has been returned, we aren't racing against a
    // timeout. We can now safely add retry logic to our DB insert, keeping the
    // document in memory until we can get it into Mongo. Eventually, after
    // trying for quite some time, we will simply write the entry to disk for
    // later recovery.
    log.info(`${req.uuid}: Adding "${email}" to DB`);

    // First we create the document to insert
    var document = {
      // All add-ons are identified by their heroku UUID, so we will use that
      // as the index key
      id: req.body.uuid,
      // Assign the user to the plan tier they requested
      tier: req.body.plan,
      // The active key reflects if this add-on is still live on heroku. Since
      // we don't store the user's password, we are unable to delete the user
      // from the bridge directly. Instead, we toggle this value to false
      // indicating that we no longer are billing this customer for resources.
      // Later on, we may feed a report from our DB into the bridge to disable
      // all accounts that have been deactiavted on heroku.
      active: true
    };

    // Setup retry logic and insert our document into the database
    return async.retry({
      times: config.retry.count,
      interval: function (count) {
        return config.retry.baseDelay * Math.pow(config.retry.exponent, count);
      }
    }, function (cb) {
      db.insert(document, function insertedIntoMongo (e) {
        if(e) {
          log.error(`${req.uuid}: ${e.message}`);
        }
        return cb(e);
      });
    });
  });
});

/*
 * PUT /heroku/resources/[id]
 *
 * Change the plan tier of a user's add-on
 */
app.put('/heroku/resources/:id', function(req, res) {
  // Heroku give's us the UUID of the integration, which we are using as a key
  // in the database
  var key = {
    id: req.params.id
  };

  // Define the updates we would like to make to the values for this entry in
  // the database. In this case, we are changing the plan tier to the new
  // value provided by heroku
  var document = {
    tier: req.body.plan
  };

  // Go ahead and commit the changes defined above to the database
  db.update(key, document, function(e) {
    // If we failed to commit the change to the database, let heroku know it
    // failed so they can retry later
    if (e) {
      log.error(`${req.uuid}: ${e.message}`);
      return res.status(503).json({
        'message': `${req.uuid}: ` +
          `Unable to update plan in database, please try again later`
      });
    }

    // Let heroku know the plan was changed successfully
    return res.json({
      'message': 'Success!'
    });
  });
});

/*
 * DELETE /heroku/resources[id]
 *
 * Deactivate a user's add-on
 */
app.delete('/heroku/resources/:id', function(req, res) {
  // Heroku give's us the UUID of the integration, which we are using as a key
  // in the database
  var key = {
    id: req.params.id
  };

  // Deactivate the key in the database
  db.delete(key, function(e) {
    // If we failed to commit the change to the database, let heroku know it
    // failed so they can retry later
    if (e) {
      log.info(`${req.uuid}: ${e.message}`);
      return res.status(503).json({
        'message': `${req.uuid}: ` +
          `Unable to delete plan in database, please try again later`
      });
    }

    // Let heroku know the plan was deactivated
    return res.json({
      'message': 'Success!'
    });
  });
});

// Make this easier to test. If we are required in by another module, we will
// export a function that lets that module control this application.
/* istanbul ignore else */
if(module.parent) {
  // Allow the module requiring us in to define a port they want us to listen
  // on, and return the server instance created by .listen so that the module
  // can shut us down
  module.exports = function listen(port) {
    var server = app.listen(port);
    // When the module requiring us in closes our connection, shut down our
    // connection to the database as well
    server.on('close', db.close);
    return server;
  };
} else {
  // If we are started directly from the command line, go ahead and run the
  // server on port 8080
  app.listen(8080, function() {
    log.info('Listening on port: 8080');
  });
}
