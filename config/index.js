'use strict';

var addonManifest = require('../addon-manifest.json');
var bole = require('bole');

/* We don't do code coverage on our configuration file */
/* istanbul ignore next */
module.exports = {
  storj: {
    api: process.env.BRIDGE_ENDPOINT || 'https://api.staging.storj.io'
  },
  db: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    collection: 'account',
    options: {
      server: {
        ssl: ( process.env.MONGO_SSL === 'true' ) || false,
        sslValidate: ( process.env.MONGO_SSL_VALIDATE  === 'true' ) || false,
      },
      replSet: {
        rs_name: process.env.MONGO_RS_NAME
      },
      mongos: {}
    }
  },
  // For heroku, we either use the provided environment variables for
  // production, or we use the values from addon-manifest to match what kensa
  // is expecting
  heroku: {
    id: process.env.HEROKU_ID || addonManifest.id,
    password: process.env.HEROKU_PASSWORD || addonManifest.api.password
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Configure our logging
/* istanbul ignore next */
bole.output({
  level: module.exports.log.level,
  stream: process.stdout
});

// We throw here. Throwing is an anti-pattern, but in this case we want to make
// sure the server doesn't start with an invalid configuration file. Let the
// process die and give a meaningful stack trace and error message.
/* istanbul ignore next */
function scrubConfig(config) {
  if(typeof config.db.url !== 'string') {
    throw new Error('MONGO_URL must be a string');
  }
}

scrubConfig(module.exports);

// Lock this config object down so we can't accidentally change it during
// runtime
Object.freeze(module.exports);
