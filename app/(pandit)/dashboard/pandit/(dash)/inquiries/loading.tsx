export default function Loading() {
  return (
    <div className="max-w-3xl p-4 md:p-6">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex gap-4 border-b border-neutral-200 px-4 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded bg-neutral-100" />
                <div className="h-3 w-48 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
