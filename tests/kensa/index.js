'use strict';

var test = require('tape');
var spawn = require('child_process').spawn;
var app = require('../../index.js');

test.skip('Should pass kensa', function(t) {
  t.plan(1);
  var stdio = { stdio: ['ignore', process.stdout, process.stderr] };
  var server = app(8080);
  server.on('listening', function() {
    spawn('kensa', ['test','all'], stdio)
      .on('close', function (code) {
        server.close();
        t.equal(code, 0, 'Kensa passes with no errors');
      });
  });
});
