import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config/env.js'

export const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  })
}
