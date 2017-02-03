'use strict';

var test = require(`tape`);
var request = require(`request`);
var index = require(`../../index.js`);
var config = require(`../../config`);
var uuid = require(`node-uuid`).v4();
var db = require(`../../db.js`);
var http = require(`http`);

// Use the same server for all tests
var port = 8000;
var server = index(port);

var user_id = null;

test(`Creating user sends email`, function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    body: {
      'uuid': uuid,
      'plan': `free`
    },
    json: true
  };

  // Start a server to wait for the authentication request
  var callback = http.createServer(function (req, resp) {
    t.pass('Received callback!');
    resp.end();
    callback.close(function () {
      t.end();
    });
  }).listen(8081);

  request.post(`http://127.0.0.1:${port}/heroku/resources`,
    reqOpts,
    function userCreated (e, res) {
      t.error(e, 'Http request complets without error');
      t.equal(res.statusCode, 200, `Created user`);
  });
});

// We want this to succeed for a many-to-many relationship
test(`Creating multiple identical users succeeds`, function(t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    body: {
      'uuid': uuid,
      'plan': `free`
    },
    json: true
  };

  request.post(`http://127.0.0.1:${port}/heroku/resources`,
    reqOpts,
    function userCreated (e, res) {
      user_id = res.body.id;
      t.error(e, 'Http request complets without error');
      t.equal(res.statusCode, 200, `Creates user`);
      t.end();
  });
});

test(`Updating user changes user plan in db`, function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    body: {
      'plan': `foobar`,
    },
    json: true
  };

  var url = `http://127.0.0.1:${port}/heroku/resources/${user_id}`;
  request.put(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 200, `Update worked`);
    db.get({ id: user_id }, function (e, doc) {
      t.error(e, 'db get complets without error');
      if(e) { throw e; }
      t.equal(doc.tier, `foobar`);
      t.end();
    });
  });
});

test(`Can't update plan that doesn't exist`, function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    body: {
      'plan': `foobar`,
    },
    json: true
  };

  var wrongUUID = `38985704-2aa9-450c-9a63-6182c8b764cf`;
  var url = `http://127.0.0.1:${port}/heroku/resources/${wrongUUID}`;
  request.put(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 503, `Update rejected`);
    t.end();
  });
});

test(`Deleting user removes user from the database`, function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    json: true
  };

  var url = `http://127.0.0.1:${port}/heroku/resources/${user_id}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 200, `User removed`);
    t.end();
  });
});

test(`Deleting user twice fails`, function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    json: true
  };

  var url = `http://127.0.0.1:${port}/heroku/resources/${user_id}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 503, `User can\`t be removed`);
    t.end();
  });
});

test(`Auth is required`, function (t) {
  var reqOpts = {
    json: true
  };

  var url = `http://127.0.0.1:${port}/heroku/resources/${uuid}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 401, `Auth fails`);
    t.end();
  });
});

test(`Auth must match`, function (t) {
  var reqOpts = {
    auth: {
      'user': `wrong`,
      'pass': `wrong`
    },
    json: true
  };

  var url = `http://127.0.0.1:${port}/heroku/resources/${uuid}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 401, `Auth fails`);
    t.end();
  });
});

test(`Server is responding to health checks`, function (t) {
  var reqOpts = {
    json: true
  };

  var url = `http://127.0.0.1:${port}/health`;
  request.get(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 200, `Health check passes`);
    t.end();
  });
});

test(`Server responds to kube health checks`, function (t) {
  var reqOpts = {
    json: true
  };

  var url = `http://127.0.0.1:${port}/`;
  request.get(url, reqOpts, function (e, res) {
    t.error(e, 'Http request complets without error');
    t.equal(res.statusCode, 200, `Health check passes`);
    t.end();
  });
});

test(`Teardown`, function (t) {
  t.pass(`Cleaning up server`);
  server.close();
  t.end();
});
