import mongoose, { Schema, Document } from 'mongoose'
import { VerificationStatus, Language, Gender, Address } from '@/types'

export interface PanditDoc extends Document {
  userId: mongoose.Types.ObjectId
  age?: number
  gender?: Gender
  address?: Address
  experienceYears: number
  sampraday: string
  specialization: string[]
  languages: Language[]
  serviceAreas: string[]
  profilePhoto: string
  idDocumentUrl?: string
  aadhaarLast4?: string
  bio: string
  verificationStatus: VerificationStatus
  rejectionReason?: string
  submittedAt?: Date
  aadhaarVerified: boolean
  ratingAvg: number
  ratingCount: number
  ratingWeighted: number
  responseRate: number
  completedBookings: number
  lastActiveAt: Date
  availability?: {
    workingDays: number[] // 0=Sun … 6=Sat
    workingHoursStart: string // 'HH:mm' IST
    workingHoursEnd: string // 'HH:mm' IST
    maxPerDay: number | null
    blockedDates: Date[]
  }
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PanditSchema = new Schema<PanditDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number, min: 18, max: 100 },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    address: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    // Not required at the schema level: a Pandit profile is created as an empty
    // draft at sign-up and these are only enforced in submitForVerification().
    experienceYears: { type: Number, default: 0, min: 0 },
    sampraday: { type: String, trim: true, default: '' },
    specialization: [{ type: String }],
    languages: [{ type: String, enum: ['hi', 'gu', 'en'] }],
    serviceAreas: [{ type: String }],
    profilePhoto: { type: String, default: '' },
    idDocumentUrl: { type: String, default: '' },
    // Only the last 4 digits of Aadhaar are ever stored — never the full number.
    aadhaarLast4: { type: String, maxlength: 4 },
    bio: { type: String, default: '', maxlength: 1000 },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    rejectionReason: String,
    submittedAt: Date,
    aadhaarVerified: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    ratingWeighted: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    availability: {
      workingDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
      workingHoursStart: { type: String, default: '06:00' },
      workingHoursEnd: { type: String, default: '20:00' },
      maxPerDay: { type: Number, default: null },
      blockedDates: { type: [Date], default: [] },
    },
    deletedAt: Date,
  },
  { timestamps: true }
)

PanditSchema.index({ verificationStatus: 1 })
PanditSchema.index({ serviceAreas: 1 })
PanditSchema.index({ ratingWeighted: -1 })
// Search & suggestions: verified pandits sorted by weighted rating
PanditSchema.index({ verificationStatus: 1, ratingWeighted: -1 })

export const Pandit =
  (mongoose.models.Pandit as mongoose.Model<PanditDoc>) ||
  mongoose.model<PanditDoc>('Pandit', PanditSchema)
