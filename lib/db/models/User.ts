import mongoose, { Schema, Document } from 'mongoose'
import { Role, Language, UserStatus, Address } from '@/types'

export interface UserDoc extends Document {
  role: Role
  name: string
  email: string
  phone: string
  preferredLanguage: Language
  status: UserStatus
  emailVerified: boolean
  phoneVerified: boolean
  address?: Address
  onboardingCompleted: boolean
  passwordHash?: string
  otpHash?: string
  otpExpiry?: Date
  otpAttempts: number
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDoc>(
  {
    role: { type: String, enum: ['customer', 'pandit', 'admin'], required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    preferredLanguage: { type: String, enum: ['hi', 'gu', 'en'], default: 'en' },
    status: { type: String, enum: ['active', 'pending', 'suspended', 'deleted'], default: 'pending' },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    address: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    onboardingCompleted: { type: Boolean, default: false },
    passwordHash: String,
    otpHash: String,
    otpExpiry: Date,
    otpAttempts: { type: Number, default: 0 },
    deletedAt: Date,
  },
  { timestamps: true }
)

UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ phone: 1 }, { unique: true })
UserSchema.index({ status: 1 })

export const User =
  (mongoose.models.User as mongoose.Model<UserDoc>) ||
  mongoose.model<UserDoc>('User', UserSchema)
