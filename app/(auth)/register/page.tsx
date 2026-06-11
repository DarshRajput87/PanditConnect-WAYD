'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">{t('auth.registerTitle')}</h1>
      <p className="mt-1.5 text-sm text-neutral-500">{t('auth.registerSubtitle')}</p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        {t('auth.agreeTermsPrefix')}{' '}
        <Link href="/terms" className="text-orange-600 hover:underline">
          {t('auth.terms')}
        </Link>{' '}
        {t('auth.and')}{' '}
        <Link href="/privacy" className="text-orange-600 hover:underline">
          {t('auth.privacy')}
        </Link>
        .
      </p>
      <p className="mt-6 text-sm text-neutral-500">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="font-medium text-orange-600 hover:underline">
          {t('auth.loginHere')}
        </Link>
      </p>
    </div>
  )
}
