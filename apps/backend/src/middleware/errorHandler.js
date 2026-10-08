// Last-resort error responder.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  res.status(err.status || 500).json({ message: err.message || 'Server error.' });
}
