export type Role = 'customer' | 'pandit' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type BookingStatus = 'requested' | 'confirmed' | 'declined' | 'expired' | 'cancelled' | 'completed'
export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'removed'
export type Language = 'hi' | 'gu' | 'en'
export type UserStatus = 'active' | 'pending' | 'suspended' | 'deleted'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export interface Address {
  line1: string
  city: string
  state: string
  pincode: string
}

export interface IUser {
  _id: string
  role: Role
  name: string
  email: string
  phone: string
  preferredLanguage: Language
  status: UserStatus
  emailVerified: boolean
  phoneVerified: boolean
  address?: Address
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IPandit {
  _id: string
  userId: string
  age?: number
  gender?: Gender
  address?: Address
  experienceYears: number
  sampraday: string
  specialization: string[]
  languages: Language[]
  serviceAreas: string[]
  profilePhoto: string
  idDocumentUrl?: string
  aadhaarLast4?: string
  bio: string
  verificationStatus: VerificationStatus
  rejectionReason?: string
  submittedAt?: Date
  ratingAvg: number
  ratingCount: number
  ratingWeighted: number
  responseRate: number
  completedBookings: number
  lastActiveAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface IPooja {
  _id: string
  panditId: string
  catalogKey: string
  name: string
  description: string
  price: number
  durationMin: number
  active: boolean
}

export interface IMaterial {
  _id: string
  poojaId: string
  itemName: string
  quantity: string
  notes?: string
}

export interface IBooking {
  _id: string
  customerId: string
  panditId: string
  poojaId: string
  scheduledAt: Date
  timezone: string
  address: { line1: string; city: string; state: string; pincode: string }
  status: BookingStatus
  cancellation?: { by: string; reason: string; at: Date }
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IReview {
  _id: string
  bookingId: string
  customerId: string
  panditId: string
  overall: number
  ritualKnowledge?: number
  punctuality?: number
  behaviour?: number
  communication?: number
  comment?: string
  photoUrl?: string
  status: ReviewStatus
  panditReply?: { text: string; at: Date }
  createdAt: Date
  updatedAt: Date
}

export interface IPayment {
  _id: string
  bookingId: string
  customerId: string
  panditId: string
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

export const POOJA_CATALOGUE = [
  { key: 'satyanarayan-katha', name: 'Satyanarayan Katha' },
  { key: 'griha-pravesh', name: 'Griha Pravesh' },
  { key: 'vivah-sanskar', name: 'Vivah Sanskar' },
  { key: 'rudrabhishek', name: 'Rudrabhishek' },
  { key: 'navchandi-yagna', name: 'Navchandi Yagna' },
  { key: 'ganesh-pooja', name: 'Ganesh Pooja' },
  { key: 'lakshmi-pooja', name: 'Lakshmi Pooja' },
  { key: 'vastu-pooja', name: 'Vastu Pooja' },
  { key: 'mundan-sanskar', name: 'Mundan Sanskar' },
  { key: 'namkaran', name: 'Naming Ceremony (Namkaran)' },
] as const

export type PoojaCatalogueKey = (typeof POOJA_CATALOGUE)[number]['key']

// All 28 states + 8 union territories, alphabetical.
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const
