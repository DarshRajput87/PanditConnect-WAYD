export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 rounded bg-neutral-100" />
      <div className="mt-2 h-4 w-64 rounded bg-neutral-100" />
      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 rounded-md bg-neutral-100" />
          <div className="h-11 rounded-md bg-neutral-100" />
        </div>
        <div className="h-10 rounded-md bg-neutral-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-10 rounded-md bg-neutral-100" />
          <div className="h-10 rounded-md bg-neutral-100" />
        </div>
        <div className="h-10 rounded-md bg-neutral-100" />
        <div className="h-10 rounded-md bg-neutral-100" />
        <div className="h-10 rounded-md bg-neutral-100" />
      </div>
    </div>
  )
}
