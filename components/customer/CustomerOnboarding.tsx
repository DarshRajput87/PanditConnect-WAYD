'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { completeCustomerOnboarding } from '@/actions/customer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin } from 'lucide-react'
import { INDIAN_STATES } from '@/types'

export function CustomerOnboarding({ name }: { name: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState('')

  function done() {
    router.push('/dashboard/customer')
    router.refresh()
  }

  function fail(code: string) {
    setError(t(`customerOnboarding.errors.${code}`, { defaultValue: t('errors.generic') }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await completeCustomerOnboarding({
      line1: String(fd.get('line1') || '').trim(),
      city: String(fd.get('city') || '').trim(),
      state: String(fd.get('state') || ''),
      pincode: String(fd.get('pincode') || '').trim(),
    })
    if ('error' in res) {
      fail(res.error)
      setLoading(false)
      return
    }
    done()
  }

  async function onSkip() {
    setSkipping(true)
    setError('')
    const res = await completeCustomerOnboarding()
    if ('error' in res) {
      fail(res.error)
      setSkipping(false)
      return
    }
    done()
  }

  const busy = loading || skipping

  return (
    <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-500">
        <MapPin className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">{t('customerOnboarding.title')}</h1>
      {name && <p className="mt-1 text-sm font-medium text-neutral-700">{t('customerOnboarding.greeting', { name })}</p>}
      <p className="mt-1 text-sm text-neutral-500">{t('customerOnboarding.subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="line1">{t('customerOnboarding.line1')}</Label>
          <Input id="line1" name="line1" placeholder={t('customerOnboarding.line1Placeholder')} autoComplete="address-line1" required />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">{t('customerOnboarding.city')}</Label>
            <Input id="city" name="city" placeholder={t('customerOnboarding.cityPlaceholder')} autoComplete="address-level2" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pincode">{t('customerOnboarding.pincode')}</Label>
            <Input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              placeholder={t('customerOnboarding.pincodePlaceholder')}
              autoComplete="postal-code"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state">{t('customerOnboarding.state')}</Label>
          <select
            id="state"
            name="state"
            defaultValue=""
            required
            className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 transition-colors focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20"
          >
            <option value="" disabled>
              {t('customerOnboarding.selectState')}
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('customerOnboarding.saving')}
            </>
          ) : (
            t('customerOnboarding.submit')
          )}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
        >
          {skipping ? t('customerOnboarding.saving') : t('customerOnboarding.skip')}
        </button>
      </div>
    </div>
  )
}
