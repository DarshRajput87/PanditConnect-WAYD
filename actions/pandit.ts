'use server'
import { auth } from '@/lib/auth/config'
import { connectDB } from '@/lib/db/connect'
import { Pandit } from '@/lib/db/models/Pandit'
import { User } from '@/lib/db/models/User'
import { Pooja } from '@/lib/db/models/Pooja'
import { Material } from '@/lib/db/models/Material'
import { uploadImage, validateImageFile, isCloudinaryConfigured } from '@/lib/cloudinary'
import { PanditDraftSchema, ServicesSchema, SubmitSchema } from '@/lib/validators/pandit'
import type { Address, Gender, Language, VerificationStatus } from '@/types'

type SimpleResult = { success: true } | { error: string }
type UploadResult = { success: true; url: string } | { error: string }
type SubmitResult = { success: true } | { error: string; missing?: string[] }

// ---- DTOs returned to the client (plain, serializable) ----
export interface PanditServiceDraft {
  catalogKey: string
  name: string
  price: number
  durationMin: number
  description: string
  materials: { itemName: string; quantity: string; notes?: string }[]
}

export interface PanditOnboardingData {
  email: string
  name: string
  phone: string
  profile: {
    age?: number
    gender?: Gender
    address?: Address
    sampraday: string
    specialization: string[]
    languages: Language[]
    serviceAreas: string[]
    experienceYears: number
    bio: string
    profilePhoto: string
    idDocumentUrl: string
    aadhaarLast4: string
    verificationStatus: VerificationStatus
    rejectionReason?: string
  }
  services: PanditServiceDraft[]
}

export async function getMyPanditProfile(): Promise<PanditOnboardingData | null> {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return null
  await connectDB()

  const [user, pandit] = await Promise.all([
    User.findById(session.user.id).lean(),
    Pandit.findOne({ userId: session.user.id }).lean(),
  ])
  if (!user || !pandit) return null

  const poojas = await Pooja.find({ panditId: pandit._id }).lean()
  const services: PanditServiceDraft[] = await Promise.all(
    poojas.map(async (p) => {
      const mats = await Material.find({ poojaId: p._id }).lean()
      return {
        catalogKey: p.catalogKey,
        name: p.name,
        price: p.price,
        durationMin: p.durationMin,
        description: p.description ?? '',
        materials: mats.map((m) => ({
          itemName: m.itemName,
          quantity: m.quantity,
          notes: m.notes ?? undefined,
        })),
      }
    })
  )

  return {
    email: user.email,
    name: user.name,
    phone: user.phone,
    profile: {
      age: pandit.age,
      gender: pandit.gender,
      address: pandit.address,
      sampraday: pandit.sampraday ?? '',
      specialization: pandit.specialization ?? [],
      languages: pandit.languages ?? [],
      serviceAreas: pandit.serviceAreas ?? [],
      experienceYears: pandit.experienceYears ?? 0,
      bio: pandit.bio ?? '',
      profilePhoto: pandit.profilePhoto ?? '',
      idDocumentUrl: pandit.idDocumentUrl ?? '',
      aadhaarLast4: pandit.aadhaarLast4 ?? '',
      verificationStatus: pandit.verificationStatus,
      rejectionReason: pandit.rejectionReason,
    },
    services,
  }
}

// Save draft (any step) — does NOT submit for verification.
// Only whitelisted fields (via PanditDraftSchema) are ever written.
export async function savePanditDraft(data: unknown): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'unauthorized' }

  const parsed = PanditDraftSchema.safeParse(data)
  if (!parsed.success) return { error: 'invalid' }

  await connectDB()
  const { name, ...panditFields } = parsed.data

  if (name) await User.updateOne({ _id: session.user.id }, { name })

  const update = Object.fromEntries(
    Object.entries(panditFields).filter(([, v]) => v !== undefined)
  )

  if (Object.keys(update).length > 0) {
    const pandit = await Pandit.findOneAndUpdate(
      { userId: session.user.id },
      { $set: update },
      { new: true, runValidators: true }
    )
    if (!pandit) return { error: 'notfound' }
  } else {
    const exists = await Pandit.exists({ userId: session.user.id })
    if (!exists) return { error: 'notfound' }
  }

  return { success: true }
}

