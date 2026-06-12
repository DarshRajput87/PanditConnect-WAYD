export default function Loading() {
  return (
    <div className="w-full space-y-5 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-white" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 px-4 py-3">
              <div className="h-3.5 w-32 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-48 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
