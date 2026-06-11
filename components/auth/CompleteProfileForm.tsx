'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { completeGoogleProfile } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Loader2, User2, BookOpen } from 'lucide-react'

type RegisterRole = 'customer' | 'pandit'

interface Props {
  email: string
  name: string
  presetRole?: RegisterRole
}

export function CompleteProfileForm({ email, name, presetRole }: Props) {
  const router = useRouter()
  const { update } = useSession()
  const { t } = useTranslation()
  const [role, setRole] = useState<RegisterRole>(presetRole ?? 'customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const digits = String(fd.get('phone') || '').replace(/\D/g, '')
    const phone = `+91${digits.slice(-10)}`

    const res = await completeGoogleProfile({ phone, role })
    if ('error' in res) {
      setError(t(`auth.complete.errors.${res.error}`, { defaultValue: t('errors.generic') }))
      setLoading(false)
      return
    }

    // Refresh the JWT so role/id are baked into the cookie before the dashboard's
    // middleware role-guard runs — otherwise a new Pandit would bounce to /login.
    await update()
    // New customers land on onboarding (it self-resolves once completed).
    router.push(res.role === 'customer' ? '/dashboard/customer/onboarding' : `/dashboard/${res.role}`)
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">{t('auth.complete.title')}</h1>
      <p className="mt-1.5 text-sm text-neutral-500">{t('auth.complete.subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {!presetRole && (
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
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('auth.name')}</Label>
            <Input id="name" value={name} readOnly disabled className="bg-neutral-50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" value={email} readOnly disabled className="bg-neutral-50" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('auth.phone')}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder={t('auth.phonePlaceholder')}
            autoComplete="tel"
            required
          />
          <p className="text-xs text-neutral-400">{t('auth.complete.phonePrompt')}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.complete.submitting')}
            </>
          ) : (
            t('auth.complete.submit')
          )}
        </Button>
      </form>
    </div>
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
