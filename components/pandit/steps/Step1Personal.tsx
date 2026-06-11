'use client'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ImageUpload } from '../ImageUpload'
import { uploadProfilePhoto } from '@/actions/pandit'
import { INDIAN_STATES, type Gender } from '@/types'
import type { WizardState } from '../types'

interface Props {
  state: WizardState
  set: (patch: Partial<WizardState>) => void
  errors: Record<string, string>
  email: string
  phone: string
}

const GENDERS: Gender[] = ['male', 'female', 'other', 'prefer_not_to_say']

export function Step1Personal({ state, set, errors, email, phone }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t('pandit.photo')}</Label>
        <ImageUpload
          value={state.profilePhoto}
          fieldName="photo"
          action={uploadProfilePhoto}
          onUploaded={(url) => set({ profilePhoto: url })}
          shape="circle"
          label={t('pandit.uploadPhoto')}
        />
        {errors.profilePhoto && <p className="text-sm text-red-600">{errors.profilePhoto}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t('pandit.fullName')}</Label>
        <Input id="name" value={state.name} onChange={(e) => set({ name: e.target.value })} />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="age">{t('pandit.age')}</Label>
          <Input
            id="age"
            type="number"
            min={18}
            max={100}
            inputMode="numeric"
            value={state.age}
            onChange={(e) => set({ age: e.target.value })}
          />
          {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">{t('pandit.genderLabel')}</Label>
          <Select
            id="gender"
            value={state.gender}
            onChange={(e) => set({ gender: e.target.value as Gender })}
          >
            <option value="">{t('pandit.select')}</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {t(`pandit.gender.${g}`)}
              </option>
            ))}
          </Select>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mobile">{t('pandit.mobile')}</Label>
          <Input id="mobile" value={phone} readOnly disabled className="bg-neutral-50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('pandit.email')}</Label>
          <Input id="email" value={email} readOnly disabled className="bg-neutral-50" />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-700">{t('pandit.address')}</legend>
        <div className="space-y-1.5">
          <Label htmlFor="line1">{t('pandit.addressLine1')}</Label>
          <Input
            id="line1"
            value={state.address.line1}
            onChange={(e) => set({ address: { ...state.address, line1: e.target.value } })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="city">{t('pandit.city')}</Label>
            <Input
              id="city"
              value={state.address.city}
              onChange={(e) => set({ address: { ...state.address, city: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">{t('pandit.state')}</Label>
            <Select
              id="state"
              value={state.address.state}
              onChange={(e) => set({ address: { ...state.address, state: e.target.value } })}
            >
              <option value="">{t('pandit.select')}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pincode">{t('pandit.pincode')}</Label>
            <Input
              id="pincode"
              inputMode="numeric"
              maxLength={6}
              value={state.address.pincode}
              onChange={(e) => set({ address: { ...state.address, pincode: e.target.value } })}
            />
          </div>
        </div>
        {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
      </fieldset>
    </div>
  )
}
