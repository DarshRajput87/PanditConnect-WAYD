'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Loader2, Check, ArrowLeft, ArrowRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { StepIndicator } from '@/components/shared/StepIndicator'
import { Button } from '@/components/ui/button'
import { Step1Personal } from './steps/Step1Personal'
import { Step2Religious } from './steps/Step2Religious'
import { Step3Services } from './steps/Step3Services'
import { Step4Verification } from './steps/Step4Verification'
import {
  savePanditDraft,
  savePoojaServices,
  submitForVerification,
  type PanditOnboardingData,
} from '@/actions/pandit'
import {
  stateFromData,
  profileDraftPayload,
  servicesPayload,
  isServiceComplete,
  type WizardState,
} from './types'
import type { VerificationStatus } from '@/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const MISSING_STEP: Record<string, number> = {
  profilePhoto: 0,
  age: 0,
  gender: 0,
  address: 0,
  sampraday: 1,
  specialization: 1,
  languages: 1,
  services: 2,
  verification: 3,
}

function isReadyToSubmit(s: WizardState): boolean {
  const ageNum = parseInt(s.age, 10)
  const a = s.address
  return Boolean(
    s.name.trim().length >= 2 &&
      !Number.isNaN(ageNum) &&
      ageNum >= 18 &&
      s.gender &&
      s.profilePhoto &&
      a.line1 &&
      a.city &&
      a.state &&
      /^\d{6}$/.test(a.pincode) &&
      s.sampraday.trim() &&
      s.specialization.length > 0 &&
      s.languages.length > 0 &&
      s.services.some(isServiceComplete) &&
      // Either a freshly-entered 12-digit number, or a previously stored last-4 (resubmit).
      (s.aadhaarFull.length === 12 || (s.aadhaarFull.length === 0 && s.aadhaarLast4.length === 4)) &&
      s.declarationAccepted
  )
}

