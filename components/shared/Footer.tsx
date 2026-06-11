'use client'
import Link from 'next/link'
import { Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500">
                <Flame className="h-4 w-4 text-white" />
              </span>
              <span>PanditConnect</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-neutral-500">{t('footer.tagline')}</p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{t('footer.product')}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-neutral-500 hover:text-neutral-900">
                  {t('footer.findPandit')}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-neutral-500 hover:text-neutral-900">
                  {t('footer.becomePandit')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{t('footer.company')}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-neutral-500 hover:text-neutral-900">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-500 hover:text-neutral-900">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{t('footer.legal')}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-neutral-500 hover:text-neutral-900">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-neutral-500 hover:text-neutral-900">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-500">
            © {year} PanditConnect. {t('footer.rights')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
