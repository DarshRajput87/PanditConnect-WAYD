// Seeds 20 fully verified test Pandits (User + Pandit profile + Poojas) so the
// search/booking flows can be exercised without going through sign-up + admin
// verification by hand. Idempotent — re-running updates the same records.
// All accounts share the password below; pandit #1 keeps the original
// pandit.test@panditconnect.dev login.
// Run with: pnpm seed:pandit
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const PASSWORD = 'Pandit@123'

const NAMES = [
  'Pt. Ramesh Shastri',
  'Pt. Suresh Trivedi',
  'Pt. Mahesh Joshi',
  'Pt. Dinesh Pandya',
  'Pt. Rakesh Upadhyay',
  'Pt. Kamlesh Dave',
  'Pt. Hitesh Bhatt',
  'Pt. Naresh Vyas',
  'Pt. Jignesh Mehta',
  'Pt. Alpesh Raval',
  'Pt. Bharat Acharya',
  'Pt. Chandrakant Dixit',
  'Pt. Devendra Mishra',
  'Pt. Girish Purohit',
  'Pt. Harshad Thaker',
  'Pt. Ishwar Jani',
  'Pt. Kiran Shukla',
  'Pt. Manoj Tripathi',
  'Pt. Niranjan Sharma',
  'Pt. Omprakash Dube',
]

// City pool cycles across pandits so service areas overlap but differ.
const CITIES = [
  { city: 'Ahmedabad', state: 'Gujarat', areas: ['Ahmedabad', 'Gandhinagar'] },
  { city: 'Surat', state: 'Gujarat', areas: ['Surat', 'Navsari'] },
  { city: 'Vadodara', state: 'Gujarat', areas: ['Vadodara', 'Anand'] },
  { city: 'Rajkot', state: 'Gujarat', areas: ['Rajkot', 'Jamnagar'] },
  { city: 'Gandhinagar', state: 'Gujarat', areas: ['Gandhinagar', 'Ahmedabad'] },
  { city: 'Mumbai', state: 'Maharashtra', areas: ['Mumbai', 'Thane'] },
  { city: 'Pune', state: 'Maharashtra', areas: ['Pune', 'Pimpri-Chinchwad'] },
  { city: 'Indore', state: 'Madhya Pradesh', areas: ['Indore', 'Ujjain'] },
]

const SAMPRADAYS = ['Vaishnav', 'Shaiv', 'Smarta', 'Shakta', 'Swaminarayan']

// Full catalogue from types/index.ts POOJA_CATALOGUE, with base pricing.
const POOJA_DEFS = [
  { catalogKey: 'satyanarayan-katha', name: 'Satyanarayan Katha', basePrice: 2100, durationMin: 180, description: 'Complete Satyanarayan Katha with all rituals, including aarti and prasad vidhi.' },
  { catalogKey: 'griha-pravesh', name: 'Griha Pravesh', basePrice: 5100, durationMin: 240, description: 'Traditional house-warming ceremony with vastu shanti and kalash sthapana.' },
  { catalogKey: 'vivah-sanskar', name: 'Vivah Sanskar', basePrice: 11000, durationMin: 360, description: 'Complete Vedic wedding ceremony with all sanskars, havan and saptapadi.' },
  { catalogKey: 'rudrabhishek', name: 'Rudrabhishek', basePrice: 3100, durationMin: 150, description: 'Rudrabhishek of Lord Shiva with panchamrut, bilva patra and Vedic chanting.' },
  { catalogKey: 'navchandi-yagna', name: 'Navchandi Yagna', basePrice: 15000, durationMin: 480, description: 'Navchandi Yagna with full Durga Saptashati path and havan for prosperity.' },
  { catalogKey: 'ganesh-pooja', name: 'Ganesh Pooja', basePrice: 1500, durationMin: 90, description: 'Ganesh sthapana and pooja for new beginnings and auspicious occasions.' },
  { catalogKey: 'lakshmi-pooja', name: 'Lakshmi Pooja', basePrice: 2100, durationMin: 120, description: 'Lakshmi pooja for wealth and prosperity, ideal for Diwali and new ventures.' },
  { catalogKey: 'vastu-pooja', name: 'Vastu Pooja', basePrice: 4100, durationMin: 180, description: 'Vastu shanti pooja to remove doshas from home or office premises.' },
  { catalogKey: 'mundan-sanskar', name: 'Mundan Sanskar', basePrice: 2500, durationMin: 120, description: 'Traditional first-haircut ceremony with havan and blessings for the child.' },
  { catalogKey: 'namkaran', name: 'Naming Ceremony (Namkaran)', basePrice: 2100, durationMin: 90, description: 'Namkaran sanskar with nakshatra-based name selection and blessings.' },
]

