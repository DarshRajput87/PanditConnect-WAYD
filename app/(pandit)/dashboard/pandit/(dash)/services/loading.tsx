export default function Loading() {
  return (
    <div className="max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-neutral-100" />
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 animate-pulse rounded bg-neutral-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
              </div>
              <div className="h-5 w-9 animate-pulse rounded-full bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
