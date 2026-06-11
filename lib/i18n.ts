'use client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import gu from '@/locales/gu.json'

// Single shared i18next instance. Missing keys fall back to English (never the raw key).
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      gu: { translation: gu },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'gu'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

export default i18n
