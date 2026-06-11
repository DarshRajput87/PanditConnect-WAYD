# Phase 1 — Foundation & Authentication
> Claude Code Prompt · Copy entire content below the divider into Claude Code

---

## PROMPT START

You are building **PanditConnect** — a multi-sided marketplace for booking verified Pandits for Hindu poojas and religious ceremonies. This is Phase 1: project foundation, design system, database connection, and complete authentication.

### Tech Stack
- Next.js 15 (App Router, TypeScript strict mode)
- Tailwind CSS + shadcn/ui
- MongoDB Atlas via Mongoose
- NextAuth.js v5 (App Router)
- Zod for validation
- i18next + react-i18next
- Resend for email
- Cloudinary for media

### Design System Rules (enforce throughout)
- **Primary:** `#F97316` (orange-500), hover `#EA6C0A`
- **Background:** white (`#FFFFFF`)
- **Surface:** `#F9FAFB` (gray-50)
- **Border:** `#E5E7EB` (gray-200)
- **Text primary:** `#111827` (gray-900)
- **Text secondary:** `#6B7280` (gray-500)
- Font: Inter (system fallback)
- Border radius: `rounded-lg` (8px) for cards, `rounded-md` (6px) for inputs
- **NO** glassmorphism, gradients, heavy shadows, decorative animations
- **ONLY** allowed animations: page skeleton loaders, button loading spinners, page transitions via `loading.tsx`
- Mobile-first: all layouts work on 375px width

---

### Task 1: Project Scaffold

Create the complete Next.js project with this exact structure:

```
panditconnect/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── loading.tsx                   # Global skeleton loader
│   ├── not-found.tsx
│   ├── (public)/
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Landing page
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify/page.tsx
│   ├── (customer)/
│   │   └── dashboard/page.tsx        # Stub
│   ├── (pandit)/
│   │   └── dashboard/page.tsx        # Stub
│   └── (admin)/
│       └── dashboard/page.tsx        # Stub
├── components/
│   ├── ui/                           # shadcn components
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageSwitcher.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       └── OTPInput.tsx
├── lib/
│   ├── db/
│   │   ├── connect.ts                # MongoDB singleton
│   │   └── models/
│   │       ├── User.ts
│   │       ├── Pandit.ts
│   │       ├── Pooja.ts
│   │       ├── Material.ts
│   │       ├── Booking.ts
│   │       ├── Review.ts
│   │       └── Payment.ts
│   ├── auth/
│   │   └── config.ts                 # NextAuth config
│   └── validators/
│       └── auth.ts                   # Zod schemas
├── actions/
│   └── auth.ts                       # Server Actions for auth
├── locales/
│   ├── en.json
│   ├── hi.json
│   └── gu.json
├── types/
│   └── index.ts
├── middleware.ts
├── tailwind.config.ts
└── .env.example
```

---

### Task 2: Environment Variables

Create `.env.example`:
```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Task 3: TypeScript Types (`types/index.ts`)

```typescript
export type Role = 'customer' | 'pandit' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type BookingStatus = 'requested' | 'confirmed' | 'declined' | 'expired' | 'cancelled' | 'completed'
export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'removed'
export type Language = 'hi' | 'gu' | 'en'
export type UserStatus = 'active' | 'pending' | 'suspended' | 'deleted'

