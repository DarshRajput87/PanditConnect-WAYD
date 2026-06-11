# Phase 2 — Pandit Registration & Verification
> Claude Code Prompt · Requires Phase 1 complete

---

## PROMPT START

Phase 1 is complete. Now build Phase 2: the complete Pandit registration multi-step form, document upload (Cloudinary), and Admin verification workflow.

### Context
- Stack: Next.js 15, TypeScript, Tailwind, shadcn/ui, MongoDB, Cloudinary
- Design: white background, orange-500 primary, Stripe-inspired, mobile-first
- All DB models exist from Phase 1 (`lib/db/models/`)
- Auth and session are working

---

### Task 1: Multi-Step Registration Form

Create `app/(pandit)/register/page.tsx` — a 4-step form wizard. Steps appear as a horizontal progress bar.

**Step indicator component** (`components/shared/StepIndicator.tsx`):
```tsx
interface Props { steps: string[]; current: number }
// Render: orange filled circle for completed, orange border for current, gray for upcoming
// Connector line between steps: orange if past, gray if future
// Mobile: show only current step label
```

**Step 1 — Personal Info:**
Fields: Full Name, Photo (Cloudinary upload preview), Age (number, min 18), Gender (select), Mobile (E.164 +91), Email (pre-filled from auth, readonly), Address (line1, city, state, pincode)

**Step 2 — Religious Profile:**
Fields: Sampraday (text), Specialization (multi-select from POOJA_CATALOGUE), Years of Experience (number), Languages (checkbox: Hindi, Gujarati, English), Service Areas (tag input — comma separated pincodes/city names, max 10)

**Step 3 — Services & Pricing:**
Dynamic list of pooja services. For each service:
- Pooja (dropdown from POOJA_CATALOGUE)
- Price (number, INR, min 100)
- Duration (number, minutes)
- Description (textarea, max 300 chars)
- Materials list: each row = Item Name + Quantity + Notes (add/remove rows)
- Add another service button (max 12 services)

**Step 4 — Verification:**
Fields: Aadhaar number (masked on display — show only last 4 after entry), Photo with ID document upload, Declaration checkbox

---

### Task 2: Cloudinary Upload (`lib/cloudinary.ts`)

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(file: File, folder: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `panditconnect/${folder}`, resource_type: 'image', transformation: [{ width: 800, quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => { if (err || !result) return reject(err); resolve(result.secure_url) }
    )
    stream.end(buffer)
  })
}

export function validateImageFile(file: File): string | null {
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_MB = 5
  if (!ALLOWED.includes(file.type)) return 'Only JPEG, PNG, WEBP allowed'
  if (file.size > MAX_MB * 1024 * 1024) return `Image must be under ${MAX_MB}MB`
  return null
}
```

---

### Task 3: Server Actions (`actions/pandit.ts`)

```typescript
'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { User } from '@/lib/db/models/User'
import { Pooja } from '@/lib/db/models/Pooja'
import { Material } from '@/lib/db/models/Material'
import { uploadImage, validateImageFile } from '@/lib/cloudinary'
import { z } from 'zod'

// Save draft (any step) — does NOT submit for verification
export async function savePanditDraft(data: Record<string, unknown>) {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }
  await connectDB()
  
  const pandit = await Pandit.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { ...data, verificationStatus: 'pending' } },
    { new: true, runValidators: true }
  )
  if (!pandit) return { error: 'Pandit profile not found' }
  return { success: true }
}

// Upload profile photo
export async function uploadProfilePhoto(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }
  
  const file = formData.get('photo') as File
  if (!file) return { error: 'No file provided' }
  
  const validErr = validateImageFile(file)
  if (validErr) return { error: validErr }
  
  const url = await uploadImage(file, 'profiles').catch(() => null)
  if (!url) return { error: 'Upload failed. Please try again.' }
  
  await connectDB()
  await Pandit.updateOne({ userId: session.user.id }, { profilePhoto: url })
  return { success: true, url }
}

// Submit for verification (Step 4)
const SubmitSchema = z.object({
  aadhaarLast4: z.string().length(4).regex(/^\d+$/),
  declarationAccepted: z.boolean().refine(v => v === true),
})

export async function submitForVerification(formData: unknown) {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }
  
  const parsed = SubmitSchema.safeParse(formData)
  if (!parsed.success) return { error: 'Please complete all required fields' }
  
  await connectDB()
  const pandit = await Pandit.findOne({ userId: session.user.id })
  if (!pandit) return { error: 'Profile not found' }
  
  // Validate minimum required fields before allowing submission
  const required = ['experienceYears', 'sampraday', 'profilePhoto']
  const missing = required.filter(f => !pandit[f as keyof typeof pandit])
  if (missing.length) return { error: `Please complete: ${missing.join(', ')}` }
  
  const services = await Pooja.countDocuments({ panditId: pandit._id, active: true })
  if (services === 0) return { error: 'Add at least one service before submitting' }
  
  await Pandit.updateOne({ _id: pandit._id }, {
    verificationStatus: 'pending',
    aadhaarVerified: false, // set to true only by admin
  })
  
  // Notify admin (fire and forget)
  notifyAdminNewSubmission(session.user.id).catch(console.error)
  
  return { success: true }
}

