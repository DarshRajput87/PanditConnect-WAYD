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

export interface MaterialDTO {
  _id: string
  itemName: string
  quantity: string
  notes?: string
}

export interface ServiceDTO {
  _id: string
  catalogKey: string
  name: string
  price: number
  durationMin: number
  description: string
  active: boolean
  materials: MaterialDTO[]
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

export interface BookingPaymentDTO {
  method: 'cash' | 'razorpay'
  status: string // pending | paid | refunded | failed
  amount: number // rupees
}

export interface CustomerBookingDetailDTO extends CustomerBookingDTO {
  panditId: string
  sampraday: string
  experienceYears: number
  address: { line1: string; city: string; state: string; pincode: string }
  cancellation: { byRole: 'you' | 'pandit'; reason: string; at: string } | null
  payment: BookingPaymentDTO | null
  timestamps: {
    requested: string
    responded: string | null
    completed: string | null
  }
}

// Post-booking confirmation page (/booking-confirmed/[id]).
export interface BookingConfirmedDTO {
  _id: string
  panditName: string
  poojaName: string
  scheduledAt: string
  address: { line1: string; city: string; state: string; pincode: string }
  price: number
  paymentMethod: 'cash' | 'razorpay'
  paymentStatus: string
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
export interface PublicServiceDTO {
  _id: string
  name: string
  price: number
  durationMin: number
  description: string
  materials: { itemName: string; quantity: string; notes?: string }[]
}

export interface PublicReviewDTO {
  _id: string
  customerName: string
  overall: number
  ritualKnowledge?: number
  punctuality?: number
  behaviour?: number
  communication?: number
  comment: string
  createdAt: string
  panditReply: { text: string; at: string } | null
}

export interface PublicReviewStatsDTO {
  // dist[0] = count of 1★ reviews … dist[4] = count of 5★
  dist: number[]
  ritualKnowledge: number
  punctuality: number
  behaviour: number
  communication: number
}

export interface PublicPanditProfileDTO {
  _id: string
  name: string
  profilePhoto: string
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
  services: PublicServiceDTO[]
  reviews: PublicReviewDTO[]
  reviewStats: PublicReviewStatsDTO
}

// Pandit calendar (/dashboard/pandit/calendar) DTOs.
export interface CalendarBookingDTO {
  _id: string
  scheduledAt: string
  status: string
  customerName: string
  poojaName: string
  durationMin: number
  price: number
  city: string
}

export interface PanditAvailabilityDTO {
  workingDays: number[] // 0=Sun … 6=Sat
  workingHoursStart: string // 'HH:mm' IST
  workingHoursEnd: string
  maxPerDay: number | null
  blockedDates: string[] // 'YYYY-MM-DD' IST
}

// Booking wizard (/book/[panditId]) DTOs.
export interface BookPanditDTO {
  _id: string
  name: string
  profilePhoto: string
  sampraday: string
  experienceYears: number
  ratingAvg: number
  ratingCount: number
  serviceAreas: string[]
}

export interface BookPoojaDTO {
  _id: string
  name: string
  price: number
  durationMin: number
  catalogKey: string
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
