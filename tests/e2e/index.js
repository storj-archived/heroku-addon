'use strict';

var test = require('tape');
var request = require('request');
var SMTPServer = require('smtp-server').SMTPServer;
var index = require('../../index.js');
var config = require('../../config');
var uuid = require('node-uuid').v4();
var db = require('../../db.js');

// Use the same server for all tests
var server = index('8080');

test('Creating user sends email', function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    body: {
      'uuid': uuid,
      'plan': 'free'
    },
    json: true
  };

  var smtpServer = new SMTPServer({
    onData: function dataHandler (stream, session, cb) {
      cb();
      t.pass('Email received');
      smtpServer.close();
      return t.end();
    },
    onAuth: function (a, s, cb) { return cb(null, { user: 'fake' }); },
    tls: {
      rejectUnauthorized: false
    },
    authOptional: true,
    closeTimeout: 0,
  });

  smtpServer.listen(25, '0.0.0.0');

  request.post('http://127.0.0.1:8080/heroku/resources',
    reqOpts,
    function userCreated (e, res) {
      t.error(e);
      t.equal(res.statusCode, 200, 'Created user');
  });
});

test('Updating user changes user plan in db', function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    body: {
      'plan': 'foobar',
    },
    json: true
  };

  var url = `http://127.0.0.1:8080/heroku/resources/${uuid}`;
  request.put(url, reqOpts, function (e, res) {
    t.error(e);
    t.equal(res.statusCode, 200, 'Update worked');
    db.get({ id: uuid }, function (e, doc) {
      t.error(e);
      if(e) { throw e; }
      t.equal(doc.tier, 'foobar');
      t.end();
    });
  });
});

test('Deleting user removes user from the database', function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    json: true
  };

  var url = `http://127.0.0.1:8080/heroku/resources/${uuid}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e);
    t.equal(res.statusCode, 200, 'User removed');
    t.end();
  });
});

test('Deleting user twice fails', function (t) {
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    json: true
  };

  var url = `http://127.0.0.1:8080/heroku/resources/${uuid}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e);
    t.equal(res.statusCode, 503, 'User can\'t be removed');
    t.end();
  });
});

test('Auth is required', function (t) {
  var reqOpts = {
    json: true
  };

  var url = `http://127.0.0.1:8080/heroku/resources/${uuid}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e);
    t.equal(res.statusCode, 401, 'Auth fails');
    t.end();
  });
});

test('Auth must match', function (t) {
  var reqOpts = {
    auth: {
      'user': 'wrong',
      'pass': 'wrong'
    },
    json: true
  };

  var url = `http://127.0.0.1:8080/heroku/resources/${uuid}`;
  request.delete(url, reqOpts, function (e, res) {
    t.error(e);
    t.equal(res.statusCode, 401, 'Auth fails');
    t.end();
  });
});

test('Teardown', function (t) {
  t.pass('Cleaning up server');
  server.close();
  t.end();
});
