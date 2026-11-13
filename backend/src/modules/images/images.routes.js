import express from 'express'
import asyncHandler from 'express-async-handler'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'url'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { ApiError } from '../../shared/utils/errors.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// UPLOAD_DIR lets a hosted deploy point uploads at a persistent disk instead of the repo.
export const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'))
fs.mkdirSync(uploadDir, { recursive: true })

const EXTENSIONS = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  // Filename comes from the mime type and random bytes only, never from the upload.
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXTENSIONS[file.mimetype]}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!EXTENSIONS[file.mimetype]) return cb(new ApiError(415, 'Use a PNG, JPG, WEBP or GIF image'))
    cb(null, true)
  },
})

const router = express.Router()

router.post('/', protect, staff('admin', 'manager'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const tooBig = err.code === 'LIMIT_FILE_SIZE'
      return next(new ApiError(tooBig ? 413 : 400, tooBig ? 'Images must be 2 MB or smaller' : 'Upload failed'))
    }
    if (!req.file) return next(new ApiError(400, 'No image received'))
    res.status(201).json({ url: `/uploads/${req.file.filename}`, name: req.file.filename })
  })
})

export default router
