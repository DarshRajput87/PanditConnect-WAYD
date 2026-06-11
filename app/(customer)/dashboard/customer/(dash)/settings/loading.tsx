export default function Loading() {
  return (
    <div className="grid w-full grid-cols-1 items-start gap-5 p-4 md:p-6 lg:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-9 w-full animate-pulse rounded-md bg-neutral-100" />
            <div className="h-9 w-full animate-pulse rounded-md bg-neutral-100" />
            <div className="h-8 w-32 animate-pulse rounded-md bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
