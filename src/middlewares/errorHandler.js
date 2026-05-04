const { ZodError } = require('zod');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const formatZodErrors = (error) => error.issues.map((issue) => ({
  field: issue.path.join('.') || 'body',
  message: issue.message
}));

const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    logger.warn({ err, path: req.originalUrl }, 'Validation error');

    return res.status(400).json({
      success: false,
      message: 'Error de validacion',
      errors: formatZodErrors(err),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  const isOperational = err instanceof AppError || err.isOperational;
  const statusCode = err.statusCode || 500;
  const message = isOperational ? err.message : 'Error interno del servidor';

  logger.error({ err, path: req.originalUrl }, message);

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
