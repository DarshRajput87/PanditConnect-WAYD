'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { addPanditReply } from '@/actions/review'

export function ReplyForm({ reviewId, onDone }: { reviewId: string; onDone: () => void }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function submitReply() {
    if (replyText.trim().length < 5) {
      setError(t('panditDash.reviews.replyTooShort'))
      return
    }
    startTransition(async () => {
      const result = await addPanditReply(reviewId, replyText)
      if ('error' in result) {
        setError(t(`panditDash.errors.${result.error.code}`))
        return
      }
      setReplyText('')
      onDone()
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <textarea
        value={replyText}
        onChange={(e) => {
          setReplyText(e.target.value)
          setError('')
        }}
        placeholder={t('panditDash.reviews.replyPlaceholder')}
        rows={3}
        maxLength={500}
        className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-neutral-400">{replyText.length}/500</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setReplyText('')
              setError('')
              onDone()
            }}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            {t('panditDash.reviews.cancel')}
          </button>
          <button
            onClick={submitReply}
            disabled={isPending || replyText.trim().length < 5}
            className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isPending ? t('panditDash.reviews.posting') : t('panditDash.reviews.postReply')}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
