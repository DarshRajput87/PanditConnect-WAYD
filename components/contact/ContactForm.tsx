'use client'
import { useState } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { sendContactMessage } from '@/actions/contact'
import type { ContactSubject } from '@/lib/validators/contact'

const SUBJECT_OPTIONS: Array<{ value: ContactSubject; label: string }> = [
  { value: 'booking', label: 'Help with a booking' },
  { value: 'pandit', label: 'Joining as a Pandit' },
  { value: 'feedback', label: 'Feedback & suggestions' },
  { value: 'partnership', label: 'Partnership enquiry' },
  { value: 'other', label: 'Something else' },
]

const EMPTY = { name: '', email: '', subject: 'booking' as ContactSubject, message: '' }

export function ContactForm() {
  const [values, setValues] = useState(EMPTY)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({})
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setErrors({})
    const res = await sendContactMessage({ ...values, website: honeypot })
    setPending(false)
    if ('error' in res) {
      setErrors(res.error)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </span>
        <h3 className="mb-2 text-xl font-semibold text-neutral-900">Message sent</h3>
        <p className="mb-6 max-w-sm text-sm text-neutral-600">
          Thank you for reaching out. Our team usually replies within one business day.
        </p>
        <button
          onClick={() => {
            setValues(EMPTY)
            setSent(false)
          }}
          className="text-sm font-medium text-orange-600 hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Your name</Label>
          <Input
            id="contact-name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ramesh Patel"
            autoComplete="name"
          />
          {errors.name?.[0] && <p className="text-xs text-red-600">{errors.name[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email?.[0] && <p className="text-xs text-red-600">{errors.email[0]}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">What is this about?</Label>
        <Select
          id="contact-subject"
          value={values.subject}
          onChange={(e) => set('subject', e.target.value as ContactSubject)}
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          rows={6}
          value={values.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Tell us how we can help…"
        />
        {errors.message?.[0] && <p className="text-xs text-red-600">{errors.message[0]}</p>}
      </div>

      {/* Honeypot — hidden from real users, bots fill it and get silently dropped */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {errors._form?.[0] && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors._form[0]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
