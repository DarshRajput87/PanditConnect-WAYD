// One-time migration: responseRate must be a 0–1 decimal, but early seed data
// stored it on a 0–100 scale (so the dashboard rendered values like 8000%).
// Divides any value > 1 by 100.
// Run: pnpm fix-response-rate  (loads .env.local via tsx --env-file)

import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'

async function fixResponseRate() {
  await connectDB()

  const affected = await Pandit.countDocuments({ responseRate: { $gt: 1 } })
  if (affected === 0) {
    console.log('No pandits with responseRate > 1 — nothing to fix.')
    process.exit(0)
  }

  const res = await Pandit.updateMany({ responseRate: { $gt: 1 } }, [
    { $set: { responseRate: { $round: [{ $divide: ['$responseRate', 100] }, 2] } } },
  ])

  console.log(`Fixed responseRate on ${res.modifiedCount} of ${affected} pandits.`)
  process.exit(0)
}

fixResponseRate().catch((err) => {
  console.error(err)
  process.exit(1)
})
