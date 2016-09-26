'use strict';

var MongoClient = require('mongodb').MongoClient;
var config = require('./config');

var connection = null;

function getCollection (cb) {
  if(connection) {
    return cb(null, connection.collection(config.db.collection));
  }

  if(typeof config.db.url !== 'string') {
    var error = 'issue with db';
    return cb(error, null);
  }

  return MongoClient.connect(config.db.url,
    config.db.options,
    function mongoConnected(e, db) {
      if(e) { return cb(e); }
      connection = db;
      return cb(null, db.collection(config.db.collection));
    });
}

module.exports.close = function(close) {
  if(connection) { connection.close(); }
  if(close) { return close(); }
  return null;
};

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
    return c.updateOne(query, update, opts, cb);
  });
};

module.exports.delete = function deleteKey(key, cb) {
  return getCollection(function haveConnection(e, c) {
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
    return c.updateOne(query, document, opts, function deleted(e, r) {
      if(e) { return cb(e); }
      if(r.deletedCount === 0) {
        cb(new Error('No entry found with provided email'));
      }
      return cb();
    });
  });
};
