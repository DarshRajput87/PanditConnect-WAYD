import type { Address, Gender, Language } from '@/types'
import type { PanditOnboardingData } from '@/actions/pandit'

export interface MaterialRow {
  itemName: string
  quantity: string
  notes: string
}

export interface ServiceRow {
  catalogKey: string
  name: string
  price: string
  durationMin: string
  description: string
  materials: MaterialRow[]
}

export interface WizardState {
  name: string
  age: string
  gender: Gender | ''
  address: Address
  profilePhoto: string
  sampraday: string
  specialization: string[]
  languages: Language[]
  serviceAreas: string[]
  experienceYears: string
  bio: string
  services: ServiceRow[]
  // Full Aadhaar is held only in client memory for entry/validation; never persisted
  // or sent to the server. Only `aadhaarLast4` (derived) is ever transmitted.
  aadhaarFull: string
  aadhaarLast4: string
  idDocumentUrl: string
  declarationAccepted: boolean
}

export function emptyService(): ServiceRow {
  return { catalogKey: '', name: '', price: '', durationMin: '', description: '', materials: [] }
}

export function stateFromData(data: PanditOnboardingData): WizardState {
  const a = data.profile.address
  return {
    name: data.name,
    age: data.profile.age ? String(data.profile.age) : '',
    gender: data.profile.gender ?? '',
    address: {
      line1: a?.line1 ?? '',
      city: a?.city ?? '',
      state: a?.state ?? '',
      pincode: a?.pincode ?? '',
    },
    profilePhoto: data.profile.profilePhoto,
    sampraday: data.profile.sampraday,
    specialization: data.profile.specialization,
    languages: data.profile.languages,
    serviceAreas: data.profile.serviceAreas,
    experienceYears: data.profile.experienceYears ? String(data.profile.experienceYears) : '',
    bio: data.profile.bio,
    services: data.services.length
      ? data.services.map((s) => ({
          catalogKey: s.catalogKey,
          name: s.name,
          price: String(s.price),
          durationMin: String(s.durationMin),
          description: s.description,
          materials: s.materials.map((m) => ({
            itemName: m.itemName,
            quantity: m.quantity,
            notes: m.notes ?? '',
          })),
        }))
      : [emptyService()],
    aadhaarFull: '',
    aadhaarLast4: data.profile.aadhaarLast4,
    idDocumentUrl: data.profile.idDocumentUrl,
    declarationAccepted: false,
  }
}

function toIntOrUndefined(value: string): number | undefined {
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? undefined : n
}

/** Profile fields for savePanditDraft (the server whitelists & validates). */
export function profileDraftPayload(state: WizardState) {
  return {
    name: state.name || undefined,
    age: toIntOrUndefined(state.age),
    gender: state.gender || undefined,
    address: state.address,
    sampraday: state.sampraday || undefined,
    specialization: state.specialization,
    languages: state.languages,
    serviceAreas: state.serviceAreas,
    experienceYears: toIntOrUndefined(state.experienceYears),
    bio: state.bio || undefined,
  }
}

/** Service rows for savePoojaServices. */
export function servicesPayload(state: WizardState) {
  return state.services.map((s) => ({
    catalogKey: s.catalogKey,
    name: s.name,
    price: Number(s.price),
    durationMin: Number(s.durationMin),
    description: s.description || undefined,
    materials: s.materials
      .filter((m) => m.itemName.trim() && m.quantity.trim())
      .map((m) => ({ itemName: m.itemName.trim(), quantity: m.quantity.trim(), notes: m.notes || undefined })),
  }))
}

/** A service row is complete enough to persist. */
export function isServiceComplete(s: ServiceRow): boolean {
  return Boolean(s.catalogKey) && Boolean(s.name.trim()) && Number(s.price) >= 100 && Number(s.durationMin) >= 15
}
