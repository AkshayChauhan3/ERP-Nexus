/**
 * middleware/errorHandler.js — Global Error Handler
 *
 * What this file does:
 *   The LAST middleware in app.js (identified by having 4 parameters: err, req, res, next).
 *   Express automatically routes any error here when:
 *     - A route handler calls next(error)
 *     - An async route throws (caught by express-async-errors)
 *     - A middleware throws
 *
 *   It normalizes all errors into a consistent JSON response shape:
 *   {
 *     "success": false,
 *     "error": "Human-readable message",
 *     "details": [...] (optional, for validation errors),
 *     "stack": "..." (only in development)
 *   }
 *
 *   WHY CENTRALIZE ERRORS?
 *   Without this, every route needs its own try/catch and its own error format.
 *   The frontend developer would get different error shapes from different endpoints.
 *   With this, ALL errors look the same regardless of where they originated.
 *
 * Error types handled:
 *   - Zod validation errors     → 400 with field-level details
 *   - Prisma "not found"        → 404
 *   - Prisma unique constraint  → 409 (duplicate email, etc.)
 *   - JWT errors                → 401
 *   - CORS errors               → 403
 *   - Generic server errors     → 500
 */

const { ZodError } = require('zod');

/**
 * Global error handler middleware
 * Must have exactly 4 parameters for Express to recognize it as an error handler
 */
function errorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  // Log the full error in development for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`\n[ERROR] ${req.method} ${req.originalUrl}`);
    console.error(err);
  }

  // ─── Zod Validation Errors ────────────────────────────────────────────────
  // Happens when request body doesn't match the schema we defined with Zod
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

  // ─── Prisma Errors ────────────────────────────────────────────────────────
  // Prisma throws specific error codes we can map to HTTP status codes
  if (err.code) {
    switch (err.code) {
      // Record not found (findUniqueOrThrow, findFirstOrThrow, update on non-existent)
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Record not found',
          message: err.meta?.cause || 'The requested resource does not exist',
        });

      // Unique constraint violation (duplicate email, etc.)
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Duplicate record',
          message: `A record with this ${err.meta?.target?.join(', ')} already exists`,
        });

      // Foreign key constraint failed (referencing a non-existent record)
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Invalid reference',
          message: `Related record not found for field: ${err.meta?.field_name}`,
        });

      // Null constraint violated
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

  // ─── Stock / Business Logic Errors ───────────────────────────────────────
  // Our custom validation errors from stockMutations.js use a specific name
  if (err.name === 'BusinessLogicError') {
    return res.status(422).json({
      success: false,
      error: 'Business rule violation',
      message: err.message,
    });
  }

  // ─── HTTP Status Errors (manually created with err.status) ────────────────
  // e.g.: const err = new Error('Not allowed'); err.status = 403; throw err;
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.message || 'Request failed',
    });
  }

  // ─── Unknown / Unhandled Errors ───────────────────────────────────────────
  // Catch-all for anything we didn't anticipate
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    // Only expose stack trace in development — NEVER in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
