'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { verifyOTP, resendOTP } from '@/actions/auth'
import { OTPInput, type OTPInputHandle } from './OTPInput'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const RESEND_COOLDOWN = 60

export function VerifyForm({ email }: { email: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [locked, setLocked] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const otpRef = useRef<OTPInputHandle>(null)

  // Resend cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function submitOtp(code: string) {
    if (loading || locked || code.length !== 6) return
    setLoading(true)
    setError('')
    setInfo('')
    const res = await verifyOTP({ email, otp: code })
    if ('error' in res) {
      const { code: errCode, remaining } = res.error
      setError(t(`auth.errors.${errCode}`, { remaining, defaultValue: t('errors.generic') }))
      if (errCode === 'max_attempts') setLocked(true)
      // Clear the boxes and return focus to the first one so the user can retry.
      setOtp('')
      setLoading(false)
      otpRef.current?.focus()
      return
    }
    // Account is now active — send the user to sign in (verify creates no session).
    router.push('/login')
  }

  async function onResend() {
    if (cooldown > 0 || resending) return
    setResending(true)
    setError('')
    setInfo('')
    const res = await resendOTP(email)
    setResending(false)
    if ('error' in res) {
      setError(t('errors.generic'))
      return
    }
    // Fresh OTP — server reset the attempt counter, so unlock and start the cooldown.
    setLocked(false)
    setOtp('')
    setInfo(t('auth.resent'))
    setCooldown(RESEND_COOLDOWN)
    otpRef.current?.focus()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">{t('auth.verifyTitle')}</h1>
      <p className="mt-1.5 text-sm text-neutral-500">{t('auth.verifySubtitle')}</p>
      {email && <p className="mt-1 text-sm font-medium text-neutral-700">{email}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submitOtp(otp)
        }}
        className="mt-6 space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">{t('auth.otpLabel')}</label>
          <OTPInput
            ref={otpRef}
            value={otp}
            onChange={setOtp}
            onComplete={(code) => void submitOtp(code)}
            disabled={loading || locked}
            error={!!error}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}

        <Button type="submit" disabled={loading || locked || otp.length !== 6} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.verifying')}
            </>
          ) : (
            t('auth.verifyOtp')
          )}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-neutral-500">
        {cooldown > 0 ? (
          <span className="text-neutral-400">{t('auth.resendIn', { n: cooldown })}</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending || !email}
            className="font-medium text-orange-600 hover:underline disabled:opacity-50"
          >
            {resending ? t('auth.resending') : t('auth.resendOtp')}
          </button>
        )}
      </div>
    </div>
  )
}
