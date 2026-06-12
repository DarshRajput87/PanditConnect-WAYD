'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Loader2, Plus, X, CalendarOff } from 'lucide-react'
import { updatePanditAvailability } from '@/actions/pandit-availability'
import { dateLocaleOf, formatINR } from './format'
import { cn } from '@/lib/utils'
import type { CalendarBookingDTO, PanditAvailabilityDTO } from '@/types/dashboard'

interface Props {
  bookings: CalendarBookingDTO[]
  availability: PanditAvailabilityDTO
  year: number
  month: number // 0-based
  today: string // 'YYYY-MM-DD' IST
}

const pad = (n: number) => String(n).padStart(2, '0')

const DOT_COLORS: Record<string, string> = {
  requested: 'bg-amber-400',
  confirmed: 'bg-green-500',
  completed: 'bg-blue-400',
}

const BLOCK_COLORS: Record<string, string> = {
  requested: 'border-amber-300 bg-amber-100 text-amber-900',
  confirmed: 'border-green-300 bg-green-100 text-green-900',
  completed: 'border-blue-300 bg-blue-100 text-blue-900',
}

const STATUS_BADGE: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-green-50 text-green-800 border-green-200',
  completed: 'bg-blue-50 text-blue-800 border-blue-200',
}

const FIRST_HOUR = 6
const LAST_HOUR = 21 // weekly grid renders 6:00–21:00
const HOUR_PX = 44

function istDateOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function istClockOf(iso: string): { hour: number; minute: number } {
  const [h, m] = new Date(iso)
    .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })
    .split(':')
    .map(Number)
  return { hour: h, minute: m }
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

/** The Sunday on or before the given date. */
function weekStartOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return addDays(dateStr, -new Date(Date.UTC(y, m - 1, d)).getUTCDay())
}

export function CalendarSection({ bookings, availability, year, month, today }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const monthFirst = `${year}-${pad(month + 1)}-01`
  const [weekStart, setWeekStart] = useState(() =>
    weekStartOf(today.startsWith(`${year}-${pad(month + 1)}`) ? today : monthFirst)
  )

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarBookingDTO[]>()
    for (const b of bookings) {
      const key = istDateOf(b.scheduledAt)
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    return map
  }, [bookings])

  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const prev = month === 0 ? { month: 12, year: year - 1 } : { month, year } // month is 0-based; URL is 1-based
  const next = month === 11 ? { month: 1, year: year + 1 } : { month: month + 2, year }
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2023, 0, 1 + i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })
  )

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const selectedBookings = selectedDate
    ? (byDate.get(selectedDate) ?? []).slice().sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    : []

  return (
    <div className="w-full space-y-5 p-4 pb-24 md:p-6 md:pb-6">
      {/* Header: month nav + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/pandit/calendar?month=${prev.month}&year=${prev.year}`}
            aria-label={t('bookingWizard.prevMonth')}
            className="rounded-md border border-neutral-200 bg-white p-1.5 text-neutral-500 hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-36 text-center text-sm font-medium text-neutral-900">{monthLabel}</span>
          <Link
            href={`/dashboard/pandit/calendar?month=${next.month}&year=${next.year}`}
            aria-label={t('bookingWizard.nextMonth')}
            className="rounded-md border border-neutral-200 bg-white p-1.5 text-neutral-500 hover:bg-neutral-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex rounded-lg border border-neutral-200 bg-white p-0.5">
          {(['month', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                view === v ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              {t(v === 'month' ? 'panditDash.calendar.monthly' : 'panditDash.calendar.weekly')}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
        {(['requested', 'confirmed', 'completed'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', DOT_COLORS[s])} />
            {t(`customerDash.status.${s}`)}
          </span>
        ))}
      </div>

      {view === 'month' ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-3">
          <div className="grid grid-cols-7 gap-1">
            {weekdayLabels.map((w) => (
              <span key={w} className="py-1 text-center text-[11px] font-medium text-neutral-400">
                {w}
              </span>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1
              const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
              const dayBookings = byDate.get(dateStr) ?? []
              const hasRequested = dayBookings.some((b) => b.status === 'requested')
              const hasConfirmed = dayBookings.some((b) => b.status === 'confirmed')
              const isToday = dateStr === today
              const selected = dateStr === selectedDate
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(selected ? null : dateStr)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-16 flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors sm:min-h-20',
                    dayBookings.length >= 3
                      ? 'border-orange-200 bg-orange-50'
                      : hasRequested
                        ? 'border-amber-200 bg-amber-50'
                        : hasConfirmed
                          ? 'border-green-200 bg-green-50'
                          : 'border-transparent bg-white hover:bg-neutral-50',
                    isToday && 'border-orange-500',
                    selected && 'ring-2 ring-orange-400'
                  )}
                >
                  <span className={cn('text-xs', isToday ? 'font-semibold text-orange-700' : 'text-neutral-600')}>
                    {d}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="flex flex-wrap gap-0.5">
                      {dayBookings.slice(0, 4).map((b) => (
                        <span key={b._id} className={cn('h-1.5 w-1.5 rounded-full', DOT_COLORS[b.status] ?? 'bg-neutral-300')} />
                      ))}
                      {dayBookings.length > 4 && <span className="text-[9px] text-neutral-400">+{dayBookings.length - 4}</span>}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <WeekView
          weekStart={weekStart}
          onMoveWeek={(delta) => setWeekStart(addDays(weekStart, delta * 7))}
          byDate={byDate}
          today={today}
          locale={locale}
        />
      )}

      {/* Day detail panel */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">
            {selectedDate
              ? t('panditDash.calendar.bookingsOn', {
                  date: new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }),
                })
              : t('panditDash.calendar.selectDay')}
          </h2>
        </div>
        {selectedDate &&
          (selectedBookings.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-neutral-400">
              <CalendarOff className="h-4 w-4" />
              {t('panditDash.calendar.noBookingsDay')}
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {selectedBookings.map((b) => (
                <div key={b._id} className="flex items-center gap-4 px-4 py-3">
                  <span className="w-14 flex-shrink-0 text-sm font-medium text-neutral-900">
                    {new Date(b.scheduledAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Kolkata',
                    })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-900">
                      {b.customerName} · {b.poojaName}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {b.city && `${b.city} · `}
                      {formatINR(b.price)} · {b.durationMin} min
                    </p>
                  </div>
                  <span
                    className={cn(
                      'flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                      STATUS_BADGE[b.status] ?? 'border-neutral-200 bg-neutral-50 text-neutral-600'
                    )}
                  >
                    {t(`customerDash.status.${b.status}`)}
                  </span>
                  <Link
                    href={`/dashboard/pandit/inquiries/${b._id}`}
                    className="flex-shrink-0 text-xs text-orange-600 hover:underline"
                  >
                    {t('panditDash.calendar.viewDetails')}
                  </Link>
                </div>
              ))}
            </div>
          ))}
      </div>

      <AvailabilitySettings initial={availability} />
    </div>
  )
}

