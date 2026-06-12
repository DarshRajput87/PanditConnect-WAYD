export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      {/* Profile header */}
      <div className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-full bg-neutral-100" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-44 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-64 animate-pulse rounded bg-neutral-100" />
          <div className="flex gap-2 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="h-4 w-28 animate-pulse rounded bg-neutral-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
