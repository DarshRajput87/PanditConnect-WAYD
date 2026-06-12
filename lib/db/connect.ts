import mongoose from 'mongoose'
import dns from 'node:dns'

const MONGODB_URI = process.env.MONGODB_URI

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

global._mongoose = global._mongoose || { conn: null, promise: null }

// Optional: override the DNS resolver used for SRV/TXT lookups (mongodb+srv://).
// Applied lazily at connect time (not import time) so it reads the env reliably
// regardless of module load order. Example: MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
let dnsApplied = false
function applyDnsOverride() {
  if (dnsApplied) return
  dnsApplied = true
  const servers = process.env.MONGODB_DNS_SERVERS
  if (!servers) return
  try {
    dns.setServers(
      servers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  } catch (err) {
    console.warn('[db] Invalid MONGODB_DNS_SERVERS — falling back to system DNS', err)
  }
}

export async function connectDB() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set')
  if (global._mongoose.conn) return global._mongoose.conn

  applyDnsOverride()

  if (!global._mongoose.promise) {
    global._mongoose.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10, // handle concurrent server actions without queueing
        minPoolSize: 2, // keep warm connections so no cold handshake per burst
        serverSelectionTimeoutMS: 8000, // fail fast instead of hanging 30s when DB is down
        connectTimeoutMS: 8000,
        socketTimeoutMS: 20000,
      })
      .catch((err) => {
        // Never cache a rejected promise — otherwise one early failure (DNS not yet
        // resolvable, IP not yet whitelisted) poisons every later request until a
        // full server restart. Clear it so the next call retries.
        global._mongoose.promise = null
        throw err
      })
  }
  global._mongoose.conn = await global._mongoose.promise
  return global._mongoose.conn
}
