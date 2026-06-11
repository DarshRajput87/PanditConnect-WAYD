'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  IndianRupee,
  ScrollText,
  Search,
  ArrowRight,
  ChevronDown,
  Check,
  Users,
  Star,
  Clock,
  BadgeCheck,
  Award,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { POOJA_CATALOGUE } from '@/types'
import { AnimateOnScroll } from '@/components/shared/AnimateOnScroll'

// Static marketing page — copy is intentionally hardcoded English (no i18n).
// All imagery served from the Unsplash CDN (allowed in next.config.mjs).
const HERO_IMAGE = 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1920&q=85'
const CTA_IMAGE = 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=1920&q=60'
const PANDIT_CTA_IMAGE = 'https://images.unsplash.com/photo-1609902726285-00668009f004?w=600&q=80'

const POOJA_IMAGES: Record<string, string> = {
  'satyanarayan-katha': 'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=400&q=75',
  'griha-pravesh': 'https://images.unsplash.com/photo-1560448075-bb485b067938?w=400&q=75',
  'vivah-sanskar': 'https://images.unsplash.com/photo-1601821765780-754fa98637be?w=400&q=75',
  rudrabhishek: 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=400&q=75',
  'navchandi-yagna': 'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?w=400&q=75',
  'ganesh-pooja': 'https://images.unsplash.com/photo-1567633049781-cc43498c2a5d?w=400&q=75',
  'lakshmi-pooja': 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=75',
  'vastu-pooja': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=75',
  'mundan-sanskar': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=75',
  namkaran: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=75',
  default: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=400&q=75',
}

const QUICK_SEARCHES = ['Satyanarayan Katha', 'Griha Pravesh', 'Mundan Sanskar', 'Rudrabhishek']

const HOW_STEPS = [
  {
    step: '01',
    title: 'Search for your pooja',
    desc: 'Browse our complete catalogue of poojas and sanskars. Compare verified Pandits by rating, experience, languages spoken and price — all in one place.',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    items: ['Filter by language, price & rating', 'See samagri list upfront', 'Read real verified reviews'],
  },
  {
    step: '02',
    title: 'Book in a few taps',
    desc: 'Pick a date and time, share your ceremony address, and send the booking request. Your Pandit responds within 2 hours.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    items: ['Quick response from your Pandit', 'No hidden fees', 'Cancel anytime before ceremony'],
  },
  {
    step: '03',
    title: 'Your ceremony, done right',
    desc: 'Your Pandit arrives prepared with everything needed. After the ceremony, share your experience to help other devotees.',
    image: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&q=80',
    items: ['Pandit arrives with all materials', 'Ceremony done as per vidhi', 'Leave a review after'],
  },
]

const FEATURES = [
  {
    icon: Award,
    title: 'Identity Verified',
    desc: 'Every Pandit is ID-verified and reviewed by our team before their profile goes live.',
  },
  {
    icon: Star,
    title: 'Honest Reviews',
    desc: 'Only customers who completed a booking can leave a review — no fake ratings, ever.',
  },
  {
    icon: IndianRupee,
    title: 'Price You See = Price You Pay',
    desc: 'Starting price shown upfront. Full samagri list provided before you book — no surprises.',
  },
] as Array<{ icon: LucideIcon; title: string; desc: string }>