export interface IUser {
  _id: string
  role: Role
  name: string
  email: string
  phone: string
  preferredLanguage: Language
  status: UserStatus
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IPandit {
  _id: string
  userId: string
  experienceYears: number
  sampraday: string
  specialization: string[]
  languages: Language[]
  serviceAreas: string[]
  profilePhoto: string
  bio: string
  verificationStatus: VerificationStatus
  rejectionReason?: string
  ratingAvg: number
  ratingCount: number
  ratingWeighted: number
  responseRate: number
  completedBookings: number
  lastActiveAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface IPooja {
  _id: string
  panditId: string
  catalogKey: string
  name: string
  description: string
  price: number
  durationMin: number
  active: boolean
}

export interface IMaterial {
  _id: string
  poojaId: string
  itemName: string
  quantity: string
  notes?: string
}

export interface IBooking {
  _id: string
  customerId: string
  panditId: string
  poojaId: string
  scheduledAt: Date
  timezone: string
  address: { line1: string; city: string; state: string; pincode: string }
  status: BookingStatus
  cancellation?: { by: string; reason: string; at: Date }
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IReview {
  _id: string
  bookingId: string
  customerId: string
  panditId: string
  overall: number
  ritualKnowledge?: number
  punctuality?: number
  behaviour?: number
  communication?: number
  comment?: string
  photoUrl?: string
  status: ReviewStatus
  panditReply?: { text: string; at: Date }
  createdAt: Date
  updatedAt: Date
}

export const POOJA_CATALOGUE = [
  { key: 'satyanarayan-katha', name: 'Satyanarayan Katha' },
  { key: 'griha-pravesh', name: 'Griha Pravesh' },
  { key: 'vivah-sanskar', name: 'Vivah Sanskar' },
  { key: 'rudrabhishek', name: 'Rudrabhishek' },
  { key: 'navchandi-yagna', name: 'Navchandi Yagna' },
  { key: 'ganesh-pooja', name: 'Ganesh Pooja' },
  { key: 'lakshmi-pooja', name: 'Lakshmi Pooja' },
  { key: 'vastu-pooja', name: 'Vastu Pooja' },
  { key: 'mundan-sanskar', name: 'Mundan Sanskar' },
  { key: 'namkaran', name: 'Naming Ceremony (Namkaran)' },
] as const
```

---

### Task 4: MongoDB Models (`lib/db/models/`)

**User.ts:**
```typescript
import mongoose, { Schema, Document } from 'mongoose'
import { Role, Language, UserStatus } from '@/types'

export interface UserDoc extends Document {
  role: Role
  name: string
  email: string
  phone: string
  preferredLanguage: Language
  status: UserStatus
  emailVerified: boolean
  phoneVerified: boolean
  passwordHash?: string
  otpHash?: string
  otpExpiry?: Date
  otpAttempts: number
  deletedAt?: Date
}

const UserSchema = new Schema<UserDoc>({
  role: { type: String, enum: ['customer', 'pandit', 'admin'], required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  preferredLanguage: { type: String, enum: ['hi', 'gu', 'en'], default: 'en' },
  status: { type: String, enum: ['active', 'pending', 'suspended', 'deleted'], default: 'pending' },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  passwordHash: String,
  otpHash: String,
  otpExpiry: Date,
  otpAttempts: { type: Number, default: 0 },
  deletedAt: Date,
}, { timestamps: true })

UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ phone: 1 }, { unique: true })
UserSchema.index({ status: 1 })

export const User = mongoose.models.User || mongoose.model<UserDoc>('User', UserSchema)
```

**Pandit.ts:**
```typescript
import mongoose, { Schema, Document } from 'mongoose'
import { VerificationStatus, Language } from '@/types'

export interface PanditDoc extends Document {
  userId: mongoose.Types.ObjectId
  experienceYears: number
  sampraday: string
  specialization: string[]
  languages: Language[]
  serviceAreas: string[]
  profilePhoto: string
  bio: string
  verificationStatus: VerificationStatus
  rejectionReason?: string
  aadhaarVerified: boolean
  ratingAvg: number
  ratingCount: number
  ratingWeighted: number
  responseRate: number
  completedBookings: number
  lastActiveAt: Date
  deletedAt?: Date
}

const PanditSchema = new Schema<PanditDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  experienceYears: { type: Number, required: true, min: 0 },
  sampraday: { type: String, required: true, trim: true },
  specialization: [{ type: String }],
  languages: [{ type: String, enum: ['hi', 'gu', 'en'] }],
  serviceAreas: [{ type: String }],
  profilePhoto: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 1000 },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  rejectionReason: String,
  aadhaarVerified: { type: Boolean, default: false },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratingWeighted: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: Date.now },
  deletedAt: Date,
}, { timestamps: true })

