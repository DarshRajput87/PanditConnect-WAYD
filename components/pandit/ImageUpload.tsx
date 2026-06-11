'use client'
import { useRef, useState } from 'react'
import { Loader2, Upload, ImageIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type UploadResult = { success: true; url: string } | { error: string }

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

const ERROR_KEYS = new Set([
  'unauthorized',
  'not_configured',
  'no_file',
  'upload_failed',
  'type',
  'size',
])

interface Props {
  value: string
  fieldName: 'photo' | 'document'
  action: (fd: FormData) => Promise<UploadResult>
  onUploaded: (url: string) => void
  shape?: 'circle' | 'rect'
  label: string
}

export function ImageUpload({ value, fieldName, action, onUploaded, shape = 'circle', label }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function showError(code: string) {
    setError(ERROR_KEYS.has(code) ? t(`pandit.uploadErrors.${code}`) : code)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setError('')

    if (!ALLOWED.includes(file.type)) return showError('type')
    if (file.size > MAX_MB * 1024 * 1024) return showError('size')

    const fd = new FormData()
    fd.set(fieldName, file)
    setUploading(true)
    const res = await action(fd)
    setUploading(false)
    if ('error' in res) {
      showError(res.error)
      return
    }
    onUploaded(res.url)
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50',
            shape === 'circle' ? 'h-20 w-20 rounded-full' : 'h-24 w-32 rounded-md'
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-neutral-300" />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('pandit.uploading')}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {value ? t('pandit.replaceImage') : label}
              </>
            )}
          </button>
          <p className="mt-1.5 text-xs text-neutral-400">{t('pandit.imageHint')}</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
