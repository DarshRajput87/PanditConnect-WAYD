'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { registerUser } from '@/actions/auth'
import { GoogleAuth } from '@/components/auth/GoogleAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Loader2, User2, BookOpen, Eye, EyeOff } from 'lucide-react'
import type { Language } from '@/types'

type RegisterRole = 'customer' | 'pandit'

type FieldKey = 'name' | 'email' | 'phone' | 'password'
type FieldErrors = Partial<Record<FieldKey | '_form', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+91[6-9]\d{9}$/

export function RegisterForm() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [role, setRole] = useState<RegisterRole>('customer')
  const [language, setLanguage] = useState<Language>(
    ((i18n.language?.split('-')[0] as Language) || 'en')
  )
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const password = String(fd.get('password') || '')
    const digits = String(fd.get('phone') || '').replace(/\D/g, '')
    const phone = digits.length >= 10 ? `+91${digits.slice(-10)}` : `+91${digits}`

    // Client-side validation — inline, translated, and preserves typed values.
    const next: FieldErrors = {}
    if (name.length < 2 || name.length > 60) next.name = t('auth.errors.name')
    if (!EMAIL_RE.test(email)) next.email = t('auth.errors.email')
    if (!PHONE_RE.test(phone)) next.phone = t('auth.errors.phone')
    if (password.length < 8) next.password = t('auth.errors.password')
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    setLoading(true)
    const res = await registerUser({ name, email, phone, password, role, preferredLanguage: language })

    if ('error' in res) {
      const fe = res.error
      const formCode = fe._form?.[0]
      if (formCode === 'duplicate') {
        setErrors({ _form: t('auth.errors.duplicate') })
      } else if (formCode) {
        setErrors({ _form: t('errors.generic') })
      } else {
        // Map any server field errors to their translated message (ignore raw text).
        const mapped: FieldErrors = {}
        for (const key of ['name', 'email', 'phone', 'password'] as FieldKey[]) {
          if (fe[key]) mapped[key] = t(`auth.errors.${key}`)
        }
        setErrors(Object.keys(mapped).length ? mapped : { _form: t('errors.generic') })
      }
      setLoading(false)
      return
    }

    router.push(`/verify?email=${encodeURIComponent(res.email)}`)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Role selector */}
      <div className="space-y-1.5">
        <Label>{t('auth.role')}</Label>
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            active={role === 'customer'}
            onClick={() => setRole('customer')}
            icon={<User2 className="h-4 w-4" />}
            label={t('auth.customer')}
          />
          <RoleCard
            active={role === 'pandit'}
            onClick={() => setRole('pandit')}
            icon={<BookOpen className="h-4 w-4" />}
            label={t('auth.pandit')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t('auth.name')}</Label>
        <Input id="name" name="name" placeholder={t('auth.namePlaceholder')} autoComplete="name" required />
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" name="email" type="email" placeholder={t('auth.emailPlaceholder')} autoComplete="email" required />
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('auth.phone')}</Label>
          <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder={t('auth.phonePlaceholder')} autoComplete="tel" required />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="preferredLanguage">{t('auth.preferredLanguage')}</Label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 transition-colors focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20"
        >
          <option value="en">{t('common.english')}</option>
          <option value="hi">{t('common.hindi')}</option>
          <option value="gu">{t('common.gujarati')}</option>
        </select>
      </div>

      {errors._form && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-700">{errors._form}</p>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('auth.creating')}
          </>
        ) : (
          t('auth.createAccount')
        )}
      </Button>

      {/* Carries the selected role through Google OAuth to /complete-profile. */}
      <GoogleAuth role={role} />
    </form>
  )
}

function RoleCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-orange-500 bg-orange-50 text-orange-700'
          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
      )}
    >
      <span className={cn(active ? 'text-orange-500' : 'text-neutral-400')}>{icon}</span>
      {label}
    </button>
  )
}
