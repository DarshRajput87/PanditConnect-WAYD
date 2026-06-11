'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { Pooja } from '@/lib/db/models/Pooja'
import { ServiceSchema } from '@/lib/validators/pandit'
import mongoose from 'mongoose'
import { z } from 'zod'

type ServiceErrorCode = 'unauthorized' | 'not_found' | 'invalid_input' | 'limit_reached' | 'server'
export type ServiceActionResult = { error: { code: ServiceErrorCode } } | { success: true }

const MAX_SERVICES = 12

// Dashboard form edits the core fields only; samagri (materials) stays in the wizard.
const DashboardServiceSchema = ServiceSchema.omit({ materials: true })

async function getSessionPandit() {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return null
  await connectDB()
  return Pandit.findOne({ userId: session.user.id })
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

    const parsed = DashboardServiceSchema.safeParse(input)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    const count = await Pooja.countDocuments({ panditId: pandit._id })
    if (count >= MAX_SERVICES) return { error: { code: 'limit_reached' } }

    await Pooja.create({ ...parsed.data, panditId: pandit._id, active: true })
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

export type DashboardServiceInput = z.infer<typeof DashboardServiceSchema>
