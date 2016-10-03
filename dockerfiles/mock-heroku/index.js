'use strict';
/*
 * The purpose of mock-heroku is to stand in for requests that should be
 * outbound to heroku. This lets us simulate resolving email addresses for our
 * account-mapping service.
 */

// Let's setup an express server
var express = require('express');
var app = express();

// Make sure upstream apps are using proper basic auth on requests
var auth = require('basic-auth');

app.get('/vendor/apps/:appId', function (req, res) {
  console.log(req.params);
  var creds = auth(req);
  console.log(creds);
  res.json({
    owner_email: 'retrohacker@gmail.com'
  });
  res.end();
});

app.listen('80', function (e) {
  if(e) { throw e; }
  console.log('Listening on 80');
});
