'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Check } from 'lucide-react'
import { Step1Service } from './Step1Service'
import { Step2DateTime } from './Step2DateTime'
import { Step3Address } from './Step3Address'
import { Step4Review } from './Step4Review'
import { cn } from '@/lib/utils'
import type { Address } from '@/types'
import type { BookPanditDTO, BookPoojaDTO } from '@/types/dashboard'

interface Props {
  pandit: BookPanditDTO
  poojas: BookPoojaDTO[]
  savedAddress: Address | null
  initialPoojaId: string
  initialDate: string
  initialTime: string
  customerName: string
  customerEmail: string
  razorpayEnabled: boolean
}

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', pincode: '' }

export function BookingWizard({
  pandit,
  poojas,
  savedAddress,
  initialPoojaId,
  initialDate,
  initialTime,
  customerName,
  customerEmail,
  razorpayEnabled,
}: Props) {
  const { t } = useTranslation()

  // All wizard state lives here so Back never loses entered data.
  const [step, setStep] = useState(1)
  const [poojaId, setPoojaId] = useState(initialPoojaId)
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [address, setAddress] = useState<Address>(savedAddress ?? EMPTY_ADDRESS)

  const selectedPooja = poojas.find((p) => p._id === poojaId) ?? null

  const steps = [
    t('bookingWizard.steps.service'),
    t('bookingWizard.steps.datetime'),
    t('bookingWizard.steps.address'),
    t('bookingWizard.steps.review'),
  ]

  const addressValid =
    address.line1.trim().length >= 3 &&
    address.city.trim().length >= 2 &&
    address.state.trim().length >= 2 &&
    /^\d{6}$/.test(address.pincode)

  const canContinue =
    step === 1 ? Boolean(selectedPooja) : step === 2 ? Boolean(date && time) : step === 3 ? addressValid : false

  const initials = pandit.name
    .split(' ')
    .filter((w) => !['Pt.', 'Pandit'].includes(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-[70vh] bg-neutral-50">
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
        {/* Step indicator */}
        <ol className="flex items-center justify-center gap-1 sm:gap-2" aria-label={t('bookingWizard.stepOf', { current: step, total: 4 })}>
          {steps.map((label, i) => {
            const n = i + 1
            const state = n < step ? 'done' : n === step ? 'current' : 'future'
            return (
              <li key={label} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && <span className={cn('h-px w-4 sm:w-8', n <= step ? 'bg-orange-400' : 'bg-neutral-200')} />}
                <span className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                      state === 'done' && 'bg-orange-500 text-white',
                      state === 'current' && 'bg-orange-500 text-white ring-4 ring-orange-100',
                      state === 'future' && 'border border-neutral-300 bg-white text-neutral-400'
                    )}
                  >
                    {state === 'done' ? <Check className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span
                    className={cn(
                      'hidden text-[10px] sm:block',
                      state === 'current' ? 'font-medium text-neutral-900' : 'text-neutral-400'
                    )}
                  >
                    {label}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>

        {/* Pandit mini-header */}
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          {pandit.profilePhoto ? (
            <img src={pandit.profilePhoto} alt={pandit.name} className="h-12 w-12 flex-shrink-0 rounded-full border border-orange-200 object-cover" />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-sm font-medium text-orange-700">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900">
              {pandit.name}
              <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
            </p>
            <p className="text-xs text-neutral-500">
              {pandit.sampraday ? `${pandit.sampraday} · ` : ''}
              {t('customerDash.search.experienceYears', { count: pandit.experienceYears })}
              {pandit.ratingCount > 0 && <> · ★ {pandit.ratingAvg.toFixed(1)}</>}
            </p>
          </div>
        </div>

        {/* Step body */}
        {step === 1 && <Step1Service poojas={poojas} selectedId={poojaId} onSelect={setPoojaId} />}
        {step === 2 && selectedPooja && (
          <Step2DateTime
            pandit={pandit}
            pooja={selectedPooja}
            date={date}
            time={time}
            onPick={(d, tm) => {
              setDate(d)
              setTime(tm)
            }}
          />
        )}
        {step === 3 && (
          <Step3Address
            address={address}
            onChange={setAddress}
            savedAddress={savedAddress}
            serviceAreas={pandit.serviceAreas}
          />
        )}
        {step === 4 && selectedPooja && (
          <Step4Review
            pandit={pandit}
            pooja={selectedPooja}
            date={date}
            time={time}
            address={address}
            customerName={customerName}
            customerEmail={customerEmail}
            razorpayEnabled={razorpayEnabled}
            onSlotLost={() => {
              // Server says the slot is gone — send the user back to re-pick.
              setTime('')
              setStep(2)
            }}
          />
        )}

        {/* Nav buttons (step 4 renders its own confirm button) */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              {t('bookingWizard.back')}
            </button>
          ) : (
            <span />
          )}
          {step < 4 && (
            <button
              onClick={() => canContinue && setStep(step + 1)}
              disabled={!canContinue}
              className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('bookingWizard.next')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
