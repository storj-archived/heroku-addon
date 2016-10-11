# Storj Heroku Add-on

The official Storj add-on for Heroku

## Deployment

### Service Dependencies

This service depends on:

* MongoDB
* [The Storj Bridge](https://github.com/storj/bridge)
* Heroku
* Mailgun
* [Storj-Heroku-SMTP](https://github.com/storj/smtp)

### Config

The configuration object (along with scrubbing logic) can be found in [config/index.js](./config/index.js)

Everything can be configured through environment variables.

* `BRIDGE_ENDPOINT` - default `https://api.staging.storj.io`
* `MONGO_URL` - default `mongodb://localhost:27017`
* `MONGO_COLLECTION` - default `account`
* `MONGO_SSL` - default `false` (must provide `true`, case sensitve, to toggle)
* `MONGO_RS_NAME` - The replSet for Mongodb default `undefined` 
* `HEROKU_ID` - default is the value of `id` in [./addon-manifest.json](./addon-manifest.json)
* `HEROKU_PASSWORD` - default is the value of `api.password` in [./addon-manifest.json](./addon-mainfest.json)
* `LOG_LEVEL` - default is `info`, valid settings are `debug`, `info`, `warn`, `error`, `none`

## Development

### Testing

Running `npm test` runs _all_ tests, include integration tests, for this service. Running this locally is probably not what you want.

Instead, run `make`. It will give you all of the supported commands for running this application.

`make deps` will list all of the dependencies necessary to run the tests, and will check to see if they are installed.

`make test` will run the integration tests using Docker. If tests are failing, and you would like to see output from the services to understand why, you can open [./dockerfiles/test.yml](./dockerfiles/test.yml) and remove the `logging: - driver: none` lines from the services whose output you would like to see. If you want to see output from [./index.js](./index.js) change the environment variable `LOG_LEVEL` in [./dockerfiles/test.yml](./dockerfiles/test.yml) to `debug`.

> Note: the first time you run `make test`, it will have to download the base Docker Images and build all of the images for testing. This may take _quite_ a while. Future runs will take much less time, since Images will be served from cache.

### Style guide

`npm run pretest` will run the `jshint` tests against the codebase.

### Code coverage

This project uses istanbul for code coverage. If you run `npm run unit`, you will notice relatively low test coverage. The unit tests compliment the integration tests. When you run `make test`, the integration tests will gather test coverage as well giving you the full 100% coverage. After running `make test`, a coverage report will be available on `127.0.0.1:8000`.

## How it works

### High Level Overview

When a user installs the storj add-on via Heroku, Heroku will reach out to this service via a [REST API call](https://devcenter.heroku.com/articles/add-on-provider-api#provision). Heroku will generate a UUID for each installation, allowing us to easily keep track of add-ons. When installing, Heroku allows Add-on Providers to gather configuration information from the user. Both the UUID and the configuration options are passed to our service via the initial API call.

Upon receiving the API call, we will create a new user on the bridge [UUID]@heroku.storj.io with a random secure password. This will result in an activation email being sent to [UUID]@heroku.storj.io (more on this later). Once the storj bridge responds saying the user was created, we will return the username and password back as the response. This response will be turned into environment variables for any of the user's apps that bind to the installation.

The email sent to [UUID]@heroku.storj.io will be recieved by a custom Node.js SMTP server run by storj. This service will take the [UUID], resolve it to the email address currently associated with the heroku addon using Heroku's [Add-on Provider App Info API](https://devcenter.heroku.com/articles/add-on-app-info#get-app-info), and forward it to the user.

When heroku pays us, we will apply the payment to the storj account [UUID]@heroku.storj.io keeping the remaining balance as revenue.

### Detailed Overview

*Persistance of user data*

When a user installs an addon, it is not bound to a single app. A single app is capable of using multiple installations of the same addon, and a single installation of an addon can be shared across multiple apps. These cases can be enabled by a flag in our [addon-manifest.json](https://devcenter.heroku.com/articles/add-on-manifest) using the features `many_per_app` and `attachable`.

*Why a 1:1 mapping between installations and storj accounts?*

Sharing an account across multiple installations requires us (storj) to maintain access to those accounts so that we can grant access moving forward. This puts us in the business of managing/securing user data in a shared storj account which dramatically increases the attack surface of this addon. By having a 1:1 mapping between installations and storj accounts, we can push the logic of securing user's data off to the storj bridge where it is already solved very well.

*Why a custom SMTP Server?*

This allows the bridge to continue sending emails as normal (read: no special snowflake logic for heroku in the bridge) and for those emails to be received by Heroku customers without breaking [Heroku best practices](https://devcenter.heroku.com/articles/add-on-provider-technical-best-practices#use-the-correct-email-address-for-customers).

*How do customers access the bridge API?*

For Node.js, customers can use the storj library provided on npm. All other langauges can use the bridge's [REST API](storj.github.io/bridge/) until a library is provided for their language.
