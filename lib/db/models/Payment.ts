import mongoose, { Schema, Document } from 'mongoose'
import { PaymentStatus } from '@/types'

export interface PaymentDoc extends Document {
  bookingId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  panditId: mongoose.Types.ObjectId
  amount: number // in paise (INR × 100)
  currency: string
  method: 'razorpay' | 'cash'
  status: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  refundId?: string
  refundReason?: string
  paidAt?: Date
  refundedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<PaymentDoc>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    panditId: { type: Schema.Types.ObjectId, ref: 'Pandit', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['razorpay', 'cash'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    refundId: String,
    refundReason: String,
    paidAt: Date,
    refundedAt: Date,
  },
  { timestamps: true }
)

PaymentSchema.index({ customerId: 1, status: 1 })
PaymentSchema.index({ panditId: 1, status: 1 })
PaymentSchema.index({ razorpayOrderId: 1 })

export const Payment =
  (mongoose.models.Payment as mongoose.Model<PaymentDoc>) ||
  mongoose.model<PaymentDoc>('Payment', PaymentSchema)
