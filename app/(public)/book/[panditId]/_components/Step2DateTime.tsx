'use client'
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Loader2, Star, AlertCircle } from 'lucide-react'
import { dateLocaleOf, formatINR } from '@/components/pandit/format'
import { cn } from '@/lib/utils'
import type { BookPanditDTO, BookPoojaDTO } from '@/types/dashboard'

interface Props {
  pandit: BookPanditDTO
  pooja: BookPoojaDTO
  date: string // 'YYYY-MM-DD' or ''
  time: string // 'HH:00' or ''
  onPick: (date: string, time: string) => void
}

interface Slot {
  time: string
  available: boolean
}

interface Alternative {
  _id: string
  name: string
  profilePhoto: string
  ratingAvg: number
  ratingCount: number
  experienceYears: number
  price: number
  poojaId: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Today's calendar date in IST. */
function istToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

export function Step2DateTime({ pandit, pooja, date, time, onPick }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  const today = istToday()
  const maxDate = addDays(today, 365)

  const [cursor, setCursor] = useState(() => {
    const base = date || today
    const [y, m] = base.split('-').map(Number)
    return { year: y, month: m - 1 }
  })

  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [dayReason, setDayReason] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState(false)

  // Conflict flow state
  const [conflictTime, setConflictTime] = useState<string | null>(null)
  const [highlightFree, setHighlightFree] = useState(false)
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null)
  const [loadingAlts, setLoadingAlts] = useState(false)
  const slotsRef = useRef<HTMLDivElement>(null)

  const fetchSlots = useCallback(
    async (forDate: string) => {
      setLoadingSlots(true)
      setSlotsError(false)
      setSlots(null)
      setDayReason(null)
      try {
        const res = await fetch(
          `/api/bookings/slots?panditId=${pandit._id}&date=${forDate}&durationMin=${pooja.durationMin}`
        )
        if (!res.ok) throw new Error('slots failed')
        const data: { slots: Slot[]; reason: string | null } = await res.json()
        setSlots(data.slots)
        setDayReason(data.reason)
      } catch {
        setSlotsError(true)
      } finally {
        setLoadingSlots(false)
      }
    },
    [pandit._id, pooja.durationMin]
  )

  useEffect(() => {
    if (date) fetchSlots(date)
  }, [date, fetchSlots])

  function pickDate(d: string) {
    setConflictTime(null)
    setHighlightFree(false)
    setAlternatives(null)
    onPick(d, '')
  }

  function pickSlot(slot: Slot) {
    if (slot.available) {
      setConflictTime(null)
      setAlternatives(null)
      onPick(date, slot.time)
    } else {
      // Conflict — show inline options instead of selecting.
      setConflictTime(slot.time)
      setAlternatives(null)
      onPick(date, '')
    }
  }

  async function findAlternatives() {
    if (!conflictTime) return
    setLoadingAlts(true)
    try {
      const qs = new URLSearchParams({
        catalogKey: pooja.catalogKey,
        date,
        time: conflictTime,
        excludePanditId: pandit._id,
        ratingAvg: String(pandit.ratingAvg || 0),
        experienceYears: String(pandit.experienceYears || 0),
      })
      const res = await fetch(`/api/search/alternatives?${qs}`)
      const data: { alternatives?: Alternative[] } = res.ok ? await res.json() : {}
      setAlternatives(data.alternatives ?? [])
    } catch {
      setAlternatives([])
    } finally {
      setLoadingAlts(false)
    }
  }

