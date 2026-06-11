'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

// Inlined at build time. Set to "true" only once AUTH_GOOGLE_ID/SECRET are configured.
const ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'

/**
 * "Continue with Google" block (divider + button). Renders nothing unless Google
 * OAuth is enabled. After sign-in, NextAuth redirects to /complete-profile, carrying
 * the chosen role so the completion step only needs to collect a mobile number.
 */
export function GoogleAuth({ role }: { role?: 'customer' | 'pandit' }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  if (!ENABLED) return null

  const callbackUrl = role ? `/complete-profile?role=${role}` : '/complete-profile'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs uppercase tracking-wide text-neutral-400">{t('auth.or')}</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setLoading(true)
          signIn('google', { callbackUrl })
        }}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {t('auth.continueWithGoogle')}
      </button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}
