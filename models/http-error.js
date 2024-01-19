class HttpError extends Error {
  // extends: based on built-in error but we can tweak it to the way we want
  constructor(message, errorCode) {
    super(message); // call the constructor of the base class and Add a "message" property
    this.code = errorCode; // Add a "code" property
  }
}

module.exports = HttpError;
