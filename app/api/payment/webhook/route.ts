import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Payment } from '@/lib/db/models/Payment'
import { verifyWebhookSignature } from '@/lib/payments/razorpay'

// Razorpay webhook — configure the endpoint with RAZORPAY_WEBHOOK_SECRET.
// Handlers are idempotent: replaying an event produces no extra side effects
// because each is a state-conditional updateOne.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event?: string; payload?: Record<string, { entity?: Record<string, unknown> }> }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  try {
    await connectDB()

    switch (event.event) {
      case 'payment.failed': {
        const orderId = event.payload?.payment?.entity?.order_id
        if (typeof orderId === 'string') {
          await Payment.updateOne(
            { razorpayOrderId: orderId, status: 'pending' },
            { $set: { status: 'failed' } }
          )
        }
        break
      }
      case 'payment.captured': {
        const entity = event.payload?.payment?.entity
        const orderId = entity?.order_id
        if (typeof orderId === 'string') {
          await Payment.updateOne(
            { razorpayOrderId: orderId, status: 'pending' },
            {
              $set: {
                status: 'paid',
                paidAt: new Date(),
                ...(typeof entity?.id === 'string' ? { razorpayPaymentId: entity.id } : {}),
              },
            }
          )
        }
        break
      }
      case 'refund.processed': {
        const refundId = event.payload?.refund?.entity?.id
        if (typeof refundId === 'string') {
          await Payment.updateOne({ refundId }, { $set: { status: 'refunded', refundedAt: new Date() } })
        }
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[webhook] processing failed', e)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
