export default function Loading() {
  return (
    <div className="w-full p-4 md:p-6">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
        </div>
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
