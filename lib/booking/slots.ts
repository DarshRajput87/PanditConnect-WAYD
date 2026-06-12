// Slot availability engine — single source of truth for "is this pandit free
// at this time?". Used by the public slots API, the alternatives API and the
// server-side re-validation before a booking is created.
//
// All ceremony times are stored in UTC and presented in IST (Asia/Kolkata).
// IST has a fixed +05:30 offset (no DST), so the conversion is plain math.

import { connectDB } from '@/lib/db/connect'
import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'
// Side-effect import: registers the Pooja model for .populate('poojaId').
import '@/lib/db/models/Pooja'

const IST_OFFSET_MS = 330 * 60_000

export const SLOT_FIRST_HOUR = 6 // 06:00 IST
export const SLOT_LAST_HOUR = 20 // 20:00 IST (last bookable start)
export const CONFLICT_BUFFER_MIN = 30 // travel/setup buffer around each booking
export const MIN_LEAD_TIME_MS = 4 * 3_600_000 // bookings must be > 4h away
export const MAX_ADVANCE_MS = 365 * 86_400_000 // and < 1 year ahead

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 'YYYY-MM-DD' + IST hour → UTC instant. */
export function istSlotToUtc(date: string, hour: number): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour, 0) - IST_OFFSET_MS)
}

/** The UTC range covering one IST calendar day. */
export function istDayRangeUtc(date: string): { start: Date; end: Date } {
  const start = istSlotToUtc(date, 0)
  return { start, end: new Date(start.getTime() + 86_400_000) }
}

/** Weekday (0=Sun) of an IST calendar date. */
export function istWeekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** A UTC instant rendered as the IST calendar date 'YYYY-MM-DD'. */
export function istDateStr(at: Date): string {
  return new Date(at.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
}

/** A UTC instant rendered as the IST wall-clock time 'HH:mm'. */
export function istTimeStr(at: Date): string {
  return new Date(at.getTime() + IST_OFFSET_MS).toISOString().slice(11, 16)
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export interface SlotInfo {
  time: string // 'HH:00' IST
  available: boolean
}

export type SlotDayReason = 'not_working_day' | 'blocked_date' | 'day_full' | 'pandit_unavailable'

export interface SlotDay {
  slots: SlotInfo[]
  reason?: SlotDayReason
}

function allSlotTimes(): string[] {
  const times: string[] = []
  for (let h = SLOT_FIRST_HOUR; h <= SLOT_LAST_HOUR; h++) times.push(`${String(h).padStart(2, '0')}:00`)
  return times
}

/**
 * Availability for every hourly slot of one IST day, honouring the pandit's
 * working days/hours, blocked dates, per-day cap, existing bookings (with a
 * 30-minute buffer either side) and the 4-hour minimum lead time.
 */
export async function getSlotAvailability(panditId: string, date: string, durationMin: number): Promise<SlotDay> {
  await connectDB()
  const unavailable = (reason?: SlotDayReason): SlotDay => ({
    slots: allSlotTimes().map((time) => ({ time, available: false })),
    reason,
  })

  const pandit = await Pandit.findById(panditId).select('availability verificationStatus').lean()
  if (!pandit || pandit.verificationStatus !== 'verified') return unavailable('pandit_unavailable')

  const av = pandit.availability
  const workingDays = av?.workingDays?.length ? av.workingDays : [0, 1, 2, 3, 4, 5, 6]
  if (!workingDays.includes(istWeekday(date))) return unavailable('not_working_day')
  if (av?.blockedDates?.some((b) => istDateStr(new Date(b)) === date)) return unavailable('blocked_date')

  const { start, end } = istDayRangeUtc(date)
  // Look back 12h so a late booking from the previous evening still blocks
  // this day's early slots via its duration + buffer.
  const bookings = await Booking.find({
    panditId,
    status: { $in: ['requested', 'confirmed'] },
    scheduledAt: { $gte: new Date(start.getTime() - 12 * 3_600_000), $lt: end },
  })
    .select('scheduledAt poojaId')
    .populate<{ poojaId: { durationMin?: number } | null }>('poojaId', 'durationMin')
    .lean()

  const dayCount = bookings.filter((b) => b.scheduledAt >= start && b.scheduledAt < end).length
  if (av?.maxPerDay != null && av.maxPerDay > 0 && dayCount >= av.maxPerDay) return unavailable('day_full')

  const blockedWindows = bookings.map((b) => {
    const dur = b.poojaId?.durationMin ?? 60
    const startMs = b.scheduledAt.getTime() - CONFLICT_BUFFER_MIN * 60_000
    const endMs = b.scheduledAt.getTime() + (dur + CONFLICT_BUFFER_MIN) * 60_000
    return { startMs, endMs }
  })

  const hoursStart = minutesOf(av?.workingHoursStart || '06:00')
  const hoursEnd = minutesOf(av?.workingHoursEnd || '20:00')
  const earliestBookable = Date.now() + MIN_LEAD_TIME_MS

  const slots = allSlotTimes().map((time) => {
    const hour = parseInt(time, 10)
    const slotStart = istSlotToUtc(date, hour).getTime()
    const slotEnd = slotStart + durationMin * 60_000
    const withinHours = hour * 60 >= hoursStart && hour * 60 < hoursEnd
    const inFuture = slotStart >= earliestBookable
    const conflict = blockedWindows.some((w) => slotStart < w.endMs && slotEnd > w.startMs)
    return { time, available: withinHours && inFuture && !conflict }
  })

  return { slots }
}

export type SlotCheck = { ok: true } | { ok: false; code: SlotDayReason | 'slot_taken' | 'invalid_slot' }

/** Final server-side check before creating a booking for a specific instant. */
export async function checkSlotBookable(panditId: string, scheduledAt: Date, durationMin: number): Promise<SlotCheck> {
  const ms = scheduledAt.getTime()
  if (Number.isNaN(ms)) return { ok: false, code: 'invalid_slot' }
  if (ms < Date.now() + MIN_LEAD_TIME_MS || ms > Date.now() + MAX_ADVANCE_MS) {
    return { ok: false, code: 'invalid_slot' }
  }

  const date = istDateStr(scheduledAt)
  const time = istTimeStr(scheduledAt)
  const day = await getSlotAvailability(panditId, date, durationMin)
  const slot = day.slots.find((s) => s.time === time)
  if (!slot) return { ok: false, code: 'invalid_slot' }
  if (!slot.available) return { ok: false, code: day.reason ?? 'slot_taken' }
  return { ok: true }
}