// Each pandit offers 2–4 poojas, starting at a rotating offset through the
// catalogue so every pandit gets a different combination.
function poojasFor(i: number) {
  const count = 2 + (i % 3)
  const offset = (i * 3) % POOJA_DEFS.length
  return Array.from({ length: count }, (_, k) => {
    const def = POOJA_DEFS[(offset + k) % POOJA_DEFS.length]
    return {
      catalogKey: def.catalogKey,
      name: def.name,
      description: def.description,
      price: def.basePrice + (i % 5) * 100,
      durationMin: def.durationMin,
    }
  })
}

function buildPandit(i: number) {
  const loc = CITIES[i % CITIES.length]
  const poojas = poojasFor(i)
  const email =
    i === 0
      ? 'pandit.test@panditconnect.dev'
      : `pandit${String(i + 1).padStart(2, '0')}@panditconnect.dev`
  const experienceYears = 5 + ((i * 7) % 31)
  return {
    email,
    name: NAMES[i],
    phone: `98765${String(i + 1).padStart(5, '0')}`,
    address: { line1: `${10 + i} Mandir Marg`, city: loc.city, state: loc.state, pincode: String(380001 + i) },
    age: 30 + ((i * 5) % 40),
    experienceYears,
    sampraday: SAMPRADAYS[i % SAMPRADAYS.length],
    languages: loc.state === 'Gujarat' ? ['hi', 'gu', ...(i % 2 ? ['en'] : [])] : ['hi', ...(i % 2 ? ['en'] : [])],
    serviceAreas: loc.areas,
    specialization: poojas.map((p) => p.name),
    bio: `Vedic scholar with ${experienceYears} years of experience performing traditional poojas in ${loc.city} and nearby areas. Specializes in ${poojas[0].name} and ${poojas[1].name}.`,
    ratingAvg: Math.round((3.9 + (i % 11) * 0.1) * 10) / 10,
    ratingCount: 5 + i * 3,
    completedBookings: 8 + i * 4,
    // 0–1 decimal — the dashboard multiplies by 100 for display.
    responseRate: (80 + (i % 20)) / 100,
    poojas,
  }
}

async function seed() {
  // Imported dynamically so dotenv runs first — connect.ts reads MONGODB_URI
  // at module scope, and static imports are hoisted above dotenv.config().
  const { connectDB } = await import('@/lib/db/connect')
  const { User } = await import('@/lib/db/models/User')
  const { Pandit } = await import('@/lib/db/models/Pandit')
  const { Pooja } = await import('@/lib/db/models/Pooja')

  await connectDB()

  // One hash shared by all test accounts — hashing 20× at cost 12 is slow.
  const passwordHash = await bcrypt.hash(PASSWORD, 12)

  for (let i = 0; i < NAMES.length; i++) {
    const p = buildPandit(i)

    const user = await User.findOneAndUpdate(
      { email: p.email },
      {
        role: 'pandit',
        name: p.name,
        email: p.email,
        phone: p.phone,
        preferredLanguage: p.languages.includes('gu') ? 'gu' : 'hi',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        onboardingCompleted: true,
        passwordHash,
        address: p.address,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const pandit = await Pandit.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        age: p.age,
        gender: 'male',
        address: p.address,
        experienceYears: p.experienceYears,
        sampraday: p.sampraday,
        specialization: p.specialization,
        languages: p.languages,
        serviceAreas: p.serviceAreas,
        profilePhoto: '',
        bio: p.bio,
        verificationStatus: 'verified',
        submittedAt: new Date(),
        aadhaarVerified: true,
        aadhaarLast4: String(1000 + i),
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        ratingWeighted: Math.round((p.ratingAvg - 0.1) * 10) / 10,
        responseRate: p.responseRate,
        completedBookings: p.completedBookings,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    for (const pooja of p.poojas) {
      await Pooja.findOneAndUpdate(
        { panditId: pandit._id, catalogKey: pooja.catalogKey },
        { ...pooja, panditId: pandit._id, active: true },
        { upsert: true, setDefaultsOnInsert: true }
      )
    }
    // Remove poojas left over from a previous seed run with a different set.
    await Pooja.deleteMany({
      panditId: pandit._id,
      catalogKey: { $nin: p.poojas.map((x) => x.catalogKey) },
    })

    console.log(
      `[${String(i + 1).padStart(2, ' ')}/20] ${p.name} <${p.email}> — ${p.serviceAreas[0]} — ${p.poojas.map((x) => x.name).join(', ')}`
    )
  }

  console.log(`\nDone. All accounts use password: ${PASSWORD}`)
}

seed()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
