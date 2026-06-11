'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '../ImageUpload'
import { uploadIdDocument } from '@/actions/pandit'
import type { WizardState } from '../types'

interface Props {
  state: WizardState
  set: (patch: Partial<WizardState>) => void
  errors: Record<string, string>
}

export function Step4Verification({ state, set, errors }: Props) {
  const { t } = useTranslation()
  const [reveal, setReveal] = useState(false)

  // Full Aadhaar lives only in client state for entry; we transmit nothing but the
  // last 4 digits. Update last4 only once all 12 are present (or keep a prior value
  // untouched when the field is left blank on a resubmit).
  const digits = state.aadhaarFull
  const grouped = digits.replace(/(.{4})(?=.)/g, '$1 ')
  const partial = digits.length > 0 && digits.length < 12

  function onAadhaarChange(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, 12)
    set({
      aadhaarFull: d,
      aadhaarLast4: d.length === 12 ? d.slice(-4) : d.length === 0 ? state.aadhaarLast4 : '',
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-md bg-orange-50 p-3 text-sm text-orange-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('pandit.verificationIntro')}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aadhaar">{t('pandit.aadhaarNumber')}</Label>
        <div className="relative">
          <Input
            id="aadhaar"
            type={reveal ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="off"
            maxLength={reveal ? 14 : 12}
            value={reveal ? grouped : digits}
            onChange={(e) => onAadhaarChange(e.target.value)}
            onBlur={() => setReveal(false)}
            placeholder={t('pandit.aadhaarPlaceholder')}
            className={`pr-10 ${partial ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''}`}
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? t('pandit.hideAadhaar') : t('pandit.showAadhaar')}
            aria-pressed={reveal}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 transition-colors hover:text-neutral-600"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="flex items-center gap-1 text-xs text-neutral-400">
          <Lock className="h-3 w-3" />
          {t('pandit.aadhaarNote')}
        </p>
        {partial && <p className="text-sm text-red-600">{t('pandit.aadhaarInvalid')}</p>}
        {errors.aadhaarLast4 && <p className="text-sm text-red-600">{errors.aadhaarLast4}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t('pandit.idDocument')}</Label>
        <ImageUpload
          value={state.idDocumentUrl}
          fieldName="document"
          action={uploadIdDocument}
          onUploaded={(url) => set({ idDocumentUrl: url })}
          shape="rect"
          label={t('pandit.uploadDocument')}
        />
        <p className="text-xs text-neutral-400">{t('pandit.idDocumentNote')}</p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 p-3">
        <input
          type="checkbox"
          checked={state.declarationAccepted}
          onChange={(e) => set({ declarationAccepted: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-orange-500 accent-orange-500"
        />
        <span className="text-sm text-neutral-600">{t('pandit.declaration')}</span>
      </label>
      {errors.declarationAccepted && (
        <p className="text-sm text-red-600">{errors.declarationAccepted}</p>
      )}
    </div>
  )
}
