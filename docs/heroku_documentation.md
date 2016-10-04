[Storj](https://elements.heroku.com/addons/Storj) object storage provider, allowing application developers to store their data quickly, securely, and for half the price.
Features:
- All data is encrypted client side. Unlike other cloud storage providers, Storj has no access to your data.
- Storj uses blazing fast P2P technology for uploads and downloads. No more waiting to store/retrieve your data. We can go as fast as you can handle.
- Significantly lower cost than the big guys on bandwidth and storage. Transfer in Storj is always free.
- Fully open source. Want a feature that doesn't exist yet? Feel free to fork us on [Github](https://github.com/storj) and hack away.
Storj is accessible via an API and has supported client libraries for [[Java|Node.js]]*.

## Provisioning the add-on
Storj can be attached to a Heroku application via the CLI:
> callout
> A list of all plans available can be found [here](https://elements.heroku.com/addons/Storj).
```term
$ heroku addons:create storj --app APP_NAME
-----> Adding Storj to sharp-mountain-4005... done, v18 (free)
```
Once Storj has been added a `ADDON-CONFIG-NAME` setting will be available in the app configuration and will contain the `STORJ_EMAIL` and `STORJ_PASSWORD` settings. This can be confirmed using the `heroku config` command.
```term
$ heroku config | grep STORJ
=== storj-example Config Vars
STORJ_EMAIL:    d2e49203-4ae1-40e7-b544-191391ba91fe@heroku.storj.io
STORJ_PASSWORD: vXgmwVkmo8g2F6Ey2x33pWOd4+tHZDmlV/GA1v9ty42RompNa2QswVXtXMeukwxI
```
After installing Storj the application should be configured to fully integrate with the add-on.

## Local setup
### Environment setup
> After provisioning the add-on it's necessary to locally replicate the config vars so your development environment can operate against the service.
Use the Heroku Local command-line tool to configure, run and manage process types specified in your app's [Procfile](procfile). Heroku Local reads configuration variables from a `.env` file. To view all of your app's config vars, type `heroku config`. Use the following command for each value that you want to add to your `.env` file.
```term
$ heroku config:get ADDON-CONFIG-NAME -s  >> .env
```
> warning
> Credentials and other sensitive configuration values should not be committed to source-control. In Git exclude the `.env` file with: `echo .env >> .gitignore`.
For more information, see the [Heroku Local](heroku-local) article.

### Service setup
Storj can be configured for use in a local development environment. To do this, you would export the environment variables mentioned above in Environment setup. You will then be able to run your service locally and it will talk to the Storj API.

> You can install the Storj CLI to interact with your buckets and files using the following command. To use this, you must have Node.JS and NPM installed.
```term
npm install -g storj
```

## Using with Node.js

Node.js applications will need to add the following entry into their `package.json` specifying the `storj` client library.

```term
npm install --save storj
```

Update application dependencies with npm.

```term
npm install
```

Configure the [Bridge Client](https://storj.github.io/core/BridgeClient.html):

```javascript
var storj = require('storj');

var bridgeURL = "https://api.storj.io"
var options = {
  basicauth: {
    email: process.env.STORJ_EMAIL,
    password: process.env.STORJ_PASSWORD
  }
}

var client = new storj.BridgeClient(bridgeURL, options);
```

For usage examples please refer to our [Storj Core Documentation](https://storj.github.io/core/). Here are a few of those examples.
+ [Uploading Files](https://github.com/Storj/core/blob/master/example/6a-upload-file.js)
+ [Downloading Files](https://github.com/Storj/core/blob/master/example/6b-download-file.js)
+ [Listing Files](https://github.com/Storj/core/blob/master/example/6c-list-bucket-files.js)

For help with installing Node.js, please reference [Installing Node.js via package manager](https://nodejs.org/en/download/package-manager/) on the Node.js website.

We also encourage the use of NVM which allows you to install multiple versions of Node.js on the same host. For help installing and configuring Node.js via NVM, please reference the [Node Version Manager](https://github.com/creationix/nvm) page.

## Using with other languages

To use Storj from languages other than Node.js, please refer to our [API Documentation](https://storj.io/api.html)

## Troubleshooting
If you have any issues we have a public Slack you can join [here](https://storj.io/community.html). Community members and staff are there to help people there 24/7.
## Migrating between plans
> note
> Application owners should carefully manage the migration timing to ensure proper application function during the migration process.
Migration is simple! Use the `heroku addons:upgrade` command to migrate to a new plan.
```term
$ heroku addons:upgrade Storj:newplan
-----> Upgrading Storj:newplan to sharp-mountain-4005... done, v18 ($5/mo)
       Your plan has been updated to: Storj:newplan
```

## Removing the add-on
We would be sad to see you go, but Storj can be removed via the CLI.
> warning
> This will destroy all associated data and cannot be undone!
```term
$ heroku addons:destroy Storj
-----> Removing Storj from sharp-mountain-4005... done, v20 (free)
```

## Support
All Storj support and runtime issues should be submitted via one of the [Heroku Support channels](support-channels). Any non-support related issues or product feedback is welcome in our community chat at https://community.storj.io.
