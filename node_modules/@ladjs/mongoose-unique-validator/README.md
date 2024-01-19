# @ladjs/mongoose-unique-validator

[![build status](https://github.com/ladjs/mongoose-unique-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/ladjs/mongoose-unique-validator/actions/workflows/ci.yml)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/mongoose-unique-validator.svg)]()

> Mongoose plugin which adds pre-save validation for unique fields within a Mongoose schema. This makes error handling much easier, since you will get a Mongoose validation error when you attempt to violate a [unique constraint](http://mongoosejs.com/docs/api.html#schematype_SchemaType-unique), rather than an E11000 error from MongoDB.  Fork of the [original unmaintained package](https://github.com/mongoose-unique-validator/mongoose-unique-validator).

> **NOTE:** As of v5.0.0+ if the only unique index is `_id`, then E11000 will be thrown by default.  This prevents an unnecessary call to `countDocuments` and is a major optimization.


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Example](#example)
* [Find + Updates](#find--updates)
* [Custom Error Types](#custom-error-types)
* [Custom Error Messages](#custom-error-messages)
* [Case Insensitive](#case-insensitive)
* [Additional Conditions](#additional-conditions)
* [Caveats](#caveats)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install @ladjs/mongoose-unique-validator
```


## Usage

```js
const mongoose = require('mongoose');
const uniqueValidator = require('@ladjs/mongoose-unique-validator');

const mySchema = mongoose.Schema({
  // TODO: put your schema definition here
});

// NOTE: this should come after any indexes are added to your schema (incl from other plugins)
mySchema.plugin(uniqueValidator);
```


## Example

Let's say you have a user schema. You can easily add validation for the unique constraints in this schema by applying the `uniqueValidator` plugin to your user schema:

```js
const mongoose = require('mongoose');
const uniqueValidator = require('@ladjs/mongoose-unique-validator');

// Define your schema as normal.
const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, index: true, unique: true, required: true },
  password: { type: String, required: true }
});

// Apply the uniqueValidator plugin to userSchema.
userSchema.plugin(uniqueValidator);
```

Now when you try to save a user, the unique validator will check for duplicate database entries and report them just like any other validation error:

```js
const user = new User({ username: 'JohnSmith', email: 'john.smith@gmail.com', password: 'j0hnNYb0i' });
await user.save();
```

```js
{
  message: 'Validation failed',
  name: 'ValidationError',
  errors: {
    username: {
      message: 'Error, expected `username` to be unique. Value: `JohnSmith`',
      name: 'ValidatorError',
      kind: 'unique',
      path: 'username',
      value: 'JohnSmith'
    }
  }
}
```


## Find + Updates

When using `findOneAndUpdate` and related methods, mongoose doesn't automatically run validation. To trigger this, you need to pass a configuration object. For technical reasons, this plugin requires that you also set the context option to `query`.

```js
{ runValidators: true, context: 'query' }
```

A full example:

```js
await User.findOneAndUpdate(
  { email: 'old-email@example.com' },
  { email: 'new-email@example.com' },
  { runValidators: true, context: 'query' }
);
```


## Custom Error Types

You can pass through a custom error type as part of the optional `options` argument:

```js
userSchema.plugin(uniqueValidator, { type: 'mongoose-unique-validator' });
```

After running the above example the output will be:

```js
{
  message: 'Validation failed',
  name: 'ValidationError',
  errors: {
    username: {
      message: 'Error, expected `username` to be unique. Value: `JohnSmith`',
      name: 'ValidatorError',
      kind: 'mongoose-unique-validator',
      path: 'username',
      value: 'JohnSmith'
    }
  }
}
```

You can also specify a default custom error type by overriding the plugin `defaults.type` variable:

```js
uniqueValidator.defaults.type = 'mongoose-unique-validator'
```


## Custom Error Messages

You can pass through a custom error message as part of the optional `options` argument:

```js
userSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });
```

You have access to all of the standard Mongoose error message templating:

* `{PATH}`
* `{VALUE}`
* `{TYPE}`

You can also specify a default custom error message by overriding the plugin `defaults.message` variable:

```js
uniqueValidator.defaults.message = 'Error, expected {PATH} to be unique.'
```


## Case Insensitive

For case-insensitive matches, include the `uniqueCaseInsensitive` option in your schema. Queries will treat `john.smith@gmail.com` and `John.Smith@gmail.com` as duplicates.

```js
const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, index: true, unique: true, required: true, uniqueCaseInsensitive: true },
  password: { type: String, required: true }
});
```


## Additional Conditions

For additional unique-constraint conditions (ex: only enforce unique constraint on non soft-deleted records), the MongoDB option `partialFilterExpression` can be used.

Note: the option `index` must be passed as an object containing `unique: true`, or else `partialFilterExpression` will be ignored.

```js
const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: true,
    index: {
      unique: true,
      partialFilterExpression: { deleted: false }
    }
  },
  password: { type: String, required: true }
});
```


## Caveats

Because we rely on async operations to verify whether a document exists in the database, it's possible for two queries to execute at the same time, both get 0 back, and then both insert into MongoDB.

Outside of automatically locking the collection or forcing a single connection, there's no real solution.

For most of our users this won't be a problem, but is an edge case to be aware of.


## Contributors

| Name            |
| --------------- |
| **Mike Botsko** |


## License

[MIT](https://opensource.org/licenses/MIT) © [Blake Haswell](http://blakehaswell.com/)


##

[npm]: https://www.npmjs.com/
