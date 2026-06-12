export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
        ))}
      </div>
      {/* Pandit mini-header */}
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-neutral-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
      {/* Step body */}
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
