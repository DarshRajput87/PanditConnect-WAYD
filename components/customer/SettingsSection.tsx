'use client'
import { useTranslation } from 'react-i18next'
import { ProfileForm } from './ProfileForm'
import { AddressForm } from './AddressForm'
import { AccountInfo } from './AccountInfo'
import { PasswordForm } from './PasswordForm'
import type { CustomerSettingsDTO } from '@/types/dashboard'

export function SettingsSection({ settings }: { settings: CustomerSettingsDTO }) {
  const { t } = useTranslation()
  const initials = settings.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-full p-4 pb-24 md:p-6 md:pb-6">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        {/* Left column: Profile + Address */}
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-medium text-neutral-900">{t('customerDash.settings.profile')}</h2>
            </div>
            <div className="p-4">
              <div className="mb-4 flex items-center gap-3 border-b border-neutral-100 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{settings.name}</p>
                  <p className="truncate text-xs text-neutral-500">{settings.email}</p>
                </div>
              </div>
              <ProfileForm
                initialName={settings.name}
                initialLanguage={settings.preferredLanguage}
                email={settings.email}
                phone={settings.phone}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-medium text-neutral-900">{t('customerDash.settings.addressTitle')}</h2>
              <span className="text-xs text-neutral-400">{t('customerDash.settings.addressHint')}</span>
            </div>
            <div className="p-4">
              <AddressForm initialAddress={settings.address} />
            </div>
          </div>
        </div>

        {/* Right column: Account details + Security */}
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-medium text-neutral-900">Account details</h2>
            </div>
            <div className="p-4">
              <AccountInfo
                name={settings.name}
                email={settings.email}
                phone={settings.phone}
                memberSince={settings.memberSince}
                status={settings.status}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-medium text-neutral-900">{t('customerDash.settings.security')}</h2>
            </div>
            <div className="p-4">
              <PasswordForm hasPassword={settings.hasPassword} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
