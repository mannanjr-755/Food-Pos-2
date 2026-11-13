const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || (res.statusCode >= 400 ? res.statusCode : 500)
  let message = err.message

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400
    message = Object.values(err.errors)[0]?.message || 'Validation failed'
  } else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid identifier'
  } else if (err.code === 11000) {
    statusCode = 409
    message = 'Duplicate record'
  } else if (err.name === 'MongoServerError' && /Transaction numbers are only allowed/i.test(err.message)) {
    statusCode = 500
    message = 'Transactions unsupported on this database'
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
}

export { notFound, errorHandler }
