import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Mail, MapPin, UserPlus, type LucideIcon } from 'lucide-react'
import { AnimateOnScroll } from '@/components/shared/AnimateOnScroll'
import { ContactForm } from '@/components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us — PanditConnect',
  description:
    'Questions about a booking, joining as a Pandit, or anything else? Reach the PanditConnect team — we usually reply within one business day.',
}

const FAQS = [
  {
    q: 'How do I know a Pandit is genuine?',
    a: 'Every Pandit on PanditConnect is ID-verified and reviewed by our team before their profile goes live. Look for the verified badge — and read reviews, which come only from devotees who completed a booking.',
  },
  {
    q: 'What does the price shown include?',
    a: 'The starting price covers the Pandit Ji’s dakshina for performing the ceremony. Each pooja listing includes a complete samagri list so you know exactly what to arrange — no hidden charges.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes. You can cancel a booking from your dashboard any time before the ceremony. The Pandit is notified automatically.',
  },
  {
    q: 'How do I join as a Pandit?',
    a: 'Register with the "Pandit" role and complete the onboarding — your details, services, pricing and ID verification. Our team reviews every application before approval, usually within a few days.',
  },
]

export default function ContactPage() {
  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">Contact Us</p>
            <h1 className="mb-3 text-3xl font-bold text-neutral-900 md:text-4xl">We&rsquo;re here to help</h1>
            <p className="max-w-xl text-neutral-500">
              Questions about a booking, joining as a Pandit, or anything else — send us a message and we&rsquo;ll
              get back to you within one business day.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Info + form ────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Contact details */}
            <AnimateOnScroll animation="fade-up" className="lg:col-span-2">
              <div className="space-y-4">
                <InfoCard icon={Mail} title="Email us">
                  <a href="mailto:support@panditconnect.in" className="text-orange-600 hover:underline">
                    support@panditconnect.in
                  </a>
                  <p className="mt-1 text-xs text-neutral-400">We reply within one business day</p>
                </InfoCard>

                <InfoCard icon={Clock} title="Support hours">
                  <p>Monday – Saturday</p>
                  <p>9:00 AM – 7:00 PM IST</p>
                </InfoCard>

                <InfoCard icon={MapPin} title="Office">
                  <p>PanditConnect</p>
                  <p>Alkapuri, Vadodara</p>
                  <p>Gujarat 390007, India</p>
                </InfoCard>

                <div className="rounded-2xl bg-orange-50 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-orange-600" />
                    <h3 className="text-sm font-semibold text-neutral-900">Want to join as a Pandit Ji?</h3>
                  </div>
                  <p className="mb-3 text-sm text-neutral-600">
                    Skip the form — register directly and complete your profile. Our team reviews every application.
                  </p>
                  <Link href="/register" className="text-sm font-semibold text-orange-600 hover:underline">
                    Register as Pandit Ji →
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Form */}
            <AnimateOnScroll animation="fade-up" delay={100} className="lg:col-span-3">
              <div className="rounded-2xl border border-neutral-100 p-6 shadow-sm sm:p-8">
                <h2 className="mb-6 text-xl font-semibold text-neutral-900">Send us a message</h2>
                <ContactForm />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="mb-10 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">FAQ</p>
              <h2 className="text-3xl font-bold text-neutral-900">Quick answers</h2>
            </div>
          </AnimateOnScroll>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <AnimateOnScroll key={faq.q} animation="fade-up" delay={i * 80}>
                <details className="group rounded-2xl border border-neutral-200 bg-white p-5 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="text-neutral-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{faq.a}</p>
                </details>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function InfoCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
          <Icon className="h-4 w-4 text-orange-500" />
        </span>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="text-sm text-neutral-600">{children}</div>
    </div>
  )
}
