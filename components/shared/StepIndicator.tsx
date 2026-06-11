'use client'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  steps: string[]
  current: number // zero-based index of the active step
}

export function StepIndicator({ steps, current }: Props) {
  return (
    <div>
      {/* Desktop / tablet: full horizontal bar */}
      <ol className="hidden items-center sm:flex">
        {steps.map((label, i) => {
          const completed = i < current
          const active = i === current
          const isLast = i === steps.length - 1
          return (
            <li key={label} className={cn('flex items-center', !isLast && 'flex-1')}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                    completed && 'border-orange-500 bg-orange-500 text-white',
                    active && 'border-orange-500 bg-white text-orange-600',
                    !completed && !active && 'border-neutral-200 bg-white text-neutral-400'
                  )}
                >
                  {completed ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    active ? 'text-neutral-900' : 'text-neutral-500'
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={cn(
                    'mx-3 h-px flex-1 transition-colors',
                    i < current ? 'bg-orange-500' : 'bg-neutral-200'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile: current step label + progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-900">{steps[current]}</span>
          <span className="text-xs text-neutral-500">
            {current + 1}/{steps.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
