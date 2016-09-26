var test = require('tape')
var request = require('request')
var SMTPServer = require('smtp-server').SMTPServer
var index = require('../../index.js')
var config = require('../../config')
var uuid = require('node-uuid')

test('Creating user sends email', function (t) {
  var server = index('8080')
  var reqOpts = {
    auth: {
      'user': config.heroku.id,
      'pass': config.heroku.password
    },
    body: {
      'uuid': uuid.v4(),
      'plan': 'free'
    },
    json: true
  }

  var server = new SMTPServer({
    onData: dataHandler,
    authOptional: true
  })

  server.listen(8025, '0.0.0.0')

  function dataHandler() {
    t.pass('WOOOOO!')
    server.end()
    t.end()
  }

  request.post('http://127.0.0.1:8080/heroku/resources',
    reqOpts,
    function userCreated (e, res, body) {
      t.error(e)
      t.equal(200, res.statusCode, 'Created user')
      server.close()
  })
})
