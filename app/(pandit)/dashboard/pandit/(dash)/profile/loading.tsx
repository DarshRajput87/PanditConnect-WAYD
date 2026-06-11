export default function Loading() {
  return (
    <div className="max-w-3xl space-y-4 p-4 md:p-6">
      <div className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-white" />
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-white" />
    </div>
  )
}