PanditSchema.index({ verificationStatus: 1 })
PanditSchema.index({ serviceAreas: 1 })
PanditSchema.index({ ratingWeighted: -1 })

export const Pandit = mongoose.models.Pandit || mongoose.model<PanditDoc>('Pandit', PanditSchema)
```

**Booking.ts:**
```typescript
import mongoose, { Schema, Document } from 'mongoose'
import { BookingStatus } from '@/types'

export interface BookingDoc extends Document {
  customerId: mongoose.Types.ObjectId
  panditId: mongoose.Types.ObjectId
  poojaId: mongoose.Types.ObjectId
  scheduledAt: Date
  timezone: string
  address: { line1: string; city: string; state: string; pincode: string }
  status: BookingStatus
  cancellation?: { by: mongoose.Types.ObjectId; reason: string; at: Date }
  respondedAt?: Date
  expiresAt: Date
  notificationSent: boolean
}

const BookingSchema = new Schema<BookingDoc>({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  panditId: { type: Schema.Types.ObjectId, ref: 'Pandit', required: true },
  poojaId: { type: Schema.Types.ObjectId, ref: 'Pooja', required: true },
  scheduledAt: { type: Date, required: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  address: {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  status: { type: String, enum: ['requested','confirmed','declined','expired','cancelled','completed'], default: 'requested' },
  cancellation: {
    by: Schema.Types.ObjectId,
    reason: String,
    at: Date,
  },
  respondedAt: Date,
  expiresAt: { type: Date, required: true },
  notificationSent: { type: Boolean, default: false },
}, { timestamps: true })

// Critical: compound index prevents double-booking
BookingSchema.index({ panditId: 1, scheduledAt: 1, status: 1 })
BookingSchema.index({ customerId: 1, status: 1 })
BookingSchema.index({ status: 1, expiresAt: 1 })  // for expiry job

export const Booking = mongoose.models.Booking || mongoose.model<BookingDoc>('Booking', BookingSchema)
```

**Review.ts:**
```typescript
import mongoose, { Schema, Document } from 'mongoose'
import { ReviewStatus } from '@/types'

export interface ReviewDoc extends Document {
  bookingId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  panditId: mongoose.Types.ObjectId
  overall: number
  ritualKnowledge?: number
  punctuality?: number
  behaviour?: number
  communication?: number
  comment?: string
  photoUrl?: string
  status: ReviewStatus
  panditReply?: { text: string; at: Date }
  flaggedBy?: mongoose.Types.ObjectId[]
  editHistory: { text: string; editedAt: Date }[]
}

const ReviewSchema = new Schema<ReviewDoc>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  panditId: { type: Schema.Types.ObjectId, ref: 'Pandit', required: true },
  overall: { type: Number, required: true, min: 1, max: 5 },
  ritualKnowledge: { type: Number, min: 1, max: 5 },
  punctuality: { type: Number, min: 1, max: 5 },
  behaviour: { type: Number, min: 1, max: 5 },
  communication: { type: Number, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
  photoUrl: String,
  status: { type: String, enum: ['pending','published','hidden','removed'], default: 'pending' },
  panditReply: { text: String, at: Date },
  flaggedBy: [Schema.Types.ObjectId],
  editHistory: [{ text: String, editedAt: Date }],
}, { timestamps: true })

ReviewSchema.index({ panditId: 1, status: 1 })
ReviewSchema.index({ customerId: 1 })
ReviewSchema.index({ bookingId: 1 }, { unique: true })

export const Review = mongoose.models.Review || mongoose.model<ReviewDoc>('Review', ReviewSchema)
```

Create `Pooja.ts`, `Material.ts`, `Payment.ts` using the same pattern from types/index.ts field definitions.

---

### Task 5: DB Connection (`lib/db/connect.ts`)

```typescript
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error('MONGODB_URI not set')

declare global { var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }

global._mongoose = global._mongoose || { conn: null, promise: null }

export async function connectDB() {
  if (global._mongoose.conn) return global._mongoose.conn
  if (!global._mongoose.promise) {
    global._mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,  // free tier constraint
    })
  }
  global._mongoose.conn = await global._mongoose.promise
  return global._mongoose.conn
}
```

---

### Task 6: NextAuth Config (`lib/auth/config.ts`)

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(credentials)
        if (!parsed.success) return null
        await connectDB()
        const user = await User.findOne({ email: parsed.data.email, status: { $in: ['active', 'pending'] } }).lean()
        if (!user || !user.passwordHash) return null
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null
        return { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.role = (user as any).role; token.id = user.id }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.id = token.id as string
      return session
    }
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
})
```

