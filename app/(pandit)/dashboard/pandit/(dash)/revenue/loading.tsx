export default function Loading() {
  return (
    <div className="w-full space-y-5 p-4 md:p-6">
      <div className="h-12 animate-pulse rounded-lg border border-neutral-200 bg-white" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
            <div className="h-7 w-16 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-white" />
    </div>
  )
}
