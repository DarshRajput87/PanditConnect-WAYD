'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  const { t } = useTranslation()
  // When the visitor was sent here from a pandit profile ("Book Now" while
  // logged out), explain why they're being asked to sign in.
  const [fromBooking, setFromBooking] = useState(false)
  useEffect(() => {
    const cb = new URLSearchParams(window.location.search).get('callbackUrl') || ''
    setFromBooking(cb.includes('/pandit/'))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">
        {fromBooking ? t('auth.loginToBookTitle') : t('auth.loginTitle')}
      </h1>
      <p className="mt-1.5 text-sm text-neutral-500">
        {fromBooking ? t('auth.loginToBookSubtitle') : t('auth.loginSubtitle')}
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-neutral-500">
        {t('auth.noAccount')}{' '}
        <Link href="/register" className="font-medium text-orange-600 hover:underline">
          {t('auth.registerHere')}
        </Link>
      </p>
    </div>
  )
}
