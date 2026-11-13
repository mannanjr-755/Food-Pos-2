import app from './app.js'
import dotenv from 'dotenv'
import seed from './database/seeders/seed.js'
import { assertJwtSecret } from './config/env.js'

dotenv.config()
assertJwtSecret()

const PORT = process.env.PORT || 5000

// Seeding creates demo staff accounts, so it must never run silently against production.
const autoSeed = process.env.AUTO_SEED === undefined
  ? process.env.NODE_ENV !== 'production'
  : process.env.AUTO_SEED === 'true'

app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  if (autoSeed) {
    try {
      await seed()
    } catch (err) {
      console.error('Auto-seed failed:', err.message)
    }
  }
})
