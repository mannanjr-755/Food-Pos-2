import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

let memoryServer = null

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_pos'

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`MongoDB unreachable in production (${err.message}). Refusing to start on a throwaway in-memory database.`)
      process.exit(1)
    }
    console.log(`Could not reach ${uri} (${err.message}). Starting in-memory replica set...`)
  }

  try {
    await mongoose.disconnect()
  } catch {}

  // Loaded on demand so a production install (--omit=dev) never needs this package.
  const { MongoMemoryReplSet } = await import('mongodb-memory-server')
  memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  const memUri = memoryServer.getUri('food_pos')
  const conn = await mongoose.connect(memUri)
  console.log(`MongoDB Connected (in-memory replica set): ${conn.connection.name}`)
  return conn
}

export const supportsTransactions = () => mongoose.connection.client.topology?.hasSessionSupport?.() === true

export default connectDB
