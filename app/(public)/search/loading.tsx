export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-neutral-50">
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="h-9 flex-1 animate-pulse rounded-lg border border-neutral-200 bg-white" />
          <div className="h-9 animate-pulse rounded-lg border border-neutral-200 bg-white md:w-56" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-neutral-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-neutral-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  )
}
