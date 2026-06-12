'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Banknote, Calendar, Clock, CreditCard, Loader2, MapPin, Receipt } from 'lucide-react'
import { createCashBooking, createRazorpayOrder, confirmRazorpayBooking } from '@/actions/payment'
import { dateLocaleOf, formatINR } from '@/components/pandit/format'
import { cn } from '@/lib/utils'
import type { Address } from '@/types'
import type { BookPanditDTO, BookPoojaDTO } from '@/types/dashboard'

interface Props {
  pandit: BookPanditDTO
  pooja: BookPoojaDTO
  date: string
  time: string
  address: Address
  customerName: string
  customerEmail: string
  razorpayEnabled: boolean
  onSlotLost: () => void
}

interface RazorpaySuccess {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

const IST_OFFSET_MS = 330 * 60_000

/** 'YYYY-MM-DD' + 'HH:00' in IST → UTC ISO string. */
function istToUtcIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const h = parseInt(time, 10)
  return new Date(Date.UTC(y, m - 1, d, h, 0) - IST_OFFSET_MS).toISOString()
}

export function Step4Review({
  pandit,
  pooja,
  date,
  time,
  address,
  customerName,
  customerEmail,
  razorpayEnabled,
  onSlotLost,
}: Props) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  const [method, setMethod] = useState<'razorpay' | 'cash'>(razorpayEnabled ? 'razorpay' : 'cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Razorpay checkout script — loaded once when this step mounts.
  useEffect(() => {
    if (!razorpayEnabled || window.Razorpay) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [razorpayEnabled])

  const scheduledAtIso = istToUtcIso(date, time)
  const bookingFormData = {
    panditId: pandit._id,
    poojaId: pooja._id,
    scheduledAt: scheduledAtIso,
    address,
  }

  const scheduledLabel = new Date(scheduledAtIso).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })

  function fail(code: string) {
    setError(t(`bookingWizard.errors.${code}`))
    setBusy(false)
    if (code === 'slot_taken') onSlotLost()
  }

  async function confirmCash() {
    const result = await createCashBooking(bookingFormData)
    if ('error' in result) return fail(result.error.code)
    router.push(`/booking-confirmed/${result.bookingId}`)
  }

  async function confirmRazorpay() {
    const order = await createRazorpayOrder(bookingFormData)
    if ('error' in order) return fail(order.error.code)
    if (!window.Razorpay) return fail('server')

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'PanditConnect',
      description: `${pooja.name} — ${pandit.name}`,
      prefill: { name: customerName, email: customerEmail },
      theme: { color: '#f97316' },
      handler: async (response: RazorpaySuccess) => {
        const result = await confirmRazorpayBooking({
          bookingFormData,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        })
        if ('error' in result) {
          setError(t(`bookingWizard.errors.${result.error.code}`))
          setBusy(false)
          if (result.error.code === 'slot_taken_refund') onSlotLost()
          return
        }
        router.push(`/booking-confirmed/${result.bookingId}`)
      },
      modal: {
        ondismiss: () => setBusy(false),
      },
    })
    rzp.open()
  }

  async function confirm() {
    setError('')
    setBusy(true)
    try {
      if (method === 'cash') await confirmCash()
      else await confirmRazorpay()
    } catch {
      fail('server')
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-900">{t('bookingWizard.reviewTitle')}</h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
            {pandit.profilePhoto ? (
              <img src={pandit.profilePhoto} alt={pandit.name} className="h-10 w-10 flex-shrink-0 rounded-full border border-orange-200 object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
                {pandit.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 font-medium text-neutral-900">
                {pandit.name}
                <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
              </p>
              <p className="text-xs text-neutral-500">
                {pooja.name} · <Clock className="inline h-3 w-3" /> {t('panditProfile.minutes', { count: pooja.durationMin })}
              </p>
            </div>
          </div>

          <SummaryRow icon={Calendar} label={t('bookingWizard.dateTime')} value={scheduledLabel} />
          <SummaryRow
            icon={MapPin}
            label={t('bookingWizard.addressLabel')}
            value={`${address.line1}, ${address.city}, ${address.state} – ${address.pincode}`}
          />
          <SummaryRow icon={Receipt} label={t('bookingWizard.amount')} value={formatINR(pooja.price)} />
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium text-neutral-900">{t('bookingWizard.paymentMethod')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {razorpayEnabled && (
            <PaymentOption
              selected={method === 'razorpay'}
              onSelect={() => setMethod('razorpay')}
              icon={CreditCard}
              title={t('bookingWizard.payNow')}
              sub={t('bookingWizard.payNowSub')}
            />
          )}
          <PaymentOption
            selected={method === 'cash'}
            onSelect={() => setMethod('cash')}
            icon={Banknote}
            title={t('bookingWizard.payCash')}
            sub={t('bookingWizard.payCashSub')}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={confirm}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? t('bookingWizard.processing') : t('bookingWizard.confirmBooking')}
        </button>
      </div>
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
      <div className="min-w-0">
        <p className="mb-0.5 text-xs text-neutral-400">{label}</p>
        <p className="text-neutral-900">{value}</p>
      </div>
    </div>
  )
}

function PaymentOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  sub,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ComponentType<{ className?: string }>
  title: string
  sub: string
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
        selected
          ? 'border-orange-400 bg-orange-50/50 ring-1 ring-orange-400'
          : 'border-neutral-200 hover:border-orange-200'
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', selected ? 'text-orange-600' : 'text-neutral-400')} />
      <span>
        <span className="block text-sm font-medium text-neutral-900">{title}</span>
        <span className="mt-0.5 block text-xs text-neutral-500">{sub}</span>
      </span>
    </button>
  )
}