export async function uploadProfilePhoto(formData: FormData): Promise<UploadResult> {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'unauthorized' }
  if (!isCloudinaryConfigured()) return { error: 'not_configured' }

  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) return { error: 'no_file' }

  const validErr = validateImageFile(file)
  if (validErr) return { error: validErr }

  const url = await uploadImage(file, 'profiles').catch(() => null)
  if (!url) return { error: 'upload_failed' }

  await connectDB()
  await Pandit.updateOne({ userId: session.user.id }, { profilePhoto: url })
  return { success: true, url }
}

export async function uploadIdDocument(formData: FormData): Promise<UploadResult> {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'unauthorized' }
  if (!isCloudinaryConfigured()) return { error: 'not_configured' }

  const file = formData.get('document')
  if (!(file instanceof File) || file.size === 0) return { error: 'no_file' }

  const validErr = validateImageFile(file)
  if (validErr) return { error: validErr }

  // Identity documents use authenticated (private) delivery.
  const url = await uploadImage(file, 'documents', { private: true }).catch(() => null)
  if (!url) return { error: 'upload_failed' }

  await connectDB()
  await Pandit.updateOne({ userId: session.user.id }, { idDocumentUrl: url })
  return { success: true, url }
}

export async function savePoojaServices(servicesInput: unknown): Promise<SimpleResult> {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'unauthorized' }

  const parsed = ServicesSchema.safeParse(servicesInput)
  if (!parsed.success) return { error: 'invalid' }

  await connectDB()
  const pandit = await Pandit.findOne({ userId: session.user.id })
  if (!pandit) return { error: 'notfound' }

  // Replace all services (simpler than diffing for the MVP).
  const existing = await Pooja.find({ panditId: pandit._id }).select('_id').lean()
  if (existing.length) {
    await Material.deleteMany({ poojaId: { $in: existing.map((e) => e._id) } })
    await Pooja.deleteMany({ panditId: pandit._id })
  }

  for (const svc of parsed.data.slice(0, 12)) {
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
        svc.materials.map((m) => ({
          poojaId: pooja._id,
          itemName: m.itemName,
          quantity: m.quantity,
          notes: m.notes,
        }))
      )
    }
  }
  return { success: true }
}

export async function submitForVerification(formData: unknown): Promise<SubmitResult> {
  const session = await auth()
  if (!session || session.user.role !== 'pandit') return { error: 'unauthorized' }

  const parsed = SubmitSchema.safeParse(formData)
  if (!parsed.success) return { error: 'incomplete', missing: ['verification'] }

  await connectDB()
  const pandit = await Pandit.findOne({ userId: session.user.id })
  if (!pandit) return { error: 'notfound' }

  const missing: string[] = []
  if (!pandit.profilePhoto) missing.push('profilePhoto')
  if (!pandit.sampraday?.trim()) missing.push('sampraday')
  if (!pandit.age || pandit.age < 18) missing.push('age')
  if (!pandit.gender) missing.push('gender')
  const addr = pandit.address
  if (!addr?.line1 || !addr?.city || !addr?.state || !addr?.pincode) missing.push('address')
  if (!pandit.languages?.length) missing.push('languages')
  if (!pandit.specialization?.length) missing.push('specialization')

  const services = await Pooja.countDocuments({ panditId: pandit._id, active: true })
  if (services === 0) missing.push('services')

  if (missing.length) return { error: 'incomplete', missing }

  await Pandit.updateOne(
    { _id: pandit._id },
    {
      $set: {
        aadhaarLast4: parsed.data.aadhaarLast4,
        verificationStatus: 'pending',
        aadhaarVerified: false, // only an admin sets this true
        submittedAt: new Date(),
      },
      $unset: { rejectionReason: 1 }, // clear any prior rejection on resubmit
    }
  )

  notifyAdminNewSubmission(session.user.id).catch(console.error)
  return { success: true }
}

async function notifyAdminNewSubmission(_userId: string) {
  // Resend email to admin — implemented in Phase 9.
}
