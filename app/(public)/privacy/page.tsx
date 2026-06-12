import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalArticle, type LegalSection } from '@/components/shared/LegalArticle'

export const metadata: Metadata = {
  title: 'Privacy Policy — PanditConnect',
  description: 'How PanditConnect collects, uses and protects your personal information.',
}

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>
          This policy explains what personal information PanditConnect collects, why we collect it, and how we
          protect it. It applies to everyone who uses the Platform — devotees booking ceremonies and Pandits
          offering their services.
        </p>
        <p>
          The short version: we collect only what we need to run a trustworthy marketplace, we never sell your
          data, and verification documents are stored privately.
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <p>
          <strong>Account information (all users):</strong> name, email address, mobile number, preferred language
          and your password (stored only as a secure hash — we never see or store it in plain text).
        </p>
        <p>
          <strong>Customer information:</strong> an optional saved ceremony address (city, area, pincode) to make
          booking faster, plus your booking history and the reviews you write.
        </p>
        <p>
          <strong>Pandit verification information:</strong> date of birth, gender, address, training and service
          details, and identity verification data. <strong>We store only the last four digits of your Aadhaar
          number — never the full number.</strong> Uploaded ID documents are stored in private, access-controlled
          storage and are visible only to our verification team.
        </p>
        <p>
          <strong>Technical information:</strong> standard log data such as IP address and browser type, used for
          security and debugging.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use your information',
    body: (
      <>
        <ul>
          <li>To create and secure your account (including OTP email verification).</li>
          <li>To verify Pandit identities and credentials before profiles go live.</li>
          <li>To facilitate bookings — sharing the necessary details between Customer and Pandit.</li>
          <li>To display profiles, services, prices and verified reviews.</li>
          <li>To send transactional notifications about your bookings (requests, confirmations, cancellations).</li>
          <li>To prevent fraud, fake reviews and abuse of the Platform.</li>
        </ul>
        <p>We do not use your personal information for third-party advertising, and we never sell it.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'When we share information',
    body: (
      <>
        <p>
          <strong>Between users, as needed for a booking:</strong> when a booking is made, the Pandit sees the
          Customer&rsquo;s name, contact details and ceremony address; the Customer sees the Pandit&rsquo;s public
          profile and contact details. Pandit profiles (name, photo, services, prices, ratings) are public.
        </p>
        <p>
          <strong>Service providers that run the Platform:</strong> database hosting (MongoDB), media storage and
          delivery (Cloudinary — profile photos are public; ID documents are private), email delivery (SMTP
          provider), and optional Google sign-in. Each receives only what it needs to provide its service.
        </p>
        <p>
          <strong>Legal requirements:</strong> we may disclose information when required by law or to protect the
          rights and safety of our users.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect your data',
    body: (
      <>
        <ul>
          <li>Passwords are hashed with bcrypt — never stored or transmitted in plain text.</li>
          <li>Email verification codes expire quickly and lock after repeated failed attempts.</li>
          <li>Only the last four digits of Aadhaar are ever stored.</li>
          <li>ID documents live in private, authenticated storage — they are never publicly accessible.</li>
          <li>All traffic to the Platform is encrypted in transit (HTTPS).</li>
        </ul>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention',
    body: (
      <>
        <p>
          We keep your information for as long as your account is active. If you delete your account, we remove
          your personal information within a reasonable period, except where we must retain records to comply with
          law, resolve disputes or prevent fraud. Reviews may remain visible in anonymised form to preserve the
          integrity of Pandit ratings.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights & choices',
    body: (
      <>
        <ul>
          <li>
            <strong>Access & correction:</strong> view and update your profile details from your dashboard settings.
          </li>
          <li>
            <strong>Language:</strong> choose your preferred language (English, हिन्दी, ગુજરાતી) at any time.
          </li>
          <li>
            <strong>Deletion:</strong> request account deletion by contacting us — see below.
          </li>
          <li>
            <strong>Grievances:</strong> if you believe your data has been mishandled, contact our support team and
            we will investigate promptly.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <>
        <p>
          We use only essential cookies: a session cookie that keeps you signed in, and a preference cookie that
          remembers your language. We do not use third-party advertising or tracking cookies.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <>
        <p>
          The Platform is intended for users aged 18 and over. We do not knowingly collect personal information
          from children. Ceremonies involving children (such as Mundan or Namkaran) are booked and managed by their
          parents or guardians.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <>
        <p>
          We may update this policy as the Platform evolves. Material changes will be announced on the Platform,
          and the &ldquo;Last updated&rdquo; date above always reflects the current version.
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
          For privacy questions or data requests, email{' '}
          <a href="mailto:support@panditconnect.in" className="text-orange-600 hover:underline">
            support@panditconnect.in
          </a>{' '}
          or use the{' '}
          <Link href="/contact" className="text-orange-600 hover:underline">
            contact page
          </Link>
          .
        </p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalArticle
      badge="Legal"
      title="Privacy Policy"
      lastUpdated="June 11, 2026"
      intro="Your trust matters to us — in ceremonies and in data. This policy explains what we collect, why, and how we keep it safe."
      sections={SECTIONS}
    />
  )
}
