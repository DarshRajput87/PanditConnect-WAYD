export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="space-y-6">
        <div className="skeleton h-8 w-2/3 max-w-sm" />
        <div className="skeleton h-4 w-1/2 max-w-xs" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 p-4">
              <div className="skeleton mb-3 h-10 w-10 rounded-md" />
              <div className="skeleton mb-2 h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
