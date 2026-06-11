'use client'
import { useEffect, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { GoogleAuth } from '@/components/auth/GoogleAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')

  // Read where to return to after login. Only honour internal paths so a crafted
  // ?callbackUrl=//evil.com can't turn login into an open redirect.
  useEffect(() => {
    const cb = new URLSearchParams(window.location.search).get('callbackUrl') || ''
    if (cb.startsWith('/') && !cb.startsWith('//')) setCallbackUrl(cb)
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      email: String(fd.get('email') || ''),
      password: String(fd.get('password') || ''),
      redirect: false,
    })
    if (res?.error) {
      setError(t('auth.invalidCredentials'))
      setLoading(false)
      return
    }
    // Return to where they were headed, else the dashboard for their role.
    // First-time customers route through onboarding (it self-resolves for returners).
    const session = await getSession()
    const role = session?.user?.role ?? 'customer'
    const home = role === 'customer' ? '/dashboard/customer/onboarding' : `/dashboard/${role}`
    router.push(callbackUrl || home)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input id="email" name="email" type="email" placeholder={t('auth.emailPlaceholder')} autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
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
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('auth.signingIn')}
          </>
        ) : (
          t('auth.signIn')
        )}
      </Button>

      {/* No role here — a brand-new Google user picks one on /complete-profile. */}
      <GoogleAuth />
    </form>
  )
}
