export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 rounded bg-neutral-100" />
      <div className="mt-2 h-4 w-64 rounded bg-neutral-100" />
      <div className="mt-6 space-y-4">
        <div className="h-4 w-32 rounded bg-neutral-100" />
        <div className="flex justify-between gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-md bg-neutral-100" />
          ))}
        </div>
        <div className="h-10 rounded-md bg-neutral-100" />
      </div>
    </div>
  )
}
