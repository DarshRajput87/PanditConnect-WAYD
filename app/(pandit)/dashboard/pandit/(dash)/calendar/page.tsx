import { getPanditCalendarBookings, getPanditAvailability } from '@/actions/pandit-dashboard'
import { CalendarSection } from '@/components/pandit/CalendarSection'

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams

  // Default to the current IST month; ?month is 1-based in the URL.
  const todayIst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const [ty, tm] = todayIst.split('-').map(Number)
  const year = Number(sp.year) >= 2020 && Number(sp.year) <= 2100 ? Number(sp.year) : ty
  const month1 = Number(sp.month) >= 1 && Number(sp.month) <= 12 ? Number(sp.month) : tm

  const [bookings, availability] = await Promise.all([
    getPanditCalendarBookings(year, month1 - 1),
    getPanditAvailability(),
  ])

  return (
    <CalendarSection bookings={bookings} availability={availability} year={year} month={month1 - 1} today={todayIst} />
  )
}
