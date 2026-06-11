// Serializable DTOs passed from the Pandit-dashboard server pages to client components.
// Kept separate from actions/* so client components can import the types without
// pulling a 'use server' module's runtime exports.

export interface BookingSummaryDTO {
  _id: string
  customerName: string
  poojaName: string
  price: number
  durationMin: number
  scheduledAt: string
  address: { line1: string; city: string; state: string; pincode: string }
  status: string
  expiresAt: string
}

export interface BookingDetailDTO extends BookingSummaryDTO {
  customerEmail: string
  customerPhone: string
  createdAt: string
  respondedAt?: string
  cancellation?: { reason: string; at: string }
}

export interface OverviewStatsDTO {
  totalCompleted: number
  thisMonthCompleted: number
  pendingRequests: number
  avgRating: number
  ratingCount: number
  responseRate: number
}

export interface MonthCountDTO {
  monthIndex: number
  count: number
}

export interface RevenueStatsDTO {
  total: number
  thisMonth: number
  monthGrowth: number | null
  totalCompleted: number
  avgValue: number
}

export interface RevenueRowDTO {
  _id: string
  customerName: string
  poojaName: string
  price: number
  completedAt: string
}

export interface ServiceDTO {
  _id: string
  catalogKey: string
  name: string
  price: number
  durationMin: number
  description: string
  active: boolean
}

export interface ReviewStatsDTO {
  avg: number
  count: number
  ritualKnowledge: number
  punctuality: number
  behaviour: number
  communication: number
}

export interface ReviewDTO {
  _id: string
  customerName: string
  poojaName: string
  overall: number
  ritualKnowledge?: number
  punctuality?: number
  behaviour?: number
  communication?: number
  comment?: string
  createdAt: string
  panditReply?: { text: string; at: string }
  status: string
}

// ---------- Customer dashboard ----------

export interface CustomerStatsDTO {
  total: number
  upcoming: number
  completed: number
  pendingReviews: number
}

export interface CustomerBookingDTO {
  _id: string
  panditName: string
  poojaName: string
  price: number
  scheduledAt: string
  status: string
  hasReview: boolean
}

export interface CustomerBookingDetailDTO extends CustomerBookingDTO {
  panditId: string
  sampraday: string
  experienceYears: number
  address: { line1: string; city: string; state: string; pincode: string }
  cancellation: { byRole: 'you' | 'pandit'; reason: string; at: string } | null
  timestamps: {
    requested: string
    responded: string | null
    completed: string | null
  }
}

export interface SuggestedPanditDTO {
  _id: string
  name: string
  ratingAvg: number
  ratingCount: number
  verificationStatus: string
  specialization: string[]
  languages: string[]
}

export interface PanditSearchResultDTO extends SuggestedPanditDTO {
  experienceYears: number
  serviceAreas: string[]
  startingPrice: number
  matchedPoojas: string[]
}

export interface CustomerReviewDTO {
  _id: string
  bookingId: string
  panditName: string
  poojaName: string
  overall: number
  ritualKnowledge?: number
  punctuality?: number
  behaviour?: number
  communication?: number
  comment?: string
  createdAt: string
  scheduledAt: string
  panditReply: { text: string; at: string } | null
}

export interface BookingForReviewDTO {
  _id: string
  panditName: string
  poojaName: string
  scheduledAt: string
  status: string
  hasReview: boolean
}

export interface CustomerSettingsDTO {
  name: string
  email: string
  phone: string
  preferredLanguage: string
  hasPassword: boolean
  address: { line1: string; city: string; state: string; pincode: string }
  memberSince: string
  status: string
}

// Public pandit profile (/pandit/[id]) — visible to logged-out visitors.
export interface PublicPanditProfileDTO {
  _id: string
  name: string
  bio: string
  sampraday: string
  experienceYears: number
  languages: string[]
  serviceAreas: string[]
  specialization: string[]
  verificationStatus: string
  ratingAvg: number
  ratingCount: number
  completedBookings: number
  services: { _id: string; name: string; price: number; durationMin: number; description: string }[]
  reviews: { _id: string; customerName: string; overall: number; comment: string; createdAt: string }[]
}

export interface PanditProfileSummaryDTO {
  name: string
  email: string
  phone: string
  profilePhoto: string
  bio: string
  sampraday: string
  specialization: string[]
  languages: string[]
  serviceAreas: string[]
  experienceYears: number
  address?: { line1?: string; city?: string; state?: string; pincode?: string }
  verificationStatus: string
  rejectionReason?: string
  hasIdDocument: boolean
  servicesCount: number
  ratingAvg: number
  ratingCount: number
}
