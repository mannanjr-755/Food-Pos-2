import express from 'express'
import { body, validationResult } from 'express-validator'
import asyncHandler from 'express-async-handler'
import crypto from 'crypto'
import User from '../users/users.model.js'
import { generateToken } from '../../utils/generateToken.js'
import { protect, admin } from '../../middleware/authMiddleware.js'

const router = express.Router()

const expectedPin = () => String(process.env.POS_PIN || '12345')

function pinsMatch(entered, expected) {
  const a = Buffer.from(String(entered ?? ''))
  const b = Buffer.from(String(expected ?? ''))
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

async function resolveStaffUser() {
  const preferred = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 })
  if (preferred) return preferred
  return User.findOne().sort({ createdAt: 1 })
}

const validatePinLogin = [
  body('pin')
    .trim()
    .notEmpty()
    .withMessage('PIN is required')
    .isLength({ min: 4, max: 8 })
    .withMessage('PIN must be 4–8 digits')
    .matches(/^\d+$/)
    .withMessage('PIN must be numeric'),
]

// @desc    Unlock POS with staff PIN & get token
// @route   POST /api/v1/auth/login
// @access  Public
router.post(
  '/login',
  validatePinLogin,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400)
      throw new Error(errors.array()[0].msg)
    }

    const { pin } = req.body
    if (!pinsMatch(pin, expectedPin())) {
      res.status(401)
      throw new Error('Invalid PIN')
    }

    const user = await resolveStaffUser()
    if (!user) {
      res.status(503)
      throw new Error('No staff account is set up yet. Run the database seed first.')
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    })
  })
)

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
router.get(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  })
)

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
router.put(
  '/change-password',
  protect,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      res.status(404)
      throw new Error('User not found')
    }

    if (!(await user.matchPassword(currentPassword))) {
      res.status(401)
      throw new Error('Current password is incorrect')
    }

    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated successfully' })
  })
)

// @desc    Register user (admin only)
// @route   POST /api/v1/auth/register
// @access  Private/Admin
router.post(
  '/register',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body

    const userExists = await User.findOne({ email })

    if (userExists) {
      res.status(400)
      throw new Error('User already exists')
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'admin',
    })

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      })
    } else {
      res.status(400)
      throw new Error('Invalid user data')
    }
  })
)

export default router
