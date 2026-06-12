'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Menu, X, Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const dashboardHref = session ? `/dashboard/${session.user.role}` : '/login'

  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-neutral-200 bg-white">
      <div className="flex h-full w-full items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500">
            <Flame className="h-4 w-4 text-white" />
          </span>
          <span>PanditConnect</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/search" className="text-sm text-neutral-600 transition-colors hover:text-neutral-900">
            {t('nav.findPandit')}
          </Link>
          <LanguageSwitcher />
          {session ? (
            <>
              <Link href={dashboardHref}>
                <Button variant="ghost" size="sm">
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                {t('nav.signOut')}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t('nav.register')}</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="p-2 text-neutral-700 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="space-y-3 border-t border-neutral-200 bg-white px-4 py-3 md:hidden">
          <Link
            href="/search"
            className="block py-2 text-sm text-neutral-600"
            onClick={() => setOpen(false)}
          >
            {t('nav.findPandit')}
          </Link>
          <LanguageSwitcher />
          {session ? (
            <div className="flex flex-col gap-2">
              <Link href={dashboardHref} onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => signOut({ callbackUrl: '/' })}>
                {t('nav.signOut')}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
