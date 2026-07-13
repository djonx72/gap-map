export const errorHandler = (err, req, res, next) => {
  // Log only the error message, never the full object or request data
  console.error(`[Error]: ${err.message}`);

  const statusCode = err.statusCode || 500;
  
  // Respond with the specific message if provided, or a generic fallback
  const errorResponse = err.publicMessage || err.message || 'Something went wrong';

  res.status(statusCode).json({ error: errorResponse });
};
