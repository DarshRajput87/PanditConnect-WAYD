import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Flame,
  HandHeart,
  IndianRupee,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { AnimateOnScroll } from '@/components/shared/AnimateOnScroll'
import { GENERATED_IMAGES } from '@/lib/generated-images'

export const metadata: Metadata = {
  title: 'About Us — PanditConnect',
  description:
    'PanditConnect connects devotees with verified Pandits for poojas, sanskars and ceremonies — with transparent pricing, complete samagri lists and honest reviews.',
}

const HERO_IMAGE =
  GENERATED_IMAGES.ctaBanner || 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=1920&q=60'
const STORY_IMAGE =
  GENERATED_IMAGES.forPandits || 'https://images.unsplash.com/photo-1609902726285-00668009f004?w=600&q=80'

const VALUES: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: Flame,
    title: 'Shraddha first',
    desc: 'Every ceremony is sacred. We build around the rituals — never the other way round — so each pooja is done as per vidhi.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified trust',
    desc: 'Every Pandit on the platform is ID-verified and reviewed by our team before their profile ever goes live.',
  },
  {
    icon: IndianRupee,
    title: 'Honest pricing',
    desc: 'Starting prices and complete samagri lists are shown upfront. The price you see is the price you pay — no surprises.',
  },
  {
    icon: HandHeart,
    title: 'Community grown',
    desc: 'Reviews come only from devotees who completed a booking, so every rating reflects a real ceremony in a real home.',
  },
]

const VERIFY_STEPS = [
  {
    step: '01',
    title: 'Identity check',
    desc: 'Government ID verification for every applicant. We store only the last four digits of Aadhaar — never the full number.',
  },
  {
    step: '02',
    title: 'Credential review',
    desc: 'Our team reviews each Pandit’s training, sampradaya, languages and the poojas they offer before approval.',
  },
  {
    step: '03',
    title: 'Ongoing quality',
    desc: 'Verified reviews after every completed booking keep standards high. Profiles that slip are re-reviewed.',
  },
]

const STATS = [
  { icon: Users, value: '500+', label: 'Verified Pandits' },
  { icon: BadgeCheck, value: '2,000+', label: 'Poojas Completed' },
  { icon: Star, value: '4.8★', label: 'Average Rating' },
  { icon: HandHeart, value: '15+', label: 'Cities in Gujarat' },
]

export default function AboutPage() {
  return (
    <>
      {/* ── Page hero ──────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/70 via-black/50 to-black/65" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center">
          <AnimateOnScroll animation="fade-up">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-orange-400">About PanditConnect</p>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-white md:text-5xl">
              Tradition you can trust,
              <br />
              booking made simple
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
              We connect devotees with verified Pandits for poojas, sanskars and ceremonies — bringing transparency
              and trust to a tradition that deserves both.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Our story ──────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="relative w-full flex-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                  <Image
                    src={STORY_IMAGE}
                    alt="Pandit Ji performing a traditional ceremony"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Our Story</p>
                <h2 className="text-3xl font-bold text-neutral-900 md:text-4xl">Why we built PanditConnect</h2>
                <p className="leading-relaxed text-neutral-600">
                  For generations, finding the right Pandit Ji meant relying on word of mouth — a neighbour&rsquo;s
                  recommendation, a relative&rsquo;s contact. It worked, until families moved to new cities, dates
                  clashed, and nobody knew what a ceremony should fairly cost or which samagri to prepare.
                </p>
                <p className="leading-relaxed text-neutral-600">
                  PanditConnect started in Gujarat with a simple idea: devotees deserve the same clarity when booking
                  a sacred ceremony as they get anywhere else — verified credentials, upfront pricing, complete
                  samagri lists and honest reviews — without losing an ounce of the tradition itself.
                </p>
                <p className="leading-relaxed text-neutral-600">
                  Today, hundreds of verified Pandits across Gujarat grow their practice on PanditConnect, and
                  thousands of families book their poojas, sanskars and ceremonies with confidence.
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="mb-12">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">What We Stand For</p>
              <h2 className="mb-3 text-3xl font-bold text-neutral-900 md:text-4xl">Our values</h2>
              <p className="max-w-xl text-neutral-500">
                Four principles guide every decision we make — from how we verify Pandits to how we show prices.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => {
              const Icon = value.icon
              return (
                <AnimateOnScroll key={value.title} animation="fade-up" delay={i * 100}>
                  <div className="h-full rounded-2xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-md">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                      <Icon className="h-5 w-5 text-orange-500" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-neutral-900">{value.title}</h3>
                    <p className="text-sm leading-relaxed text-neutral-500">{value.desc}</p>
                  </div>
                </AnimateOnScroll>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <section className="bg-orange-500 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {STATS.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="mb-1 text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-orange-100">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── How we verify ──────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="mb-12">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">Trust &amp; Safety</p>
              <h2 className="mb-3 text-3xl font-bold text-neutral-900 md:text-4xl">How we verify every Pandit</h2>
              <p className="max-w-xl text-neutral-500">
                The verified badge means a real person on our team checked, reviewed and approved the profile.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {VERIFY_STEPS.map((item, i) => (
              <AnimateOnScroll key={item.step} animation="fade-up" delay={i * 100}>
                <div className="h-full rounded-2xl border border-neutral-100 bg-neutral-50 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
                    <span className="text-lg font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-500">{item.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <AnimateOnScroll animation="fade-up">
            <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">Be part of the journey</h2>
            <p className="mx-auto mb-10 max-w-xl text-neutral-500">
              Whether you&rsquo;re planning your next ceremony or you&rsquo;re a Pandit looking to grow your
              practice, there&rsquo;s a place for you here.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                <Search className="h-4 w-4" />
                Find a Pandit
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-8 py-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                <UserPlus className="h-4 w-4" />
                Register as Pandit Ji
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  )
}
