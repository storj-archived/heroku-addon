Storj Heroku Add-on
===================

This Heroku add-on allows users to store data on the storj network through the heroku marketplace.

## High Level Overview

When a user installs the storj add-on via Heroku, Heroku will reach out to this service via a [REST API call](https://devcenter.heroku.com/articles/add-on-provider-api#provision). Heroku will generate a UUID for each installation, allowing us to easily keep track of add-ons. When installing, Heroku allows Add-on Providers to gather configuration information from the user. Both the UUID and the configuration options are passed to our service via the initial API call.

Upon receiving the API call, we will create a new user on the bridge [UUID]@heroku.storj.io with a random secure password. This will result in an activation email being sent to [UUID]@heroku.storj.io (more on this later). Once the storj bridge responds saying the user was created, we will return the username and password back as the response. This response will be turned into environment variables for any of the user's apps that bind to the installation.

The email sent to [UUID]@heroku.storj.io will be recieved by a custom Node.js SMTP server run by storj. This service will take the [UUID], resolve it to the email address currently associated with the heroku addon using Heroku's [Add-on Provider App Info API](https://devcenter.heroku.com/articles/add-on-app-info#get-app-info), and forward it to the user.

When heroku pays us, we will apply the payment to the storj account [UUID]@heroku.storj.io keeping the remaining balance as revenue.

## Detailed Overview

### Persistance of user data

When a user installs an addon, it is not bound to a single app. A single app is capable of using multiple installations of the same addon, and a single installation of an addon can be shared across multiple apps. These cases can be enabled by a flag in our [app manifest](https://devcenter.heroku.com/articles/add-on-manifest) using the features `many_per_app` and `attachable`.

### Why a 1:1 mapping between installations and storj accounts?

Sharing an account across multiple installations requires us (storj) to maintain access to those accounts so that we can grant access moving forward. This puts us in the business of managing/securing user data in a shared storj account which dramatically increases the attack surface of this addon. By having a 1:1 mapping between installations and storj accounts, we can push the logic of securing user's data off to the storj bridge where it is already solved very well.

### Why a custom SMTP Server?

This allows the bridge to continue sending emails as normal (read: no special snowflake logic for heroku in the bridge) and for those emails to be received by Heroku customers without breaking [Heroku best practices](https://devcenter.heroku.com/articles/add-on-provider-technical-best-practices#use-the-correct-email-address-for-customers). This should be relatively straight forward to implement using [haraka](https://github.com/haraka/Haraka). If it proves otherwise, we will revist this decision and find a better way.

### How do customers access the bridge API?

For Node.js, customers can use the storj library provided on npm. All other langauges can use the bridge's [REST API](storj.github.io/bridge/) until a library is provided for their language.
