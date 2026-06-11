'use client'
import { useTranslation } from 'react-i18next'
import { Check, X, Clock } from 'lucide-react'
import { dateLocaleOf } from '@/components/pandit/format'
import { cn } from '@/lib/utils'

type StepState = 'done' | 'current' | 'future' | 'failed'

interface Step {
  labelKey: string
  state: StepState
  at?: string | null
}

interface Props {
  status: string
  hasReview: boolean
  timestamps: { requested: string; responded: string | null; completed: string | null }
  cancelledAt?: string | null
}

export function BookingTimeline({ status, hasReview, timestamps, cancelledAt }: Props) {
  const { t, i18n } = useTranslation()
  const fmt = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(dateLocaleOf(i18n.language), {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
      : undefined

  const steps: Step[] = [{ labelKey: 'customerDash.timeline.requested', state: 'done', at: timestamps.requested }]

  if (status === 'declined') {
    steps.push({ labelKey: 'customerDash.timeline.declined', state: 'failed', at: timestamps.responded })
  } else if (status === 'expired') {
    steps.push({ labelKey: 'customerDash.timeline.expired', state: 'failed' })
  } else if (status === 'cancelled') {
    if (timestamps.responded) {
      steps.push({ labelKey: 'customerDash.timeline.confirmed', state: 'done', at: timestamps.responded })
    }
    steps.push({ labelKey: 'customerDash.timeline.cancelled', state: 'failed', at: cancelledAt })
  } else {
    // requested → confirmed → completed → reviewed
    steps.push({
      labelKey: status === 'requested' ? 'customerDash.timeline.awaiting' : 'customerDash.timeline.confirmed',
      state: status === 'requested' ? 'current' : 'done',
      at: timestamps.responded,
    })
    steps.push({
      labelKey: 'customerDash.timeline.completed',
      state: status === 'completed' ? 'done' : status === 'confirmed' ? 'current' : 'future',
      at: timestamps.completed,
    })
    steps.push({
      labelKey: 'customerDash.timeline.reviewed',
      state: status === 'completed' ? (hasReview ? 'done' : 'current') : 'future',
    })
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <ol className="space-y-0">
        {steps.map((step, i) => (
          <li key={step.labelKey} className="relative flex gap-3 pb-5 last:pb-0">
            {/* connector */}
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-12px)] w-px',
                  step.state === 'done' ? 'bg-blue-300' : 'bg-neutral-200'
                )}
                aria-hidden
              />
            )}
            {/* dot */}
            <span
              className={cn(
                'z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border',
                step.state === 'done' && 'border-green-300 bg-green-50 text-green-600',
                step.state === 'current' && 'border-blue-400 bg-blue-500 text-white',
                step.state === 'future' && 'border-neutral-200 bg-white text-neutral-300',
                step.state === 'failed' && 'border-red-300 bg-red-50 text-red-500'
              )}
            >
              {step.state === 'done' && <Check className="h-3.5 w-3.5" />}
              {step.state === 'current' && <Clock className="h-3 w-3" />}
              {step.state === 'failed' && <X className="h-3.5 w-3.5" />}
              {step.state === 'future' && <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm',
                  step.state === 'future' ? 'text-neutral-400' : 'font-medium text-neutral-900',
                  step.state === 'failed' && 'text-red-700'
                )}
              >
                {t(step.labelKey)}
              </p>
              {step.at && <p className="text-xs text-neutral-400">{fmt(step.at)}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
