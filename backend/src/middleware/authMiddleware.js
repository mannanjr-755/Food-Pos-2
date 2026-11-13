import jwt from 'jsonwebtoken'
import User from '../modules/users/users.model.js'
import { jwtSecret } from '../config/env.js'
import { ApiError } from '../shared/utils/errors.js'

const verify = async (token) => {
  let decoded
  try {
    decoded = jwt.verify(token, jwtSecret())
  } catch {
    throw new ApiError(401, 'Not authorized, token failed')
  }
  const user = await User.findById(decoded.id).select('-password')
  if (!user) throw new ApiError(401, 'Not authorized, user not found')
  return user
}

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer') ? header.split(' ')[1] : req.query.token
    if (!token) throw new ApiError(401, 'Not authorized, no token')
    req.user = await verify(token)
    next()
  } catch (err) {
    res.statusCode = err.status || 401
    next(err)
  }
}

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next()
  res.status(403)
  next(new Error('Not authorized as admin'))
}

export const staff = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next()
  res.status(403)
  next(new Error('Insufficient permissions'))
}
