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
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<ReviewDoc>(
  {
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
    status: { type: String, enum: ['pending', 'published', 'hidden', 'removed'], default: 'pending' },
    panditReply: { text: String, at: Date },
    flaggedBy: [Schema.Types.ObjectId],
    editHistory: [{ text: String, editedAt: Date }],
  },
  { timestamps: true }
)

ReviewSchema.index({ panditId: 1, status: 1 })
ReviewSchema.index({ customerId: 1 })
// bookingId unique index comes from the field-level `unique: true` above.

export const Review =
  (mongoose.models.Review as mongoose.Model<ReviewDoc>) ||
  mongoose.model<ReviewDoc>('Review', ReviewSchema)
