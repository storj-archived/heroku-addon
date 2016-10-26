'use strict';

var test = require('tape');
var index = require('../../index.js');
var config = require(`../../config`);
var uuid = require(`node-uuid`).v4();
var request = require(`request`);
var dbMock = {
  close: function () {}
};

// Use the same server for all tests
var port = 8000;
var server;

test('Setup', function (t) {
  t.pass('Mocking db.js and clearing index.js cache');
  require('../../db.js');
  require.cache[require.resolve('../../db.js')].exports = dbMock;
  delete require.cache[require.resolve('../../index.js')];
  index = require('../../index.js');
  server = index(port);
  t.end();
});

test('POST handles failing db insert', function (t) {
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

  dbMock.insert = function (doc, cb) {
    return cb(new Error('foobar!'));
  };

  request.post(`http://127.0.0.1:${port}/heroku/resources`,
    reqOpts,
    function userCreated (e, res) {
      t.error(e, 'Http request complets without error');
      t.equal(res.statusCode, 503, `POST fails`);
      t.end();
  });
});

test('Close server', function (t) {
  server.close(function () {
    t.end();
  });
});

test('Cleanup', function (t) {
  t.pass('Resetting db.js and index.js cache');
  delete require.cache[require.resolve('../../db.js')];
  delete require.cache[require.resolve('../../index.js')];
  require('../../index.js');
  require('../../db.js');
  t.end();
});