function WeekView({
  weekStart,
  onMoveWeek,
  byDate,
  today,
  locale,
}: {
  weekStart: string
  onMoveWeek: (delta: number) => void
  byDate: Map<string, CalendarBookingDTO[]>
  today: string
  locale: string
}) {
  const { t } = useTranslation()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5">
        <button
          onClick={() => onMoveWeek(-1)}
          aria-label={t('panditDash.calendar.prevWeek')}
          className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-neutral-700">
          {new Date(`${days[0]}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} –{' '}
          {new Date(`${days[6]}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
        </span>
        <button
          onClick={() => onMoveWeek(1)}
          aria-label={t('panditDash.calendar.nextWeek')}
          className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-neutral-100">
            <span />
            {days.map((d) => (
              <span
                key={d}
                className={cn(
                  'px-1 py-2 text-center text-[11px]',
                  d === today ? 'font-semibold text-orange-700' : 'text-neutral-500'
                )}
              >
                {new Date(`${d}T00:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>

          {/* Hour grid */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)]">
            {/* Hour labels */}
            <div>
              {hours.map((h) => (
                <div key={h} className="border-b border-neutral-50 pr-1 text-right text-[10px] text-neutral-400" style={{ height: HOUR_PX }}>
                  {pad(h)}:00
                </div>
              ))}
            </div>
            {days.map((d) => {
              const dayBookings = byDate.get(d) ?? []
              return (
                <div key={d} className="relative border-l border-neutral-100" style={{ height: hours.length * HOUR_PX }}>
                  {hours.map((h) => (
                    <div key={h} className="border-b border-neutral-50" style={{ height: HOUR_PX }} />
                  ))}
                  {dayBookings.map((b) => {
                    const { hour, minute } = istClockOf(b.scheduledAt)
                    if (hour + b.durationMin / 60 < FIRST_HOUR || hour >= LAST_HOUR) return null
                    const top = (hour - FIRST_HOUR + minute / 60) * HOUR_PX
                    const height = Math.max((b.durationMin / 60) * HOUR_PX - 2, 18)
                    return (
                      <Link
                        key={b._id}
                        href={`/dashboard/pandit/inquiries/${b._id}`}
                        className={cn(
                          'absolute inset-x-0.5 overflow-hidden rounded border px-1 py-0.5 text-[10px] leading-tight',
                          BLOCK_COLORS[b.status] ?? 'border-neutral-200 bg-neutral-100 text-neutral-700'
                        )}
                        style={{ top: Math.max(top, 0), height }}
                        title={`${b.customerName} — ${b.poojaName}`}
                      >
                        <span className="block truncate font-medium">{b.customerName}</span>
                        <span className="block truncate">{b.poojaName}</span>
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function AvailabilitySettings({ initial }: { initial: PanditAvailabilityDTO }) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  const [workingDays, setWorkingDays] = useState<number[]>(initial.workingDays)
  const [start, setStart] = useState(initial.workingHoursStart)
  const [end, setEnd] = useState(initial.workingHoursEnd)
  const [maxPerDay, setMaxPerDay] = useState(initial.maxPerDay ? String(initial.maxPerDay) : '')
  const [blockedDates, setBlockedDates] = useState<string[]>(initial.blockedDates)
  const [newBlocked, setNewBlocked] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const dayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2023, 0, 1 + i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })
  )

  function toggleDay(d: number) {
    setWorkingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  function addBlocked() {
    if (!newBlocked || blockedDates.includes(newBlocked)) return
    setBlockedDates((prev) => [...prev, newBlocked].sort())
    setNewBlocked('')
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setError('')
    const result = await updatePanditAvailability({
      workingDays,
      workingHoursStart: start,
      workingHoursEnd: end,
      maxPerDay: maxPerDay ? Number(maxPerDay) : null,
      blockedDates,
    })
    if ('error' in result) {
      setError(t(`panditDash.errors.${result.error.code === 'server' ? 'server' : 'invalid_input'}`))
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    }
    setSaving(false)
  }

  const inputClass =
    'rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.calendar.availabilityTitle')}</h2>
      </div>
      <div className="space-y-4 p-4">
        {/* Working days */}
        <div>
          <p className="mb-2 text-xs font-medium text-neutral-700">{t('panditDash.calendar.workingDays')}</p>
          <div className="flex flex-wrap gap-1.5">
            {dayLabels.map((label, d) => (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                aria-pressed={workingDays.includes(d)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  workingDays.includes(d)
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-neutral-200 bg-white text-neutral-400 hover:text-neutral-600'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Working hours + max per day */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-700">{t('panditDash.calendar.workingHours')}</p>
            <div className="flex items-center gap-2">
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
              <span className="text-xs text-neutral-400">{t('panditDash.calendar.to')}</span>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-neutral-700">{t('panditDash.calendar.maxPerDay')}</p>
            <input
              type="number"
              min={1}
              max={20}
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(e.target.value)}
              placeholder={t('panditDash.calendar.unlimited')}
              className={cn(inputClass, 'w-40')}
            />
          </div>
        </div>

        {/* Blocked dates */}
        <div>
          <p className="mb-2 text-xs font-medium text-neutral-700">{t('panditDash.calendar.blockedDates')}</p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newBlocked}
              onChange={(e) => setNewBlocked(e.target.value)}
              className={inputClass}
            />
            <button
              onClick={addBlocked}
              disabled={!newBlocked}
              className="flex items-center gap-1 rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
              {t('panditDash.calendar.addDate')}
            </button>
          </div>
          {blockedDates.length === 0 ? (
            <p className="mt-2 text-xs text-neutral-400">{t('panditDash.calendar.noBlocked')}</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {blockedDates.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700"
                >
                  {new Date(`${d}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                  <button
                    onClick={() => setBlockedDates((prev) => prev.filter((x) => x !== d))}
                    aria-label={t('panditDash.calendar.removeDate')}
                    className="text-neutral-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
          <button
            onClick={save}
            disabled={saving || workingDays.length === 0 || !start || !end || start >= end}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {saving ? t('panditDash.serviceForm.saving') : t('panditDash.calendar.save')}
          </button>
          {saved && <span className="text-xs text-green-600">{t('panditDash.calendar.saved')}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  )
}
