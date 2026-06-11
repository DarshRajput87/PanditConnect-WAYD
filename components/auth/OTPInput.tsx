'use client'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface OTPInputHandle {
  focus: () => void
}

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  /** Fired once the input becomes fully filled — used to auto-submit. */
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  error?: boolean
}

export const OTPInput = forwardRef<OTPInputHandle, OTPInputProps>(function OTPInput(
  { value, onChange, onComplete, length = 6, disabled, error },
  ref
) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useImperativeHandle(ref, () => ({ focus: () => refs.current[0]?.focus() }), [])

  function setChar(index: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    arr[index] = digit
    const next = arr.join('').slice(0, length)
    onChange(next)
    if (digit && index < length - 1) refs.current[index + 1]?.focus()
    // Fire only on the keystroke that completes the code (not on later edits).
    if (next.length === length && value.length < length) onComplete?.(next)
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus()
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    onChange(text)
    refs.current[Math.min(text.length, length - 1)]?.focus()
    if (text.length === length) onComplete?.(text)
  }

  return (
    <div className="flex justify-between gap-2" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ''}
          onChange={(e) => setChar(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={error || undefined}
          className={cn(
            'h-12 w-full rounded-md border text-center text-lg font-semibold text-neutral-900 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2',
            error
              ? 'border-red-400 bg-red-50 focus-visible:border-red-500 focus-visible:ring-red-500/20'
              : 'border-neutral-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      ))}
    </div>
  )
})