export function RegistrationWizard({ data }: { data: PanditOnboardingData }) {
  const { t } = useTranslation()
  const router = useRouter()

  const [state, setState] = useState<WizardState>(() => stateFromData(data))
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [missing, setMissing] = useState<string[]>([])
  const [status, setStatus] = useState<VerificationStatus>(data.profile.verificationStatus)

  const steps = [t('pandit.step1'), t('pandit.step2'), t('pandit.step3'), t('pandit.step4')]

  function set(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  // Debounced draft autosave for profile fields (Steps 1 & 2).
  const profileKey = JSON.stringify(profileDraftPayload(state))
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    setSaveStatus('saving')
    const id = setTimeout(async () => {
      const res = await savePanditDraft(profileDraftPayload(state))
      setSaveStatus('success' in res ? 'saved' : 'error')
    }, 1500)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey])

  async function saveDraftNow() {
    setSaveStatus('saving')
    const res = await savePanditDraft(profileDraftPayload(state))
    setSaveStatus('success' in res ? 'saved' : 'error')
  }

  async function persistServices() {
    const complete = state.services.filter(isServiceComplete)
    if (!complete.length) return
    setSaveStatus('saving')
    const res = await savePoojaServices(servicesPayload({ ...state, services: complete }))
    setSaveStatus('success' in res ? 'saved' : 'error')
  }

  // Persist the current step on every transition (forward or back) — draft save is
  // non-critical, so navigation is never blocked even if it fails.
  async function persistCurrentStep() {
    if (step === 2) await persistServices()
    else await saveDraftNow()
  }

  async function handleNext() {
    await persistCurrentStep()
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  async function handleBack() {
    await persistCurrentStep()
    setStep((s) => Math.max(s - 1, 0))
  }

  function applyMissing(keys: string[]) {
    const next: Record<string, string> = {}
    for (const key of keys) {
      if (key === 'verification') {
        next.aadhaarLast4 = t('pandit.required')
        next.declarationAccepted = t('pandit.required')
      } else {
        next[key] = t('pandit.required')
      }
    }
    setErrors(next)
    setMissing(keys)
    const target = Math.min(...keys.map((k) => MISSING_STEP[k] ?? 3))
    if (Number.isFinite(target)) setStep(target)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    setMissing([])
    setErrors({})

    await savePanditDraft(profileDraftPayload(state))
    await persistServices()

    const res = await submitForVerification({
      aadhaarLast4: state.aadhaarLast4,
      declarationAccepted: state.declarationAccepted,
    })
    setSubmitting(false)

    if ('success' in res) {
      setStatus('pending')
      router.refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (res.missing) {
      applyMissing(res.missing)
    } else {
      setSubmitError(t(`pandit.errors.${res.error}`, { defaultValue: t('errors.generic') }))
    }
  }

  const ready = isReadyToSubmit(state)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('pandit.onboardingTitle')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('pandit.onboardingSubtitle')}</p>
      </div>

      {/* Status banner */}
      {status === 'pending' && data.profile.verificationStatus !== 'rejected' && (
        <Banner tone="blue" icon={<Clock className="h-4 w-4" />} text={t('pandit.statusPending')} />
      )}
      {status === 'rejected' && (
        <Banner
          tone="red"
          icon={<AlertCircle className="h-4 w-4" />}
          text={`${t('pandit.statusRejected')} ${data.profile.rejectionReason ?? ''}`}
        />
      )}
      {status === 'verified' && (
        <Banner tone="green" icon={<CheckCircle2 className="h-4 w-4" />} text={t('pandit.statusVerified')} />
      )}

      <div className="rounded-lg border border-neutral-200 bg-white">
        {/* Header: step indicator + save status */}
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 p-5">
          <div className="min-w-0 flex-1">
            <StepIndicator steps={steps} current={step} />
          </div>
          <SaveIndicator status={saveStatus} labels={{ saving: t('pandit.saving'), saved: t('pandit.saved') }} />
        </div>

        {/* Step body */}
        <div className="p-5">
          {step === 0 && (
            <Step1Personal state={state} set={set} errors={errors} email={data.email} phone={data.phone} />
          )}
          {step === 1 && <Step2Religious state={state} set={set} errors={errors} />}
          {step === 2 && <Step3Services state={state} set={set} errors={errors} />}
          {step === 3 && <Step4Verification state={state} set={set} errors={errors} />}
        </div>

        {/* Footer: navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 p-5">
          <Button variant="outline" onClick={handleBack} disabled={step === 0 || submitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('pandit.back')}
          </Button>

          {step < steps.length - 1 ? (
            <Button onClick={handleNext}>
              {t('pandit.next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!ready || submitting}
              title={!ready ? t('pandit.completeAllTooltip') : undefined}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('pandit.submitting')}
                </>
              ) : (
                t('pandit.submit')
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Submit-time feedback */}
      {missing.length > 0 && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">{t('pandit.completeBeforeSubmit')}</p>
          <ul className="mt-1 list-inside list-disc">
            {missing.map((m) => (
              <li key={m}>{t(`pandit.fields.${m}`, { defaultValue: m })}</li>
            ))}
          </ul>
        </div>
      )}
      {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}
    </div>
  )
}

function SaveIndicator({
  status,
  labels,
}: {
  status: SaveStatus
  labels: { saving: string; saved: string }
}) {
  if (status === 'saving')
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {labels.saving}
      </span>
    )
  if (status === 'saved')
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-green-600">
        <Check className="h-3.5 w-3.5" />
        {labels.saved}
      </span>
    )
  return null
}

function Banner({
  tone,
  icon,
  text,
}: {
  tone: 'blue' | 'red' | 'green'
  icon: React.ReactNode
  text: string
}) {
  const toneClass =
    tone === 'blue'
      ? 'border-blue-200 bg-blue-50 text-blue-800'
      : tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-green-200 bg-green-50 text-green-800'
  return (
    <div className={`mb-4 flex items-start gap-2 rounded-md border p-3 text-sm ${toneClass}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p>{text}</p>
    </div>
  )
}
