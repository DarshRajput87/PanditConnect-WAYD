import { sendEmail } from '@/lib/email/mailer'
import { APP_URL } from '@/lib/app-url'
import { connectDB } from '@/lib/db/connect'
import { User } from '@/lib/db/models/User'
import { Booking } from '@/lib/db/models/Booking'
import { Pandit } from '@/lib/db/models/Pandit'

// ─── Booking request → Pandit ─────────────────────────────
export async function sendBookingRequestToPanel(bookingId: string) {
  try {
    await connectDB()
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name')
      .populate('panditId')
      .populate('poojaId', 'name')
      .lean()
    if (!booking) return

    const pandit = booking.panditId as any
    const user = await User.findById(pandit.userId).select('name email').lean()
    if (!user?.email) return

    const customerName = (booking.customerId as any)?.name ?? 'A customer'
    const poojaName = (booking.poojaId as any)?.name ?? 'a pooja'
    const date = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    })

    await sendEmail({
      to: user.email,
      subject: `New Booking Request — ${poojaName}`,
      text: `Namaste ${user.name},\n\nYou have a new booking request!\n\nCustomer: ${customerName}\nPooja: ${poojaName}\nDate: ${date}\nAddress: ${booking.address.city}, ${booking.address.state}\n\nPlease respond within 2 hours.\n\nLog in to respond:\n${APP_URL}/dashboard/pandit/inquiries\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.error('[Email] sendBookingRequestToPanel failed:', e)
  }
}

// ─── Booking confirmed → Customer ─────────────────────────
export async function sendBookingConfirmedToCustomer(bookingId: string) {
  try {
    await connectDB()
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('panditId')
      .populate('poojaId', 'name')
      .lean()
    if (!booking) return

    const customer = booking.customerId as any
    if (!customer?.email) return

    const pandit = booking.panditId as any
    const panditUser = await User.findById(pandit.userId).select('name').lean()
    const poojaName = (booking.poojaId as any)?.name ?? 'your pooja'
    const date = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    })

    await sendEmail({
      to: customer.email,
      subject: `Booking Confirmed — ${poojaName} on ${date}`,
      text: `Namaste ${customer.name},\n\nGreat news! Your booking has been confirmed.\n\nPandit: ${panditUser?.name ?? 'Pandit Ji'}\nPooja: ${poojaName}\nDate: ${date}\nAddress: ${booking.address.line1}, ${booking.address.city}\n\nView your booking:\n${APP_URL}/dashboard/customer/bookings/${bookingId}\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.error('[Email] sendBookingConfirmedToCustomer failed:', e)
  }
}

// ─── Booking declined → Customer ──────────────────────────
export async function sendBookingDeclinedToCustomer(bookingId: string) {
  try {
    await connectDB()
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('poojaId', 'name')
      .lean()
    if (!booking) return

    const customer = booking.customerId as any
    if (!customer?.email) return
    const poojaName = (booking.poojaId as any)?.name ?? 'your pooja'

    await sendEmail({
      to: customer.email,
      subject: `Booking Update — ${poojaName}`,
      text: `Namaste ${customer.name},\n\nUnfortunately, the Pandit was unable to accept your booking for ${poojaName}.\n\nYou can find and book another available Pandit here:\n${APP_URL}/search\n\nWe are sorry for the inconvenience.\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.error('[Email] sendBookingDeclinedToCustomer failed:', e)
  }
}

// ─── Booking expired → Customer ───────────────────────────
export async function sendBookingExpiredToCustomer(bookingId: string) {
  try {
    await connectDB()
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('poojaId', 'name')
      .lean()
    if (!booking) return

    const customer = booking.customerId as any
    if (!customer?.email) return
    const poojaName = (booking.poojaId as any)?.name ?? 'your pooja'

    await sendEmail({
      to: customer.email,
      subject: `Booking Request Expired — ${poojaName}`,
      text: `Namaste ${customer.name},\n\nYour booking request for ${poojaName} expired because the Pandit did not respond in time.\n\nPlease try booking another available Pandit:\n${APP_URL}/search\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.error('[Email] sendBookingExpiredToCustomer failed:', e)
  }
}

// ─── Review request → Customer ────────────────────────────
export async function sendReviewRequestToCustomer(bookingId: string) {
  try {
    await connectDB()
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email')
      .populate('panditId')
      .populate('poojaId', 'name')
      .lean()
    if (!booking) return

    const customer = booking.customerId as any
    if (!customer?.email) return

    const pandit = booking.panditId as any
    const panditUser = await User.findById(pandit.userId).select('name').lean()
    const poojaName = (booking.poojaId as any)?.name ?? 'your pooja'

    await sendEmail({
      to: customer.email,
      subject: `How was your ${poojaName}? Share your experience`,
      text: `Namaste ${customer.name},\n\nWe hope your ${poojaName} with ${panditUser?.name ?? 'Pandit Ji'} was wonderful!\n\nYour review helps other devotees find the right Pandit. It only takes 1 minute.\n\nWrite your review here:\n${APP_URL}/dashboard/customer/bookings/${bookingId}/review\n\nThank you for being part of PanditConnect.\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.error('[Email] sendReviewRequestToCustomer failed:', e)
  }
}

// ─── Verification approved → Pandit ───────────────────────
export async function sendVerificationApproved(panditUserId: string) {
  try {
    await connectDB()
    const user = await User.findById(panditUserId).select('name email').lean()
    if (!user?.email) return

    await sendEmail({
      to: user.email,
      subject: 'Profile Verified — You\'re Live on PanditConnect! 🎉',
      text: `Namaste ${user.name},\n\nCongratulations! Your profile has been verified and is now live on PanditConnect.\n\nDevotees can now find and book you. Start managing your bookings from your dashboard:\n${APP_URL}/dashboard/pandit/overview\n\nWishing you many successful ceremonies ahead!\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.error('[Email] sendVerificationApproved failed:', e)
  }
}

// ─── Verification rejected → Pandit ───────────────────────
export async function sendVerificationRejected(panditUserId: string, reason: string) {
  try {
    await connectDB()
    const user = await User.findById(panditUserId).select('name email').lean()
    if (!user?.email) return

    await sendEmail({
      to: user.email,
      subject: 'Verification Update — PanditConnect',
      text: `Namaste ${user.name},\n\nThank you for registering on PanditConnect.\n\nUnfortunately, we were unable to verify your profile at this time.\n\nReason: ${reason}\n\nPlease update your profile and resubmit:\n${APP_URL}/onboarding\n\nIf you have any questions, please contact us at support@panditconnect.in\n\n— Team PanditConnect`,
    })
  } catch (e) {
    console.error('[Email] sendVerificationRejected failed:', e)
  }
}
