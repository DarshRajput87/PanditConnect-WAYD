export default function Loading() {
  return (
    <div className="w-full space-y-5 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-8 w-44 animate-pulse rounded-lg bg-neutral-100" />
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-50" />
          ))}
        </div>
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-neutral-200 bg-white" />
    </div>
  )
}
