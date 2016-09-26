var SMTPServer = require('smtp-server').SMTPServer
var SMTPClient = require('smtp-connection')

var server = new SMTPServer({
  onData: dataHandler,
  authOptional: true
})

server.listen(25, '0.0.0.0', function listening() {
  console.log(`SMTP Server started on 0.0.0.0:25`);
})

function dataHandler (stream, session, done) {
  console.log('Received email destined to:')
  console.log(JSON.stringify(session.envelope))
  var conn = new SMTPClient({
    port: 25,
    host: 'heroku.storj.io',
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  })
  conn.connect(function (e) {
    console.log('Connected to heroku.storj.io:25')
    if(e) throw e
    var envelope = {
      from: session.envelope.mailFrom.address,
      to: session.envelope.rcptTo[0].address
    }

    console.log('Sending envelope:')
    console.log(JSON.stringify(envelope))
    conn.send(envelope, stream, function (e) {
      if(e) throw e
      console.log('Sent to heroku.storj.io:25')
      done(e)
    })
  })
}
