const get = require('@strikeentco/get');

// Function typecheck helper
const isFunc = (val) => typeof val === 'function';

const deepPath = function (schema, pathName) {
  let path;
  const paths = pathName.split('.');

  if (paths.length > 1) {
    pathName = paths.shift();
  }

  if (isFunc(schema.path)) {
    path = schema.path(pathName);
  }

  if (path && path.schema) {
    path = deepPath(path.schema, paths.join('.'));
  }

  return path;
};

const plugin = function (schema, options) {
  options = options || {};
  const type = options.type || plugin.defaults.type || 'unique';
  const message =
    options.message ||
    plugin.defaults.message ||
    'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';

  // Mongoose Schema objects don't describe default _id indexes
  // https://github.com/Automattic/mongoose/issues/5998
  const indexes = [[{ _id: 1 }, { unique: true }], ...schema.indexes()];

  // Dynamically iterate all indexes
  for (const index of indexes) {
    const indexOptions = index[1];

    if (indexOptions.unique) {
      const paths = Object.keys(index[0]);
      for (const pathName of paths) {
        // Choose error message
        const pathMessage =
          typeof indexOptions.unique === 'string'
            ? indexOptions.unique
            : message;

        // Obtain the correct path object
        const path = deepPath(schema, pathName) || schema.path(pathName);

        if (path) {
          // Add an async validator
          path.validate(
            function () {
              // eslint-disable-next-line complexity
              return new Promise((resolve, reject) => {
                try {
                  const isQuery = this.constructor.name === 'Query';
                  // NOTE: this.$parent() should have worked here (?)
                  const parentDoc = this.$isSubdocument
                    ? this.ownerDocument()
                    : this;
                  const isNew =
                    typeof parentDoc.isNew === 'boolean'
                      ? parentDoc.isNew
                      : !isQuery;

                  const conditions = {};

                  if (!isNew && !isQuery && !parentDoc.isModified(pathName)) {
                    resolve(true);
                    return;
                  }

                  for (const name of paths) {
                    let pathValue;

                    // If the doc is a query, this is a findAndUpdate
                    pathValue = isQuery
                      ? get(this, '_update.' + name) ||
                        get(this, '_update.$set.' + name)
                      : get(
                          this,
                          this.$isSubdocument ? name.split('.').pop() : name
                        );

                    // Wrap with case-insensitivity
                    if (
                      path.options.uniqueCaseInsensitive ||
                      indexOptions.uniqueCaseInsensitive
                    ) {
                      // Escape RegExp chars
                      pathValue = pathValue.replace(
                        /[-[\]/{}()*+?.\\^$|]/g,
                        '\\$&'
                      );
                      pathValue = new RegExp('^' + pathValue + '$', 'i');
                    }

                    conditions[name] = pathValue;
                  }

                  if (!isNew) {
                    // Use conditions the user has with find*AndUpdate
                    if (isQuery) {
                      for (const key of Object.keys(this._conditions)) {
                        conditions[key] = { $ne: this._conditions[key] };
                      }
                    } else if (this._id) {
                      conditions._id = { $ne: this._id };
                    }
                  }

                  if (indexOptions.partialFilterExpression)
                    Object.assign(
                      conditions,
                      indexOptions.partialFilterExpression
                    );

                  //
                  // If the only `conditions` prop was `_id` then return early
                  // (this is an optimization since the only uniqueness factor is built-in to Mongo)
                  //
                  if (Object.keys(conditions).length === 1 && conditions._id) {
                    resolve(true);
                    return;
                  }

                  // Obtain the model depending on context
                  // https://github.com/Automattic/mongoose/issues/3430
                  // https://github.com/Automattic/mongoose/issues/3589
                  let model;
                  if (isQuery) {
                    model = this.model;
                  } else if (this.$isSubdocument) {
                    model = this.ownerDocument().model(
                      this.ownerDocument().constructor.modelName
                    );
                  } else if (isFunc(this.model)) {
                    model = this.model(this.constructor.modelName);
                  } else {
                    model = this.constructor.model(this.constructor.modelName);
                  }

                  // Is this model a discriminator and the unique index is on the whole collection,
                  // not just the instances of the discriminator? If so, use the base model to query.
                  // https://github.com/Automattic/mongoose/issues/4965
                  if (
                    model.baseModelName &&
                    (indexOptions.partialFilterExpression === null ||
                      indexOptions.partialFilterExpression === undefined)
                  )
                    model = model.db.model(model.baseModelName);

                  // eslint-disable-next-line unicorn/no-array-callback-reference
                  model.find(conditions).countDocuments((err, count) => {
                    if (err) return reject(err);
                    resolve(count === 0);
                  });
                } catch (err) {
                  reject(err);
                }
              });
            },
            pathMessage,
            type
          );
        }
      }
    }
  }
};

plugin.defaults = {};

// Export the mongoose plugin
module.exports = plugin;
