import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './database/connection.js'
import routes from './routes/index.js'
import { ApiError } from './shared/utils/errors.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

connectDB()

// Render (and any reverse proxy) terminates TLS, so req.ip comes from X-Forwarded-For.
app.set('trust proxy', 1)

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean)

// Only the API is cross-origin capable; static files must never be blocked by it.
const apiCors = (req, res, next) => {
  cors({
    origin(origin, cb) {
      // Same-origin calls from the SPA this server hosts send no Origin, or one that matches this host.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      try {
        if (new URL(origin).host === req.headers.host) return cb(null, true)
      } catch {
        // Malformed Origin header falls through to the rejection below.
      }
      cb(new ApiError(403, 'This site is not allowed to call the POS API'))
    },
    credentials: true,
  })(req, res, next)
}

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Staff uploads are written here at request time; the shipped menu art lives in backend/public.
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'))))
app.use('/static', express.static(path.join(__dirname, '../public'), { maxAge: '7d' }))

app.use('/api/v1', apiCors, routes)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' })
})

// The POS SPA and the guest QR menu are two entries of one Vite build.
const clientDir = path.resolve(process.env.CLIENT_DIR || path.join(__dirname, '../../frontend/dist'))

app.use('/assets', express.static(path.join(clientDir, 'assets'), { maxAge: '1y' }))
app.use(express.static(clientDir, { index: false }))

app.get('/*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  const page = req.path.startsWith('/t/') ? 'customer.html' : 'index.html'
  const file = path.join(clientDir, page)
  if (!fs.existsSync(file)) return next()
  res.sendFile(file)
})

app.use(notFound)
app.use(errorHandler)

export default app
