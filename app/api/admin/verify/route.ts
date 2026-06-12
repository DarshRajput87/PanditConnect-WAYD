import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationApproved, sendVerificationRejected } from '@/lib/notifications/email'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { User } from '@/lib/db/models/User'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { panditId?: string; action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { panditId, action, reason } = body
  if (!panditId || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (action === 'reject' && (!reason || reason.trim().length < 10)) {
    return NextResponse.json(
      { error: 'A rejection reason of at least 10 characters is required' },
      { status: 400 }
    )
  }

  await connectDB()
  const pandit = await Pandit.findById(panditId)
  if (!pandit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (pandit.verificationStatus !== 'pending') {
    return NextResponse.json({ error: 'This submission is no longer pending' }, { status: 409 })
  }

  if (action === 'approve') {
    await Pandit.updateOne(
      { _id: panditId },
      { $set: { verificationStatus: 'verified', aadhaarVerified: true }, $unset: { rejectionReason: 1 } }
    )
  } else {
    await Pandit.updateOne(
      { _id: panditId },
      { $set: { verificationStatus: 'rejected', rejectionReason: reason!.trim() } }
    )
  }

  // Notify the pandit (fire and forget; never block the response on email).
  if (action === 'approve') {
    sendVerificationApproved(String(pandit.userId)).catch(console.error)
  } else {
    sendVerificationRejected(String(pandit.userId), reason!.trim()).catch(console.error)
  }

  return NextResponse.json({ success: true })
}