  // ---- calendar grid ----
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay()
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    // 2023-01-01 was a Sunday — stable anchor for localized weekday letters.
    new Date(Date.UTC(2023, 0, 1 + i)).toLocaleDateString(locale, { weekday: 'narrow', timeZone: 'UTC' })
  )

  function moveMonth(delta: number) {
    setCursor((c) => {
      const m = c.month + delta
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 }
    })
  }

  const dayReasonText =
    dayReason === 'not_working_day'
      ? t('bookingWizard.dayNotWorking')
      : dayReason === 'blocked_date'
        ? t('bookingWizard.dayBlocked')
        : dayReason === 'day_full'
          ? t('bookingWizard.dayFull')
          : dayReason
            ? t('bookingWizard.dayNotWorking')
            : null

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-900">{t('bookingWizard.pickDate')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => moveMonth(-1)}
              aria-label={t('bookingWizard.prevMonth')}
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-32 text-center text-sm text-neutral-700">{monthLabel}</span>
            <button
              onClick={() => moveMonth(1)}
              aria-label={t('bookingWizard.nextMonth')}
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayLabels.map((w, i) => (
            <span key={i} className="py-1 text-[11px] text-neutral-400">
              {w}
            </span>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const dateStr = `${cursor.year}-${pad(cursor.month + 1)}-${pad(d)}`
            const disabled = dateStr < today || dateStr > maxDate
            const selected = dateStr === date
            const isToday = dateStr === today
            return (
              <button
                key={dateStr}
                onClick={() => !disabled && pickDate(dateStr)}
                disabled={disabled}
                aria-pressed={selected}
                className={cn(
                  'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                  disabled && 'cursor-not-allowed text-neutral-300',
                  !disabled && !selected && 'text-neutral-700 hover:bg-orange-50',
                  selected && 'bg-orange-500 font-medium text-white',
                  isToday && !selected && 'border border-orange-400'
                )}
              >
                {d}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      <div ref={slotsRef} className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium text-neutral-900">{t('bookingWizard.pickTime')}</h2>

        {!date && <p className="py-4 text-center text-sm text-neutral-400">{t('bookingWizard.selectDateFirst')}</p>}

        {date && loadingSlots && (
          <p className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('bookingWizard.loadingSlots')}
          </p>
        )}

        {date && slotsError && (
          <p className="py-4 text-center text-sm text-red-600">{t('bookingWizard.errors.server')}</p>
        )}

        {date && !loadingSlots && slots && (
          <>
            {dayReasonText && (
              <p className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                {dayReasonText}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {slots.map((slot) => {
                const selected = slot.time === time
                return (
                  <button
                    key={slot.time}
                    onClick={() => pickSlot(slot)}
                    aria-pressed={selected}
                    aria-disabled={!slot.available}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-sm transition-all',
                      selected && 'border-orange-500 bg-orange-500 font-medium text-white',
                      !selected &&
                        slot.available &&
                        'border-neutral-200 bg-white text-neutral-700 hover:border-orange-300 hover:bg-orange-50',
                      !selected && !slot.available && 'border-neutral-100 bg-neutral-50 text-neutral-300 line-through',
                      highlightFree && slot.available && !selected && 'ring-2 ring-green-300'
                    )}
                  >
                    {slot.time}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded border border-neutral-300 bg-white" />
                {t('bookingWizard.slotAvailable')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-neutral-200" />
                {t('bookingWizard.slotBooked')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-orange-500" />
                {t('bookingWizard.slotSelected')}
              </span>
            </div>
          </>
        )}

        {/* Conflict panel — inline, no redirect */}
        {conflictTime && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              {t('bookingWizard.slotTakenInline', { time: conflictTime })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setHighlightFree(true)
                  slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                {t('bookingWizard.seeOtherSlots')}
              </button>
              <button
                onClick={findAlternatives}
                disabled={loadingAlts}
                className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {loadingAlts && <Loader2 className="h-3 w-3 animate-spin" />}
                {loadingAlts ? t('bookingWizard.loadingAlternatives') : t('bookingWizard.findSimilar')}
              </button>
            </div>

            {alternatives !== null && (
              <div className="mt-3 space-y-2">
                {alternatives.length === 0 ? (
                  <p className="text-xs text-amber-800">{t('bookingWizard.noAlternatives')}</p>
                ) : (
                  alternatives.map((alt) => (
                    <div key={alt._id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
                      {alt.profilePhoto ? (
                        <img src={alt.profilePhoto} alt={alt.name} className="h-10 w-10 flex-shrink-0 rounded-full border border-orange-200 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
                          {alt.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">{alt.name}</p>
                        <p className="flex items-center gap-1 text-xs text-neutral-500">
                          {alt.ratingCount > 0 && (
                            <>
                              <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                              {alt.ratingAvg.toFixed(1)} ·
                            </>
                          )}
                          {t('customerDash.search.experienceYears', { count: alt.experienceYears })} ·{' '}
                          {formatINR(alt.price)}
                        </p>
                      </div>
                      <Link
                        href={`/book/${alt._id}?poojaId=${alt.poojaId}&date=${date}&time=${conflictTime}`}
                        className="flex-shrink-0 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
                      >
                        {t('bookingWizard.altBook')}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
