'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, ArrowRight } from 'lucide-react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Button } from '@/components/ui/button'

interface Props {
  name: string
  titleKey: string
  cta?: { href: string; labelKey: string }
}

export function DashboardStub({ name, titleKey, cta }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-500">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-neutral-500">{t(titleKey)}</p>
              <h1 className="text-xl font-bold text-neutral-900">
                {t('dashboard.welcome')}
                {name ? `, ${name}` : ''}
              </h1>
            </div>
          </div>
          {cta && (
            <Link href={cta.href}>
              <Button size="sm">
                {t(cta.labelKey)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-sm font-medium text-neutral-700">{t('dashboard.comingSoon')}</p>
          <p className="mt-1 text-sm text-neutral-500">{t('dashboard.stubNote')}</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