---

### Task 7: Zod Validators (`lib/validators/auth.ts`)

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password: z.string().min(8).max(64),
  role: z.enum(['customer', 'pandit']),
  preferredLanguage: z.enum(['hi', 'gu', 'en']).default('en'),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const OTPVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d+$/),
})
```

---

### Task 8: Server Actions (`actions/auth.ts`)

```typescript
'use server'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Pandit } from '@/lib/db/models/Pandit'
import { RegisterSchema, OTPVerifySchema } from '@/lib/validators/auth'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5')

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString() }

export async function registerUser(formData: unknown) {
  const parsed = RegisterSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await connectDB()
  const { name, email, phone, password, role, preferredLanguage } = parsed.data

  // Check duplicates — never reveal which field matched
  const exists = await User.findOne({ $or: [{ email }, { phone }] }).lean()
  if (exists) return { error: { _form: ['Account already exists. Please log in.'] } }

  const passwordHash = await bcrypt.hash(password, 12)
  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 10)

  const user = await User.create({
    name, email, phone, passwordHash,
    role, preferredLanguage,
    status: 'pending',
    otpHash, otpExpiry: new Date(Date.now() + OTP_EXPIRY), otpAttempts: 0,
  })

  // Create pandit skeleton if role is pandit
  if (role === 'pandit') {
    await Pandit.create({ userId: user._id, experienceYears: 0, sampraday: '', specialization: [], languages: [], serviceAreas: [] })
  }

  // Send OTP email — fire and forget
  resend.emails.send({
    from: 'PanditConnect <noreply@panditconnect.in>',
    to: email,
    subject: 'Verify your PanditConnect account',
    text: `Your OTP is ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
  }).catch(console.error)

  return { success: true, email }
}

export async function verifyOTP(formData: unknown) {
  const parsed = OTPVerifySchema.safeParse(formData)
  if (!parsed.success) return { error: 'Invalid input' }

  await connectDB()
  const user = await User.findOne({ email: parsed.data.email })
  if (!user) return { error: 'Account not found' }

  if (user.otpAttempts >= MAX_ATTEMPTS) return { error: 'Too many attempts. Request a new OTP.' }
  if (!user.otpExpiry || user.otpExpiry < new Date()) return { error: 'OTP expired. Request a new one.' }

  const valid = await bcrypt.compare(parsed.data.otp, user.otpHash || '')
  if (!valid) {
    await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } })
    return { error: 'Invalid OTP' }
  }

  await User.updateOne({ _id: user._id }, {
    emailVerified: true, status: 'active',
    $unset: { otpHash: 1, otpExpiry: 1 }, otpAttempts: 0,
  })
  return { success: true, role: user.role }
}

export async function resendOTP(email: string) {
  await connectDB()
  const user = await User.findOne({ email, status: 'pending' })
  if (!user) return { error: 'Account not found or already verified' }

  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 10)
  await User.updateOne({ _id: user._id }, { otpHash, otpExpiry: new Date(Date.now() + OTP_EXPIRY), otpAttempts: 0 })

  await resend.emails.send({
    from: 'PanditConnect <noreply@panditconnect.in>',
    to: email,
    subject: 'New OTP — PanditConnect',
    text: `Your new OTP is ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
  })
  return { success: true }
}
```

---

### Task 9: Middleware (`middleware.ts`)

```typescript
import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/verify', '/search', '/pandit']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  
  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = req.auth?.user?.role
  if (pathname.startsWith('/dashboard/customer') && role !== 'customer') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/dashboard/pandit') && role !== 'pandit') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
})

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }
```

---

### Task 10: UI Components

**Navbar.tsx** — professional, mobile-first:
```tsx
'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Menu, X, Flame } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>PanditConnect</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">Find Pandit</Link>
          <LanguageSwitcher />
          {session ? (
            <>
              <Link href={`/dashboard/${session.user.role}`}>
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link href="/register"><Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">Get Started</Button></Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-2">
          <Link href="/search" className="block text-sm py-2 text-gray-600" onClick={() => setOpen(false)}>Find Pandit</Link>
          <LanguageSwitcher />
          {session ? (
            <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>Sign out</Button>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Log in</Button></Link>
              <Link href="/register" className="flex-1"><Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white">Register</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
```

**LoginForm.tsx:**
```tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      email: fd.get('email'), password: fd.get('password'), redirect: false
    })
    setLoading(false)
    if (res?.error) { setError('Invalid email or password'); return }
    router.push('/dashboard/customer') // middleware handles role redirect
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</> : 'Sign in'}
      </Button>
    </form>
  )
}
```

---

### Task 11: Landing Page (`app/(public)/page.tsx`)

Create a clean, professional landing page with:
- Hero section: headline "Book Trusted Pandit Ji — Online", subtitle, CTA button to `/search`
- Trust signals strip: "Verified Pandits" · "Transparent Pricing" · "Samagri List Included"
- Pooja catalogue grid (12 cards from POOJA_CATALOGUE) — orange icon, name, "Book" link
- How it works: 3 steps — Search → Book → Ceremony
- Footer with language switcher

**Style rules:**
- Hero: `bg-orange-50` banner, large bold heading (`text-3xl md:text-5xl font-bold text-gray-900`)
- Cards: `border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-sm transition-shadow`
- No hero image/illustration — text + orange accent only

---

### Task 12: i18n Setup

**locales/en.json** (minimal, full keys):
```json
{
  "nav": { "findPandit": "Find Pandit", "login": "Log in", "register": "Get Started", "signOut": "Sign out" },
  "auth": {
    "loginTitle": "Welcome back",
    "registerTitle": "Create your account",
    "email": "Email", "password": "Password", "name": "Full Name", "phone": "Mobile Number",
    "role": "I am a", "customer": "Devotee", "pandit": "Pandit Ji",
    "otpSent": "OTP sent to your email", "verifyOtp": "Verify OTP",
    "resendOtp": "Resend OTP", "otpLabel": "Enter 6-digit OTP"
  },
  "errors": { "required": "This field is required", "invalidPhone": "Invalid Indian mobile number" }
}
```

Create matching `hi.json` and `gu.json` with Hindi and Gujarati translations for all keys.

---

### Task 13: Acceptance Criteria Checklist

Before marking Phase 1 complete, verify:
- [ ] `pnpm dev` runs without errors
- [ ] `/register` with duplicate email returns error, never reveals which field matched
- [ ] OTP expires after configured window, blocks after MAX_ATTEMPTS
- [ ] `/login` with bad credentials returns generic error
- [ ] Navigating to `/dashboard/customer` without session redirects to `/login`
- [ ] Pandit navigating to `/dashboard/customer` is redirected
- [ ] TypeScript strict mode passes (`pnpm tsc --noEmit`)
- [ ] All MongoDB models have required indexes
- [ ] No user-facing hardcoded strings (all in locale files)
- [ ] Mobile Navbar works at 375px width

---

### Phase 1 Output
After completion, the following must exist and work:
- Full project scaffold
- All 7 MongoDB models with indexes
- NextAuth with JWT + role
- Register → OTP email → Verify → Active account flow
- Login with redirect by role
- Middleware protecting all dashboard/admin routes
- Navbar, Footer, LanguageSwitcher components
- Landing page with pooja catalogue
- i18n skeleton for hi/gu/en

**Do not proceed to Phase 2 until `pnpm tsc --noEmit` passes with 0 errors.**
