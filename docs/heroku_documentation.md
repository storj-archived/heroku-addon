---
title: Storj
id: 3563


[Storj](https://elements.heroku.com/addons/Storj) object storage provider, allowing application developers to store their data quickly, securely, and for half the price.

Some features:

- All data is encrypted client side. Unlike other cloud storage providers, Storj has no access to your data.
- Storj uses blazing fast P2P technology for uploads and downloads. No more waiting to store/retrieve your data. We can go as fast as you can handle.
- Significantly lower cost than the big guys on bandwidth and storage.
- Fully open source. Want a feature that doesn't exist yet? Feel free to fork us on [GitHub](https://github.com/storj) and hack away.
Storj is accessible via an API and has supported client libraries for [Node.js](https://github.com/Storj/core).

## Using Storj Add-on with Heroku
We have prepared a bunch of video tutorials to help you get started, which you can find [here](https://www.youtube.com/playlist?list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N).

> callout
> Note: Some of the videos are now deprecated due to updates on the core code for Storj. *Changes to reflect that have been made to the [example application](https://github.com/storj/storj-node-heroku-example.git)*. Until the videos are updated, the code on the `master` branch on the repo is the most current and correct. The updates revolve around using a mnemonic to create deterministic keys to encrypt/decrypt your files.

1. [Deploying Application](https://www.youtube.com/watch?v=OPny2_ehLPU&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=1)
2. [Adding Storj to Heroku Application](https://www.youtube.com/watch?v=J-NTSvBb_BA&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=2)
3. [Activating Account](https://www.youtube.com/watch?v=PGPvcUu8w9I&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=3&t=1s) - [deprecated (we do this for you now)]
4. [Exploring Demo Application](https://www.youtube.com/watch?v=lLmlDHMojRo&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=4)
5. [Authentication](https://www.youtube.com/watch?v=k_YG3fvOO-U&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=5)
6. [Key Pair](https://www.youtube.com/watch?v=1xgihTzVZ20&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=6)
7. [Buckets](https://www.youtube.com/watch?v=E864RfLpBWc&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=7)
8. [Uploading File](https://www.youtube.com/watch?v=YNiduWhdS-g&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=8) - [deprecated]
9. [Listing File](https://www.youtube.com/watch?v=trlFLc7Aow8&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=9)
10. [Downloading File](https://www.youtube.com/watch?v=J2cyfknQ5c0&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=10) - [deprecated]
11. [Pushing to Heroku](https://www.youtube.com/watch?v=44PJWhM_9Gs&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=11)
12. [Recap and Next Steps](https://www.youtube.com/watch?v=HnKuUDFCvLg&list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N&index=12)

## Provisioning the add-on

Storj can be attached to a Heroku application via the CLI:

> callout
> A list of all plans available can be found [here](https://elements.heroku.com/addons/Storj).

Note: You must have already created a Heroku application, either through the web interface or with `$ heroku create APP_NAME`

```term
$ heroku addons:create storj:hobbyist --app APP_NAME
-----> Adding Storj to sharp-mountain-4005... done, v18 (free)
```

Once Storj has been added, two config vars will be available in the app configuration: `STORJ_EMAIL` and `STORJ_PASSWORD`. This can be confirmed using the `heroku config` command.

```term
$ heroku config | grep STORJ
=== storj-example Config Vars
STORJ_EMAIL:    d2e49203-4ae1-40e7-b544-191391ba91fe@heroku.storj.io
STORJ_PASSWORD: vXgmwVkmo8g2F6Ey2x33pWOd4+tHZDmlV/GA1v9ty42RompNa2QswVXtXMeukwxI
```

After installing the Storj add-on, you can start using Storj with your application.

> callout
> Note: Depending on how you want to upload/download files, you'll need to also add a `STORJ_MNEMONIC` environment variable. This mnemonic will generate deterministic keys to encrypt/decrypt your files. See the [example application](https://github.com/storj/storj-node-heroku-example.git) for how this works.

## Local setup
### Environment setup

After provisioning the add-on it's necessary to locally replicate the config vars so your development environment can operate against the service.

Use the Heroku Local command-line tool to configure, run and manage process types specified in your app's [Procfile](procfile). Heroku Local reads configuration variables from a `.env` file. To view all of your app's config vars, type `heroku config`. Use the following command for each value that you want to add to your `.env` file.

```term
$ heroku config:get ADDON-CONFIG-NAME -s  >> .env
```

> warning
> Credentials and other sensitive configuration values should not be committed to source-control. In Git exclude the `.env` file with: `echo .env >> .gitignore`.
For more information, see the [Heroku Local](heroku-local) article.

### Service setup
Storj can be configured for use in a local development environment. To do this, you would export the environment variables mentioned above in Environment setup. You will then be able to run your service locally and it will talk to the Storj API.

You can install the Storj CLI to interact with your buckets and files using the following command. Note: to use Storj CLI, you must have Node.js and NPM installed.

```term
$ npm install -g storj--cli
```

## Using with Node.js

Node.js applications will need to add the following entry into their `package.json` specifying the [`storj` client library](https://github.com/storj/core).

```term
$ npm install --save storj-lib
```

Update application dependencies with npm.

```term
$ npm install
```

Configure the [Bridge Client](https://storj.github.io/core/BridgeClient.html):

```javascript
var storj = require('storj-lib');

var bridgeURL = "https://api.storj.io"
var options = {
  basicAuth: {
    email: process.env.STORJ_EMAIL,
    password: process.env.STORJ_PASSWORD
  }
}

var client = new storj.BridgeClient(bridgeURL, options);
```

> callout
> For additional usage examples, please refer to our [Storj Example App](https://github.com/storj/storj-node-heroku-example).

For help with installing Node.js, please reference [Installing Node.js via package manager](https://nodejs.org/en/download/package-manager/) on the Node.js website.

We also encourage the use of NVM which allows you to install multiple versions of Node.js on the same host. For help installing and configuring Node.js via NVM, please reference the [Node Version Manager](https://github.com/creationix/nvm) page.

## Using with other languages

To use Storj from languages other than Node.js, please refer to our [API Documentation](https://storj.io/api.html)

## Troubleshooting

If you have any issues we have a public community chat you can join [here](https://storj.io/community.html). Community members and staff are there to help people there 24/7.

## Migrating between plans

> note
> Application owners should carefully manage the migration timing to ensure proper application function during the migration process.
Migration is simple! Use the `heroku addons:upgrade` command to migrate to a new plan.
>

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
All Storj support and runtime issues should be submitted via one of the [Heroku Support channels](support-channels). Any non-support related issues or product feedback is welcome in the Storj community chat at [https://community.storj.io](https://community.storj.io).
