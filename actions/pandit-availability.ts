'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { istSlotToUtc, DATE_RE } from '@/lib/booking/slots'
import { z } from 'zod'

type AvailabilityErrorCode = 'unauthorized' | 'invalid_input' | 'server'
export type AvailabilityResult = { error: { code: AvailabilityErrorCode } } | { success: true }

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

const AvailabilitySchema = z
  .object({
    workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    workingHoursStart: z.string().regex(TIME_RE),
    workingHoursEnd: z.string().regex(TIME_RE),
    maxPerDay: z.number().int().min(1).max(20).nullable(),
    blockedDates: z.array(z.string().regex(DATE_RE)).max(100),
  })
  .refine((v) => v.workingHoursStart < v.workingHoursEnd, { message: 'start must be before end' })

export async function updatePanditAvailability(input: unknown): Promise<AvailabilityResult> {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'pandit') return { error: { code: 'unauthorized' } }

    const parsed = AvailabilitySchema.safeParse(input)
    if (!parsed.success) return { error: { code: 'invalid_input' } }

    await connectDB()
    const res = await Pandit.updateOne(
      { userId: session.user.id },
      {
        $set: {
          availability: {
            workingDays: [...new Set(parsed.data.workingDays)].sort(),
            workingHoursStart: parsed.data.workingHoursStart,
            workingHoursEnd: parsed.data.workingHoursEnd,
            maxPerDay: parsed.data.maxPerDay,
            // Stored as the UTC instant of IST midnight for each blocked date.
            blockedDates: [...new Set(parsed.data.blockedDates)].map((d) => istSlotToUtc(d, 0)),
          },
        },
      }
    )
    if (res.matchedCount === 0) return { error: { code: 'unauthorized' } }
    return { success: true }
  } catch (e) {
    console.error('[availability] update failed', e)
    return { error: { code: 'server' } }
  }
}
