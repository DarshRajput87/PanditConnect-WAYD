import mongoose, { Schema, Document } from 'mongoose'

export interface PoojaDoc extends Document {
  panditId: mongoose.Types.ObjectId
  catalogKey: string
  name: string
  description: string
  price: number
  durationMin: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const PoojaSchema = new Schema<PoojaDoc>(
  {
    panditId: { type: Schema.Types.ObjectId, ref: 'Pandit', required: true },
    catalogKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    durationMin: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

PoojaSchema.index({ panditId: 1 })
PoojaSchema.index({ catalogKey: 1 })
PoojaSchema.index({ panditId: 1, active: 1 })

export const Pooja =
  (mongoose.models.Pooja as mongoose.Model<PoojaDoc>) ||
  mongoose.model<PoojaDoc>('Pooja', PoojaSchema)
