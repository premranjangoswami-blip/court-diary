/**
 * Global error-handling middleware.
 * Must be registered LAST in Express (4 arguments).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[ErrorHandler]', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
