export default function Loading() {
  return (
    <div className="w-full space-y-4 p-4 md:p-6">
      <div className="h-3 w-28 animate-pulse rounded bg-neutral-100" />
      <div className="space-y-2">
        <div className="h-6 w-48 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-neutral-200 bg-white" />
      <div className="h-56 animate-pulse rounded-xl border border-neutral-200 bg-white" />
    </div>
  )
}
