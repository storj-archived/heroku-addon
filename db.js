'use strict';

// We use the mongodb library to connect to our datastore
var MongoClient = require('mongodb').MongoClient;
// Load in our config
var config = require('./config');

// Share a single connection for this service, we can look into connection
// pooling if this proves to be a hit to performance
var connection = null;
var connecting = false;

// getCollection is a wrapper function for gaining access to the datastore. The
// first time it is called, it primes the connection cache, subsequent calls
// will simply return the cached connection
function getCollection (cb) {
  // Check to see if we have already connected to the database. If so, return
  // a mongo collection from the cached connection.
  if(connection) {
    return cb(null, connection.collection(config.db.collection));
  }

  // If we are connecting, yield the event loop and try again. What this does
  // is gives the MongoClient.connect below a chance to prime the cache before
  // this invocation of getCollection fires again. This is a "busy" wait in
  // that it will keep using all of the CPU available to it until the cache is
  // primed, but it isn't "busy" in the sense that it will starve the
  // application of resources. By using setImmediate as opposed to nextTick, we
  // allow other I/O such as incomming connections, fs read/write, and outgoing
  // connections to complete before we re-attempt fetching the connection from
  // cache
  if(connecting) {
    return setImmediate(getCollection, cb);
  }

  // By setting connecting to true here, we ensure only one invocation of
  // getCollection can attempt to prime the cache at any given time
  connecting = true;

  // Finally, let's attempt to prime the cache
  return MongoClient.connect(config.db.url,
    config.db.options,
    function mongoConnected(e, db) {
      // If we failed to connect to the database, set connecting to false so
      // another invocation of getCollection can attempt to connect, then
      // return an error back to the client so that heroku isn't waiting on us
      if(e) {
        connecting = false;
        return cb(e);
      }

      // Cache the new connection
      connection = db;

      // Set connecting to false so that, in the event the cache is ever
      // invalidated, subsequent calls to getCollection can reprime the cache
      connecting = false;

      // Return a mongo collection from the cached connection!
      return cb(null, connection.collection(config.db.collection));
    });
}

// close allows the process to gracefully shutdown it's connection to Mongodb.
// When called, it will send the FIN packets to the database. A process that
// doesn't do this will leave the connection to the DB "open" when it dies, and
// the db won't close it until the timeout. A "flapping" process could deplete
// the db of connections.
module.exports.close = function closeConnection(cb) {
  // If no callback is provided, then make cb a noop
  if(!cb) { cb = function () {}; }

  // Check to see if a connection exists, if so delete the cache and call close
  // on the connection. Once the connection is closed, call our callback.
  if(connection) {
    var cache = connection;
    connection = null;
    return cache.close(cb);
  }

  // If there was no connection, simply return
  return cb();
};

// Add a new add-on record
module.exports.insert = function insertKey(document, cb) {
  return getCollection(function haveConnection(e, c) {
    if(e) { return cb(e); }
    var opts = {
      j: true,
      w: 'majority',
    };
    return c.insert(document, opts, cb);
  });
};

// Update an add-on's properties (i.e. the plan)
module.exports.update = function updateKey(key, document, cb) {
  return getCollection(function haveConnection(e, c) {
    if(e) { return cb(e); }
    var opts = {
      j: true,
      w: 'majority',
    };
    var query = {
      id: { $eq: key.id }
    };
    var update = {
      $set: document
    };
    return c.updateOne(query, update, opts, function (e, r) {
      // If there was an error, return that error
      if(e) { return cb(e); }
      // If we didn't get a result back from Mongodb, something super weird
      // has happened.... Return an error, these are the end times indeed.
      if(!r || !r.result) {
        return cb(new Error('Mongo didn\'t return result'));
      }
      // If we didn't update a document in this request, that means the user
      // doesn't exist. Return the error.
      if(r.result.nModified === 0) { return cb(new Error('User not found')); }
      return cb();
    });
  });
};

// Deactive an add-on
module.exports.delete = function deleteKey(key, cb) {
  return getCollection(function haveConnection(e, c) {
    if(e) { return cb(e); }
    var opts = {
      j: true,
      w: 'majority'
    };
    var query = {
      id: { $eq: key.id }
    };
    var document = {
      $set: {
        active: false
      }
    };

    // Instead of deleting the entry, we set the active flag to false. This
    // allows us to continue bookkeeping, reactivate an account, etc.
    return c.updateOne(query, document, opts, function deleted(e, r) {
      if(e) { return cb(e); }
      // If we didn't get a result back from Mongodb, something super weird
      // has happened.... Return an error, these are the end times indeed.
      if(!r || !r.result) {
        return cb(new Error('Mongo didn\'t return result'));
      }
      // If we didn't update a document in this request, that means the user
      // didn't exist, return an error.
      if(r.result.nModified === 0) {
        return cb(new Error('No active entry found with provided email'));
      }
      return cb();
    });
  });
};

// Fetch an add-on entry from the database. Currently, this is only used for
// tests
module.exports.get = function getKey(key, cb) {
  return getCollection(function haveConnection(e, c) {
    if(e) { return cb(e); }
    var projection = {
      _id: 0
    };
    var query = {
      id: { $eq: key.id }
    };
    return c.findOne(query, projection, cb);
  });
};
