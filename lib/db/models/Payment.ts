import mongoose, { Schema, Document } from 'mongoose'
import { PaymentStatus } from '@/types'

// Payments are a Phase-2 concern; the model is scaffolded here so the data
// layer is complete and references resolve.
export interface PaymentDoc extends Document {
  bookingId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  panditId: mongoose.Types.ObjectId
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<PaymentDoc>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    panditId: { type: Schema.Types.ObjectId, ref: 'Pandit', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  },
  { timestamps: true }
)

PaymentSchema.index({ bookingId: 1 })
PaymentSchema.index({ panditId: 1, status: 1 })

export const Payment =
  (mongoose.models.Payment as mongoose.Model<PaymentDoc>) ||
  mongoose.model<PaymentDoc>('Payment', PaymentSchema)
