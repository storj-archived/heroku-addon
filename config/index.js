var addonManifest = require('../addon-manifest.json')
module.exports = {
  storj: {
    api: process.env.BRIDGE_ENDPOINT || 'http://api.staging.storj.io'
  },
  db: {
    url: process.env.MONGO_URL,
    collection: 'account'
  },
  // For heroku, we either use the provided environment variables for
  // production, or we use the values from addon-manifest to match what kensa
  // is expecting
  heroku: {
    id: process.env.HEROKU_ID || addonManifest.id,
    password: process.env.HEROKU_PASSWORD || addonManifest.api.password
  }
}

// Lock this config object down so we can't accidentally change it during
// runtime
Object.freeze(module.exports)
