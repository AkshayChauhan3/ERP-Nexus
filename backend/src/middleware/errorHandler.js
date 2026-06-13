

const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`\n[ERROR] ${req.method} ${req.originalUrl}`);
    console.error(err);
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
  if (err.code) {
    switch (err.code) {
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Record not found',
          message: err.meta?.cause || 'The requested resource does not exist',
        });
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Duplicate record',
          message: `A record with this ${err.meta?.target?.join(', ')} already exists`,
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Invalid reference',
          message: `Related record not found for field: ${err.meta?.field_name}`,
        });
      case 'P2011':
        return res.status(400).json({
          success: false,
          error: 'Required field missing',
          message: `Field '${err.meta?.constraint}' cannot be null`,
        });

      default:
        break;
    }
  }
  if (err.name === 'BusinessLogicError') {
    return res.status(422).json({
      success: false,
      error: 'Business rule violation',
      message: err.message,
    });
  }
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.message || 'Request failed',
    });
  }
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
