'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Star, ChevronDown, Loader2 } from 'lucide-react'
import { createReview } from '@/actions/review'
import { cn } from '@/lib/utils'

const DIMENSIONS = ['ritualKnowledge', 'punctuality', 'behaviour', 'communication'] as const
type Dimension = (typeof DIMENSIONS)[number]

export function WriteReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [overall, setOverall] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [dims, setDims] = useState<Partial<Record<Dimension, number>>>({})
  const [showDims, setShowDims] = useState(false)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  function submit() {
    if (overall < 1) return
    setError('')
    startTransition(async () => {
      const result = await createReview(bookingId, {
        overall,
        ...dims,
        comment: comment.trim() || undefined,
      })
      if ('error' in result) {
        setError(t(`panditDash.errors.${result.error.code}`))
        return
      }
      router.push(`/dashboard/customer/bookings/${bookingId}`)
      router.refresh()
    })
  }

  const shown = hovered || overall

  return (
    <div className="space-y-5">
      {/* Overall star picker */}
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-900">{t('customerDash.review.howWas')}</p>
        <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOverall(n)}
              onMouseEnter={() => setHovered(n)}
              aria-label={t(`customerDash.review.ratings.${n}`)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  n <= shown ? 'fill-orange-400 text-orange-400' : 'fill-neutral-100 text-neutral-300'
                )}
              />
            </button>
          ))}
          {shown > 0 && (
            <span className="ml-2 text-sm text-neutral-600">{t(`customerDash.review.ratings.${shown}`)}</span>
          )}
        </div>
      </div>

      {/* Optional dimensions */}
      <div>
        <button
          type="button"
          onClick={() => setShowDims((v) => !v)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showDims && 'rotate-180')} />
          {t('customerDash.review.rateAspects')}
        </button>
        {showDims && (
          <div className="mt-3 space-y-2.5">
            {DIMENSIONS.map((dim) => (
              <div key={dim} className="flex items-center justify-between gap-3">
                <span className="text-xs text-neutral-600">{t(`customerDash.review.${dim}`)}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDims((d) => ({ ...d, [dim]: d[dim] === n ? undefined : n }))}
                      aria-label={`${t(`customerDash.review.${dim}`)} ${n}`}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-4 w-4 transition-colors',
                          n <= (dims[dim] ?? 0) ? 'fill-orange-400 text-orange-400' : 'fill-neutral-100 text-neutral-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="mb-1 block text-xs font-medium text-neutral-700">
          {t('customerDash.review.comment')}
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t('customerDash.review.commentPlaceholder')}
          className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-right text-[10px] text-neutral-400">{comment.length}/1000</p>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || overall < 1}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? t('customerDash.review.submitting') : t('customerDash.review.submit')}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