const TESTIMONIALS = [
  {
    name: 'Ramesh Patel',
    location: 'Vadodara',
    pooja: 'Griha Pravesh',
    rating: 5,
    text: 'Pandit Ji arrived 10 minutes early with everything prepared. He explained each step in Gujarati so the whole family could follow. The samagri list sent beforehand saved us so much stress.',
    initials: 'RP',
  },
  {
    name: 'Sunita Mehta',
    location: 'Ahmedabad',
    pooja: 'Satyanarayan Katha',
    rating: 5,
    text: 'Booking was so easy. Found a verified Pandit near me in minutes, compared ratings and prices, and confirmed in one tap. The ceremony was beautiful and done exactly as it should be.',
    initials: 'SM',
  },
  {
    name: 'Vijay Desai',
    location: 'Anand',
    pooja: 'Mundan Sanskar',
    rating: 5,
    text: 'Very gentle and patient with our son during the mundan ceremony. Guided the entire family through the vidhi calmly. Would highly recommend to anyone planning a sanskar.',
    initials: 'VD',
  },
  {
    name: 'Priya Shah',
    location: 'Surat',
    pooja: 'Vivah Sanskar',
    rating: 5,
    text: 'We found Pandit Ji through PanditConnect for our wedding. His knowledge of the Vaishnav tradition was exceptional and he made the ceremony truly memorable for both families.',
    initials: 'PS',
  },
  {
    name: 'Ashok Joshi',
    location: 'Rajkot',
    pooja: 'Rudrabhishek',
    rating: 4,
    text: 'Very knowledgeable Pandit. Clear pricing with no surprises. The only minor thing was he arrived 15 minutes late but informed us beforehand. Overall a great experience.',
    initials: 'AJ',
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [heroQuery, setHeroQuery] = useState('')

  function goSearch() {
    const q = heroQuery.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <>
      {/* ── Hero — full viewport, background image ─────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Traditional Indian pooja ceremony with diyas and marigolds"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Warm saffron-tinted overlay so the text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/70 via-black/40 to-black/65" />

        {/* Floating diya-spark particles — pure CSS */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400/60"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-orange-400" />
              Verified Pandits · Transparent Pricing
            </span>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              Book Trusted <span className="text-orange-400">Pandit Ji</span>
              <br />
              Online
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
              Find and book verified Pandits for poojas, sanskars and ceremonies. Transparent pricing, complete
              samagri lists, real reviews.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={150}>
            {/* Search bar embedded in hero */}
            <div className="mx-auto mb-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') goSearch()
                  }}
                  placeholder="Search pooja — Satyanarayan, Griha Pravesh…"
                  className="h-12 w-full rounded-xl pl-11 pr-4 text-sm text-neutral-900 focus:outline-none"
                />
              </div>
              <button
                onClick={goSearch}
                className="flex h-12 items-center justify-center whitespace-nowrap rounded-xl bg-orange-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                Find a Pandit
              </button>
            </div>

            {/* Quick search pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_SEARCHES.map((p) => (
                <Link
                  key={p}
                  href={`/search?q=${encodeURIComponent(p)}`}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  {p}
                </Link>
              ))}
            </div>
          </AnimateOnScroll>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/60" />
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────────────── */}
      <section className="border-y border-neutral-100 bg-white py-5">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-3 gap-4">
            <TrustItem icon={ShieldCheck} label="Verified Pandits" sub="ID-verified, reviewed" />
            <TrustItem icon={IndianRupee} label="Transparent Pricing" sub="No hidden charges" />
            <TrustItem icon={ScrollText} label="Samagri List Included" sub="Know what to prepare" />
          </div>
        </div>
      </section>

      {/* ── Browse poojas — image cards ────────────────────────────────── */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="mb-12">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">Our Services</p>
              <h2 className="mb-3 text-3xl font-bold text-neutral-900 md:text-4xl">Browse poojas &amp; sanskars</h2>
              <p className="max-w-xl text-neutral-500">
                A curated catalogue so search, pricing and materials stay consistent across all Pandits.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {POOJA_CATALOGUE.map((pooja, i) => (
              <AnimateOnScroll key={pooja.key} animation="fade-up" delay={(i % 5) * 80}>
                <Link
                  href={`/search?q=${encodeURIComponent(pooja.name)}`}
                  className="group relative block overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                >
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={POOJA_IMAGES[pooja.key] || POOJA_IMAGES.default}
                      alt={pooja.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold leading-tight text-neutral-900">{pooja.name}</h3>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-500 transition-all group-hover:gap-2">
                      Book
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — alternating with images ─────────────────────── */}
      <section id="how" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="mb-12 md:mb-16">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">Simple Process</p>
              <h2 className="mb-3 text-3xl font-bold text-neutral-900 md:text-4xl">How it works</h2>
              <p className="max-w-xl text-neutral-500">Three simple steps from search to ceremony.</p>
            </div>
          </AnimateOnScroll>

          <div className="space-y-20">
            {HOW_STEPS.map((item, idx) => (
              <AnimateOnScroll key={item.step} animation="fade-up">
                <div className={`flex flex-col items-center gap-12 ${idx === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                  {/* Image side */}
                  <div className="relative w-full flex-1">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
                        <span className="text-lg font-bold text-white">{item.step}</span>
                      </div>
                    </div>
                  </div>

                  {/* Text side */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-neutral-900 md:text-3xl">{item.title}</h3>
                      <p className="text-lg leading-relaxed text-neutral-500">{item.desc}</p>
                    </div>
                    <ul className="space-y-3">
                      {item.items.map((point) => (
                        <li key={point} className="flex items-center gap-3">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-50">
                            <Check className="h-3 w-3 text-green-600" />
                          </span>
                          <span className="text-sm text-neutral-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why PanditConnect — stats on orange ────────────────────────── */}
      <section className="relative overflow-hidden bg-orange-500 py-20">
        {/* Subtle concentric-circle pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white"
              style={{
                width: `${200 + i * 150}px`,
                height: `${200 + i * 150}px`,
                top: `${-50 + i * 30}%`,
                right: `${-10 + i * 5}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="mb-14 text-white">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">Why PanditConnect?</h2>
              <p className="text-lg text-orange-100">Trusted by devotees across Gujarat and growing</p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={100}>
            <div className="mb-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
              <StatItem icon={Users} value="500+" label="Verified Pandits" />
              <StatItem icon={Check} value="2,000+" label="Poojas Completed" />
              <StatItem icon={Star} value="4.8★" label="Average Rating" />
              <StatItem icon={Clock} value="< 2hr" label="Response Time" />
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <AnimateOnScroll key={feature.title} animation="fade-up" delay={i * 100}>
                  <div className="h-full rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-orange-100">{feature.desc}</p>
                  </div>
                </AnimateOnScroll>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials — horizontal scroll ───────────────────────────── */}
      <section className="overflow-hidden bg-neutral-50 py-20">
        <div className="mx-auto mb-10 max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">Reviews</p>
                <h2 className="text-3xl font-bold text-neutral-900 md:text-4xl">What devotees say</h2>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                ))}
                <span className="ml-2 text-sm text-neutral-500">4.8 average</span>
              </div>
            </div>
          </AnimateOnScroll>
        </div>

        <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:px-8">
          {TESTIMONIALS.map((review) => (
            <div
              key={review.name}
              className="w-80 flex-shrink-0 snap-start rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-orange-400 text-orange-400' : 'text-neutral-200'}`}
                  />
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-neutral-700">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
                  {review.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{review.name}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {review.pooja} · {review.location}
                  </p>
                </div>
                <span className="ml-auto inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
                  <BadgeCheck className="h-2.5 w-2.5" />
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── For Pandits ────────────────────────────────────────────────── */}
      <section className="border-y border-neutral-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-col items-center gap-8 lg:flex-row">
              <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-2xl lg:h-64 lg:w-64">
                <Image
                  src={PANDIT_CTA_IMAGE}
                  alt="Pandit performing a traditional ceremony"
                  fill
                  sizes="(max-width: 1024px) 100vw, 256px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 text-center lg:text-left">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">For Pandits</p>
                <h2 className="mb-3 text-2xl font-bold text-neutral-900 md:text-3xl">Grow your practice online</h2>
                <p className="mx-auto mb-6 max-w-lg text-neutral-500 lg:mx-0">
                  Join hundreds of verified Pandits growing their bookings through PanditConnect. Build your profile,
                  receive booking requests, and earn reviews that compound over time.
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register as Pandit Ji
                  </Link>
                  <Link
                    href="#how"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    How it works
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-orange-500 py-24">
        <div className="absolute inset-0">
          <Image src={CTA_IMAGE} alt="" fill sizes="100vw" className="object-cover opacity-20" />
        </div>

        <div className="relative z-10 px-4 text-center">
          <AnimateOnScroll animation="fade-up">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">Ready to book your next pooja?</h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-orange-100">
              Join thousands of devotees finding trusted Pandits online.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-orange-600 shadow-lg transition-colors hover:bg-orange-50"
              >
                <Search className="h-4 w-4" />
                Find a Pandit
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-orange-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  )
}

function TrustItem({ icon: Icon, label, sub }: { icon: LucideIcon; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
        <Icon className="h-5 w-5 text-orange-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        <p className="hidden text-xs text-neutral-500 sm:block">{sub}</p>
      </div>
    </div>
  )
}

function StatItem({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="mb-1 text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-orange-100">{label}</p>
    </div>
  )
}
