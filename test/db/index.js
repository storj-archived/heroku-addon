// The db tests complete code coverage for all paths in db.js not covered by
// the e2e tests
'use strict';

var test = require('tape');
var db = require('../../db.js');

var collectionMock = {};

var connectionMock = {
  close: function (cb) { return cb(); }
};

var mongodbMock = {
  MongoClient: {}
};

test('Setup', function (t) {
  t.pass('Mocking mongodb and clearing db.js cache');
  require('mongodb');
  require.cache[require.resolve('mongodb')].exports = mongodbMock;
  delete require.cache[require.resolve('../../db.js')];
  db = require('../../db.js');
  t.end();
});


test('Connection caching resilient to race conditions', function (t) {
  t.plan(3);
  collectionMock.findOne = function findOneMock(query, project, cb) {
    setImmediate(cb);
  };

  connectionMock.collection = function createCollectionMock() {
    return collectionMock;
  };

  var connectInvoked = 0;
  mongodbMock.MongoClient.connect = function connectMock(url, opts, cb) {
    // Wait for other invokations to have a chance to register
    setImmediate(function () {
      t.equal(++connectInvoked, 1, 'Connection invoked once');
      return cb(null, connectionMock);
    });
  };

  db.get('foobar', function () {
    t.pass('Function 1 gets called');
  });

  db.get('foobar', function () {
    t.pass('Function 2 gets called');
  });
});

test('Clear db cache', function (t) {
  db.close(function () {
    t.end();
  });
});

test('Connect retries on failure', function (t) {
  t.plan(4);
  collectionMock.findOne = function findOneMock(query, project, cb) {
    setImmediate(cb);
  };

  connectionMock.collection = function createCollectionMock() {
    return collectionMock;
  };

  var returnError = true;
  mongodbMock.MongoClient.connect = function connectMock(url, opts, cb) {
    // Wait for other invokations to have a chance to register
    setImmediate(function () {
      t.pass('Should be called twice');
      if(returnError) {
        returnError = false;
        return cb(new Error('foobar!'));
      }
      return cb(null, connectionMock);
    });
  };

  db.get('foobar', function (e) {
    t.ok(e, 'Returns error');
  });

  db.get('foobar', function () {
    t.pass('Connects!');
  });
});

test('Clear db cache', function (t) {
  db.close(function () {
    t.end();
  });
});

test('Insert properly handles error condition on connect', function (t) {
  t.plan(2);

  mongodbMock.MongoClient.connect = function connectMock(url, opts, cb) {
    t.pass('Should invoke connect');
    return cb(new Error('foobar!'));
  };

  db.insert({}, function (e) {
    t.ok(e, 'Should error');
    t.end();
  });
});

test('Clear db cache', function (t) {
  db.close(function () {
    t.end();
  });
});

test('Update properly handles error condition on connect', function (t) {
  t.plan(2);

  mongodbMock.MongoClient.connect = function connectMock(url, opts, cb) {
    t.pass('Should invoke connect');
    return cb(new Error('foobar!'));
  };

  db.update({}, {}, function (e) {
    t.ok(e, 'Should error');
    t.end();
  });
});

test('Update properly handles error condition from db', function (t) {
  t.plan(2);

  mongodbMock.MongoClient.connect = function connectMock(url, opts, cb) {
    t.pass('Should invoke connect');
    return cb(null, connectionMock);
  };

  collectionMock.updateOne = function (query, update, opts, cb) {
    cb(new Error('foobar!'));
  };

  db.update({}, {}, function (e) {
    t.ok(e, 'Should error');
    t.end();
  });
});

test('Update properly handles db misbehaving', function (t) {
  t.plan(1);

  collectionMock.updateOne = function (query, update, opts, cb) {
    cb(null, {});
  };

  db.update({}, {}, function (e) {
    t.ok(e, 'Should error');
    t.end();
  });
});

test('Clear db cache', function (t) {
  db.close(function () {
    t.end();
  });
});

test('Delete properly handles error condition on connect', function (t) {
  t.plan(2);

  mongodbMock.MongoClient.connect = function connectMock(url, opts, cb) {
    t.pass('Should invoke connect');
    return cb(new Error('foobar!'));
  };

  db.delete({}, function (e) {
    t.ok(e, 'Should error');
    t.end();
  });
});

test('Delete properly handles error condition from db', function (t) {
  t.plan(2);

  mongodbMock.MongoClient.connect = function connectMock(url, opts, cb) {
    t.pass('Should invoke connect');
    return cb(null, connectionMock);
  };

  collectionMock.updateOne = function (query, update, opts, cb) {
    cb(new Error('foobar!'));
  };

  db.delete({}, function (e) {
    t.ok(e, 'Should error');
    t.end();
  });
});

test('Delete properly handles db misbehaving', function (t) {
  t.plan(1);

  collectionMock.updateOne = function (query, update, opts, cb) {
    cb(null, {});
  };

  db.delete({}, function (e) {
    t.ok(e, 'Should error');
    t.end();
  });
});



test('Clear db cache', function (t) {
  db.close(function () {
    t.end();
  });
});

test('Close still calls cb when cache is empty', function (t) {
  t.plan(1);
  db.close(function () {
    t.pass('Callback called!');
  });
});

test('Close gracefully handles no callback', function (t) {
  db.close();
  t.end();
});

test('Cleanup', function (t) {
  delete require.cache[require.resolve('mongodb')];
  delete require.cache[require.resolve('../../db.js')];
  t.pass('Unregistered mongodb and db.js');
  t.end();
});
