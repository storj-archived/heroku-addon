'use strict';

var test = require('tape');
var exec = require('child_process').exec;
var app = require('../../index.js');

test('Should pass kensa', function(t) {
  t.plan(2);
  var server = app(8080);
  server.on('listening', function() {
    exec('kensa test all', {}, function (error, stdout, stderr) {
        server.close();
        t.error(error, 'Process should run with no errors');
        var code = (error === null) ? 0 : error.code;
        t.equal(code, 0, 'Kensa success status');
        // Only print kensa output if it failed to run
        if(error) {
          console.log(stdout);
          console.error(stderr);
        }
    });
  });
});