async function notifyAdminNewSubmission(userId: string) {
  // Resend email to admin — implemented in Phase 9
}

// Save pooja services
export async function savePoojaServices(services: Array<{
  catalogKey: string; name: string; price: number; durationMin: number; description?: string
  materials: Array<{ itemName: string; quantity: string; notes?: string }>
}>) {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'Unauthorized' }
  await connectDB()
  
  const pandit = await Pandit.findOne({ userId: session.user.id })
  if (!pandit) return { error: 'Profile not found' }
  
  // Replace all services (simpler than diff for MVP)
  await Pooja.deleteMany({ panditId: pandit._id })
  
  for (const svc of services.slice(0, 12)) {
    const pooja = await Pooja.create({
      panditId: pandit._id,
      catalogKey: svc.catalogKey,
      name: svc.name,
      price: svc.price,
      durationMin: svc.durationMin,
      description: svc.description || '',
      active: true,
    })
    if (svc.materials?.length) {
      await Material.insertMany(
        svc.materials.map(m => ({ poojaId: pooja._id, itemName: m.itemName, quantity: m.quantity, notes: m.notes }))
      )
    }
  }
  return { success: true }
}
```

---

### Task 4: Admin Verification Queue (`app/(admin)/verification/page.tsx`)

Server component. Shows paginated list of pandits with `verificationStatus: 'pending'`.

**Table columns:** Photo | Name | Sampraday | Experience | Submitted | Actions (Approve / Reject)

```typescript
// API Route: POST /api/admin/verify
// Body: { panditId, action: 'approve' | 'reject', reason?: string }
// Auth: session.user.role === 'admin' — enforced server-side

import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { auth } from '@/lib/auth/config'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  
  const { panditId, action, reason } = await req.json()
  if (!['approve','reject'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  if (action === 'reject' && !reason?.trim()) return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
  
  await connectDB()
  const pandit = await Pandit.findById(panditId).populate('userId')
  if (!pandit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
  const update = action === 'approve'
    ? { verificationStatus: 'verified', aadhaarVerified: true }
    : { verificationStatus: 'rejected', rejectionReason: reason }
  
  await Pandit.updateOne({ _id: panditId }, update)
  
  // Notify pandit
  const user = pandit.userId as any
  const msg = action === 'approve'
    ? 'Congratulations! Your profile is verified and now live on PanditConnect.'
    : `Your verification was not approved. Reason: ${reason}. You may resubmit after making corrections.`
  
  resend.emails.send({
    from: 'PanditConnect <noreply@panditconnect.in>',
    to: user.email,
    subject: action === 'approve' ? 'Profile Verified — PanditConnect' : 'Verification Update — PanditConnect',
    text: msg,
  }).catch(console.error)
  
  return NextResponse.json({ success: true })
}
```

---

### Task 5: Verification Badge Component

```tsx
// components/shared/VerificationBadge.tsx
import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { status: 'pending' | 'verified' | 'rejected'; size?: 'sm' | 'md' }

export function VerificationBadge({ status, size = 'md' }: Props) {
  if (status !== 'verified') return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium bg-green-50 text-green-700',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
    )}>
      <BadgeCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      Verified
    </span>
  )
}
```

---

### Task 6: Draft Save UX Pattern

The multi-step form auto-saves draft to server on step navigation (debounced 1s). Show "Saved" indicator in step footer. On page reload, restore from server. Never lose data.

```tsx
// Pattern: useEffect with debounce on form state change
// Call savePanditDraft(stepData) server action
// Show: "Saving..." → "Saved ✓" status indicator (top-right of form card)
```

---

### Task 7: Acceptance Criteria

- [ ] Incomplete profile saves as Draft but Submit button is disabled with tooltip "Complete all fields"
- [ ] Aadhaar number stored as last-4 only — never full number in DB or UI
- [ ] Identity documents uploaded to Cloudinary `panditconnect/documents/` (private, not public URL)
- [ ] Profile photo uploaded to `panditconnect/profiles/` (public CDN URL)
- [ ] Admin cannot approve without viewing the submission (no bulk approve)
- [ ] Pandit receives email on approval and rejection
- [ ] Rejection requires a reason (min 10 chars) from admin
- [ ] Pandit with `verificationStatus !== 'verified'` does NOT appear in search results
- [ ] Services require at least 1 entry before submission
- [ ] Age validation: min 18, blocks submission otherwise
- [ ] Step indicator works on mobile 375px (abbreviate labels)
- [ ] Upload errors shown inline — never silent failures
