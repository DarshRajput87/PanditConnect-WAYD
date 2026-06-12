'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { Material } from '@/lib/db/models/Material'
import { ServiceSchema, MaterialSchema } from '@/lib/validators/pandit'
import mongoose from 'mongoose'
import { z } from 'zod'
import type { MaterialDTO } from '@/types/dashboard'

type ServiceErrorCode = 'unauthorized' | 'not_found' | 'invalid_input' | 'limit_reached' | 'server'
export type ServiceActionResult = { error: { code: ServiceErrorCode } } | { success: true }
export type MaterialActionResult = { error: { code: ServiceErrorCode } } | { success: true; material: MaterialDTO }

const MAX_SERVICES = 12
const MAX_MATERIALS = 30

// The dashboard form edits the core fields; materials are managed via the
// material CRUD actions below (create accepts an initial set).
const DashboardServiceSchema = ServiceSchema.omit({ materials: true })

async function getSessionPandit() {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return null
  await connectDB()
  // Callers only need the _id for ownership checks.
  return Pandit.findOne({ userId: session.user.id }).select('_id').lean()
}

export async function togglePoojaActive(serviceId: string, active: boolean): Promise<ServiceActionResult> {
  try {
    const pandit = await getSessionPandit()
    if (!pandit) return { error: { code: 'unauthorized' } }
    if (!mongoose.isValidObjectId(serviceId)) return { error: { code: 'not_found' } }

    const res = await Pooja.updateOne(
      { _id: serviceId, panditId: pandit._id },
      { $set: { active: Boolean(active) } }
    )
    if (res.matchedCount === 0) return { error: { code: 'not_found' } }
    return { success: true }
  } catch (e) {
    console.error('[services] togglePoojaActive failed', e)
    return { error: { code: 'server' } }
  }
}

export async function createPooja(input: unknown): Promise<ServiceActionResult> {
  try {
    const pandit = await getSessionPandit()
    if (!pandit) return { error: { code: 'unauthorized' } }

    const parsed = ServiceSchema.safeParse(input)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    const count = await Pooja.countDocuments({ panditId: pandit._id })
    if (count >= MAX_SERVICES) return { error: { code: 'limit_reached' } }

    const { materials, ...service } = parsed.data
    const pooja = await Pooja.create({ ...service, panditId: pandit._id, active: true })
    if (materials.length) {
      await Material.insertMany(materials.map((m) => ({ ...m, poojaId: pooja._id })))
    }
    return { success: true }
  } catch (e) {
    console.error('[services] createPooja failed', e)
    return { error: { code: 'server' } }
  }
}

export async function updatePooja(serviceId: string, input: unknown): Promise<ServiceActionResult> {
  try {
    const pandit = await getSessionPandit()
    if (!pandit) return { error: { code: 'unauthorized' } }
    if (!mongoose.isValidObjectId(serviceId)) return { error: { code: 'not_found' } }

    const parsed = DashboardServiceSchema.safeParse(input)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    const res = await Pooja.updateOne(
      { _id: serviceId, panditId: pandit._id },
      { $set: parsed.data }
    )
    if (res.matchedCount === 0) return { error: { code: 'not_found' } }
    return { success: true }
  } catch (e) {
    console.error('[services] updatePooja failed', e)
    return { error: { code: 'server' } }
  }
}

export async function addMaterial(poojaId: string, input: unknown): Promise<MaterialActionResult> {
  try {
    const pandit = await getSessionPandit()
    if (!pandit) return { error: { code: 'unauthorized' } }
    if (!mongoose.isValidObjectId(poojaId)) return { error: { code: 'not_found' } }

    const pooja = await Pooja.findOne({ _id: poojaId, panditId: pandit._id }).select('_id').lean()
    if (!pooja) return { error: { code: 'not_found' } }

    const parsed = MaterialSchema.safeParse(input)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    const count = await Material.countDocuments({ poojaId })
    if (count >= MAX_MATERIALS) return { error: { code: 'limit_reached' } }

    const material = await Material.create({
      poojaId,
      itemName: parsed.data.itemName.trim(),
      quantity: parsed.data.quantity.trim(),
      notes: parsed.data.notes?.trim() || '',
    })
    return {
      success: true,
      material: {
        _id: String(material._id),
        itemName: material.itemName,
        quantity: material.quantity,
        notes: material.notes || undefined,
      },
    }
  } catch (e) {
    console.error('[services] addMaterial failed', e)
    return { error: { code: 'server' } }
  }
}

// Loads a material only if its pooja belongs to the session pandit.
async function findOwnedMaterial(materialId: string) {
  const pandit = await getSessionPandit()
  if (!pandit) return null
  if (!mongoose.isValidObjectId(materialId)) return null
  const material = await Material.findById(materialId).select('poojaId').lean()
  if (!material) return null
  const pooja = await Pooja.findOne({ _id: material.poojaId, panditId: pandit._id }).select('_id').lean()
  return pooja ? material : null
}

export async function updateMaterial(materialId: string, input: unknown): Promise<ServiceActionResult> {
  try {
    const material = await findOwnedMaterial(materialId)
    if (!material) return { error: { code: 'not_found' } }

    const parsed = MaterialSchema.safeParse(input)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    await Material.updateOne(
      { _id: materialId },
      {
        $set: {
          itemName: parsed.data.itemName.trim(),
          quantity: parsed.data.quantity.trim(),
          notes: parsed.data.notes?.trim() || '',
        },
      }
    )
    return { success: true }
  } catch (e) {
    console.error('[services] updateMaterial failed', e)
    return { error: { code: 'server' } }
  }
}

export async function deleteMaterial(materialId: string): Promise<ServiceActionResult> {
  try {
    const material = await findOwnedMaterial(materialId)
    if (!material) return { error: { code: 'not_found' } }

    await Material.deleteOne({ _id: materialId })
    return { success: true }
  } catch (e) {
    console.error('[services] deleteMaterial failed', e)
    return { error: { code: 'server' } }
  }
}

export type DashboardServiceInput = z.infer<typeof DashboardServiceSchema>
