// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Last updated: 2026-06-11T11:05:17.182Z
// Source: local images uploaded via scripts/upload-local-images.ts
// To re-upload: pnpm upload-images

export const GENERATED_IMAGES = {
  "hero": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781160966/panditconnect/landing/hero",
  "howItWorksStep1": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781160969/panditconnect/landing/how-step-1",
  "howItWorksStep2": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175826/panditconnect/landing/how-step-2",
  "howItWorksStep3": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175829/panditconnect/landing/how-step-3",
  "forPandits": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175831/panditconnect/landing/for-pandits",
  "ctaBanner": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175834/panditconnect/landing/cta-banner",
  "poojaSatyanarayan": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175835/panditconnect/poojas/satyanarayan-katha",
  "poojaGrihaPravesh": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781160975/panditconnect/poojas/griha-pravesh",
  "poojaVivahSanskar": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175838/panditconnect/poojas/vivah-sanskar",
  "poojaRudrabhishek": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175839/panditconnect/poojas/rudrabhishek",
  "poojaNavchandiYagna": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175842/panditconnect/poojas/navchandi-yagna",
  "poojaGanesh": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175843/panditconnect/poojas/ganesh-pooja",
  "poojaLakshmi": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175845/panditconnect/poojas/lakshmi-pooja",
  "poojaVastu": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175846/panditconnect/poojas/vastu-pooja",
  "poojaMundan": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175849/panditconnect/poojas/mundan-sanskar",
  "poojaNamekaran": "https://res.cloudinary.com/dlouvxcf1/image/upload/f_auto,q_auto/v1781175850/panditconnect/poojas/namkaran"
} as const

export type GeneratedImageKey = keyof typeof GENERATED_IMAGES

// Pooja catalogue images — keyed by POOJA_CATALOGUE key
export const POOJA_IMAGES: Record<string, string> = {
  'satyanarayan-katha': GENERATED_IMAGES.poojaSatyanarayan ?? '',
  'griha-pravesh': GENERATED_IMAGES.poojaGrihaPravesh ?? '',
  'vivah-sanskar': GENERATED_IMAGES.poojaVivahSanskar ?? '',
  rudrabhishek: GENERATED_IMAGES.poojaRudrabhishek ?? '',
  'navchandi-yagna': GENERATED_IMAGES.poojaNavchandiYagna ?? '',
  'ganesh-pooja': GENERATED_IMAGES.poojaGanesh ?? '',
  'lakshmi-pooja': GENERATED_IMAGES.poojaLakshmi ?? '',
  'vastu-pooja': GENERATED_IMAGES.poojaVastu ?? '',
  'mundan-sanskar': GENERATED_IMAGES.poojaMundan ?? '',
  namkaran: GENERATED_IMAGES.poojaNamekaran ?? '',
}

// Landing page images
export const LANDING_IMAGES = {
  hero: GENERATED_IMAGES.hero ?? '',
  howItWorksStep1: GENERATED_IMAGES.howItWorksStep1 ?? '',
  howItWorksStep2: GENERATED_IMAGES.howItWorksStep2 ?? '',
  howItWorksStep3: GENERATED_IMAGES.howItWorksStep3 ?? '',
  forPandits: GENERATED_IMAGES.forPandits ?? '',
  ctaBanner: GENERATED_IMAGES.ctaBanner ?? '',
}
