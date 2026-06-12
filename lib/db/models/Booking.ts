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
  paymentMethod: 'cash' | 'razorpay'
  cancellation?: { by: mongoose.Types.ObjectId; reason: string; at: Date }
  respondedAt?: Date
  completedAt?: Date
  reviewReminderSent: boolean
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
    // Default keeps pre-payment bookings (created before this field existed) valid.
    paymentMethod: { type: String, enum: ['cash', 'razorpay'], default: 'cash' },
    cancellation: {
      by: Schema.Types.ObjectId,
      reason: String,
      at: Date,
    },
    respondedAt: Date,
    completedAt: Date,
    reviewReminderSent: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Critical: compound index supports the double-booking conflict check
BookingSchema.index({ panditId: 1, scheduledAt: 1, status: 1 })
BookingSchema.index({ customerId: 1, status: 1 })
BookingSchema.index({ status: 1, expiresAt: 1 }) // for the expiry job
// Inquiry tabs: filter by pandit+status, newest first
BookingSchema.index({ panditId: 1, status: 1, createdAt: -1 })
// Customer bookings list: filter by customer+status, sorted by ceremony date
BookingSchema.index({ customerId: 1, status: 1, scheduledAt: -1 })

export const Booking =
  (mongoose.models.Booking as mongoose.Model<BookingDoc>) ||
  mongoose.model<BookingDoc>('Booking', BookingSchema)
