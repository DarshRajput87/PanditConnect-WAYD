'use client'
import { ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'

export const LANG_STORAGE_KEY = 'pc_lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
