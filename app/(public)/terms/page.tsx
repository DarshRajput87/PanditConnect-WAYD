import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalArticle, type LegalSection } from '@/components/shared/LegalArticle'

export const metadata: Metadata = {
  title: 'Terms of Service — PanditConnect',
  description: 'The terms that govern your use of PanditConnect as a devotee or a Pandit.',
}

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of these terms',
    body: (
      <>
        <p>
          By creating an account or using PanditConnect (the &ldquo;Platform&rdquo;), you agree to these Terms of
          Service and our{' '}
          <Link href="/privacy" className="text-orange-600 hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree, please do not use the Platform.
        </p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'What PanditConnect is',
    body: (
      <>
        <p>
          PanditConnect is an online marketplace that connects devotees (&ldquo;Customers&rdquo;) with independent
          priests (&ldquo;Pandits&rdquo;) for poojas, sanskars and ceremonies.
        </p>
        <p>
          <strong>We are a platform, not a ceremony provider.</strong> Pandits on PanditConnect are independent
          professionals, not our employees or agents. The agreement to perform a ceremony is between the Customer
          and the Pandit; PanditConnect facilitates discovery, booking and communication.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts & eligibility',
    body: (
      <>
        <p>To use the Platform you must:</p>
        <ul>
          <li>Be at least 18 years old.</li>
          <li>Provide accurate, current information when registering and keep it up to date.</li>
          <li>Keep your login credentials confidential — you are responsible for activity on your account.</li>
        </ul>
        <p>
          Accounts are role-based (Customer or Pandit). One person may not hold multiple accounts to evade
          restrictions or manipulate reviews.
        </p>
      </>
    ),
  },
  {
    id: 'bookings',
    title: 'Bookings, pricing & samagri',
    body: (
      <>
        <ul>
          <li>
            <strong>Prices are set by Pandits.</strong> Each service shows a starting price; the final dakshina may
            vary with the scope of the ceremony and is agreed between you and the Pandit.
          </li>
          <li>
            <strong>Samagri lists are provided upfront</strong> so you know what to arrange before the ceremony.
          </li>
          <li>
            PanditConnect does not currently process payments. Payment is settled directly between the Customer and
            the Pandit.
          </li>
          <li>
            A booking request is not a confirmed booking until the Pandit accepts it. Pandits aim to respond within
            a few hours.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancellations',
    body: (
      <>
        <ul>
          <li>Customers may cancel a requested or confirmed booking any time before the ceremony.</li>
          <li>
            Pandits may cancel a confirmed booking only when unavoidable, and should give the Customer as much
            notice as possible.
          </li>
          <li>
            Repeated or bad-faith cancellations by either party may lead to account suspension.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'pandit-obligations',
    title: 'Pandit verification & obligations',
    body: (
      <>
        <p>Pandits on the Platform agree to:</p>
        <ul>
          <li>Complete identity verification truthfully. We store only the last four digits of Aadhaar.</li>
          <li>Represent their training, sampradaya, languages and services accurately.</li>
          <li>Honour confirmed bookings, arrive prepared and perform ceremonies as per vidhi.</li>
          <li>Set fair prices and not demand undisclosed charges beyond what was agreed.</li>
        </ul>
        <p>
          Verification confirms identity and credentials at the time of review; it is not a guarantee of any
          particular outcome of a ceremony.
        </p>
      </>
    ),
  },
  {
    id: 'reviews',
    title: 'Reviews',
    body: (
      <>
        <ul>
          <li>Only Customers who completed a booking may review that booking — one review per booking.</li>
          <li>Reviews must be honest and based on your own experience.</li>
          <li>
            We may remove reviews that are abusive, discriminatory, fraudulent, or unrelated to the ceremony.
          </li>
          <li>Pandits may post one public reply to each review.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'conduct',
    title: 'Prohibited conduct',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Provide false identity, credentials or verification documents.</li>
          <li>Post fake, incentivised or manipulated reviews or ratings.</li>
          <li>Harass, discriminate against or abuse other users.</li>
          <li>Use the Platform to advertise unrelated services or spam other users.</li>
          <li>Scrape, copy or reverse-engineer the Platform, or interfere with its operation.</li>
          <li>Circumvent the Platform to avoid its policies after discovering a Pandit through it.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: (
      <>
        <p>
          The Platform, its design, text, graphics and software are owned by PanditConnect and protected by
          applicable laws. Content you submit (profile details, reviews) remains yours; you grant us a worldwide,
          royalty-free licence to display it on the Platform for the purpose of operating the service.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimer',
    title: 'Disclaimers & limitation of liability',
    body: (
      <>
        <p>
          The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the maximum extent
          permitted by law:
        </p>
        <ul>
          <li>
            We do not guarantee the conduct, punctuality or performance of any Pandit or Customer, or any outcome
            of a ceremony.
          </li>
          <li>
            We are not liable for indirect or consequential losses arising from your use of the Platform or from
            any ceremony arranged through it.
          </li>
          <li>
            Nothing in these terms limits liability that cannot be limited under applicable law.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Suspension & termination',
    body: (
      <>
        <p>
          We may suspend or terminate accounts that violate these terms, harm other users, or attempt to defraud
          the Platform. You may delete your account at any time by contacting us. Sections that by their nature
          should survive termination (e.g. liability, IP) will survive.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <>
        <p>
          We may update these terms from time to time. Material changes will be announced on the Platform; the
          &ldquo;Last updated&rdquo; date above reflects the latest revision. Continued use after changes take
          effect constitutes acceptance.
        </p>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    body: (
      <>
        <p>
          These terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of
          the courts at Vadodara, Gujarat.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <>
        <p>
          Questions about these terms? Reach us at{' '}
          <a href="mailto:support@panditconnect.in" className="text-orange-600 hover:underline">
            support@panditconnect.in
          </a>{' '}
          or via the{' '}
          <Link href="/contact" className="text-orange-600 hover:underline">
            contact page
          </Link>
          .
        </p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalArticle
      badge="Legal"
      title="Terms of Service"
      lastUpdated="June 11, 2026"
      intro="These terms govern your use of PanditConnect, whether you book ceremonies as a devotee or offer your services as a Pandit. Please read them carefully."
      sections={SECTIONS}
    />
  )
}
