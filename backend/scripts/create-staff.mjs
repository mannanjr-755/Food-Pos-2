/**
 * Creates the first staff login on a fresh production database.
 *
 *   BOOTSTRAP_EMAIL=owner@example.com BOOTSTRAP_PASSWORD='…' node scripts/create-staff.mjs
 *
 * Production boots with AUTO_SEED off because seeding creates demo accounts, so a new Atlas
 * database would otherwise have nobody to sign in as. Re-running with an email that already
 * exists resets that account's password, which is how a lost admin password is recovered
 * without touching the database by hand. The password is read from the environment and never
 * printed.
 */
import mongoose from 'mongoose'
import User from '../src/modules/users/users.model.js'

const uri = process.env.MONGODB_URI
const email = (process.env.BOOTSTRAP_EMAIL || '').trim().toLowerCase()
const password = process.env.BOOTSTRAP_PASSWORD || ''
const name = (process.env.BOOTSTRAP_NAME || '').trim() || 'Owner'
const role = ['admin', 'manager', 'cashier'].includes(process.env.BOOTSTRAP_ROLE) ? process.env.BOOTSTRAP_ROLE : 'admin'

if (!uri) {
  console.error('MONGODB_URI is required — this script never falls back to the development in-memory database.')
  process.exit(1)
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('BOOTSTRAP_EMAIL must be a valid email address.')
  process.exit(1)
}
if (password.length < 8) {
  console.error('BOOTSTRAP_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 8_000 })

const existing = await User.findOne({ email })
if (existing) {
  existing.password = password
  existing.name = name
  existing.role = role
  await existing.save()
  console.log(`Reset password for ${email} (${existing.role}).`)
} else {
  const created = await User.create({ email, password, name, role })
  console.log(`Created ${created.role} account ${created.email}.`)
}

await mongoose.disconnect()
