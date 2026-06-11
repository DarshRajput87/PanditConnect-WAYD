import mongoose, { Schema, Document } from 'mongoose'

export interface MaterialDoc extends Document {
  poojaId: mongoose.Types.ObjectId
  itemName: string
  quantity: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const MaterialSchema = new Schema<MaterialDoc>(
  {
    poojaId: { type: Schema.Types.ObjectId, ref: 'Pooja', required: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

MaterialSchema.index({ poojaId: 1 })

export const Material =
  (mongoose.models.Material as mongoose.Model<MaterialDoc>) ||
  mongoose.model<MaterialDoc>('Material', MaterialSchema)
