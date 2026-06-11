// Client-side formatting helpers for the Pandit dashboard.

export function dateLocaleOf(lang: string): string {
  if (lang.startsWith('hi')) return 'hi-IN'
  if (lang.startsWith('gu')) return 'gu-IN'
  return 'en-IN'
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDuration(durationMin: number): string {
  if (durationMin >= 60) {
    const h = durationMin / 60
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
  }
  return `${durationMin}m`
}
