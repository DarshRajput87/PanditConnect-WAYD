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
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<BookingDoc>(
  {
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
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'declined', 'expired', 'cancelled', 'completed'],
      default: 'requested',
    },
    cancellation: {
      by: Schema.Types.ObjectId,
      reason: String,
      at: Date,
    },
    respondedAt: Date,
    expiresAt: { type: Date, required: true },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Critical: compound index supports the double-booking conflict check
BookingSchema.index({ panditId: 1, scheduledAt: 1, status: 1 })
BookingSchema.index({ customerId: 1, status: 1 })
BookingSchema.index({ status: 1, expiresAt: 1 }) // for the expiry job

export const Booking =
  (mongoose.models.Booking as mongoose.Model<BookingDoc>) ||
  mongoose.model<BookingDoc>('Booking', BookingSchema)
