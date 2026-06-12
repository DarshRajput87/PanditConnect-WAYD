export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <div className="h-6 w-48 animate-pulse rounded bg-neutral-100" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
            <div className="h-7 w-14 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
