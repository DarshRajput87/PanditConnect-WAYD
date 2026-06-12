// Applies every schema-defined index to the live database. Schema files are
// the single source of truth — this just runs createIndexes() per model so
// production (where autoIndex is off) gets the same indexes as dev.
// Run: pnpm ensure-indexes  (loads .env.local via tsx --env-file)

import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Pandit } from '@/lib/db/models/Pandit'
import { Booking } from '@/lib/db/models/Booking'
import { Review } from '@/lib/db/models/Review'
import { Pooja } from '@/lib/db/models/Pooja'

async function ensureIndexes() {
  await connectDB()

  const models = [User, Pandit, Booking, Review, Pooja]
  for (const model of models) {
    await model.createIndexes()
    const indexes = await model.collection.indexes()
    console.log(`${model.modelName}: ${indexes.length} indexes`)
    for (const idx of indexes) console.log(`  - ${idx.name}`)
  }

  console.log('\nAll schema indexes ensured.')
  process.exit(0)
}

ensureIndexes().catch((err) => {
  console.error(err)
  process.exit(1)
})
