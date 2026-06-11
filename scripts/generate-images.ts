/**
 * PanditConnect image generator.
 *
 * Generates contextual imagery via the Google Gemini Imagen API, uploads each
 * result to Cloudinary, and writes the delivery URLs to lib/generated-images.ts.
 *
 * Run all images:      pnpm generate-images
 * Retry a single one:  pnpm generate-images hero
 */
import { v2 as cloudinary } from 'cloudinary'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ─── Config ──────────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// Imagen :predict models require a paid-tier project (403 on this key), so we
// use the Gemini image-generation model via :generateContent instead.
const IMAGE_MODEL = 'gemini-2.5-flash-image'
const DELAY_MS = 3000 // rate-limit pause between API calls

// ─── Image definitions ────────────────────────────────────────────────────────

interface ImageDef {
  key: string
  cloudinaryId: string
  prompt: string
  width: number
  height: number
}

const IMAGES: ImageDef[] = [
  // ── Landing page ─────────────────────────────────────────────────────────
  {
    key: 'hero',
    cloudinaryId: 'panditconnect/landing/hero',
    width: 1920,
    height: 1080,
    prompt: `
      A stunning wide-angle photograph of a traditional Indian Hindu pooja ceremony.
      A Pandit Ji in white dhoti and angavastram sits cross-legged performing a havan (sacred fire ritual).
      Copper kalash vessels, marigold flower garlands, incense smoke curling upward.
      Warm golden diyas (clay oil lamps) arranged in rows, flickering flames.
      A respectful Indian family gathered around in traditional attire — sari, kurta.
      Rich saffron, deep red, golden yellow, and warm amber tones dominate.
      Soft natural light from diyas and sunshine. Shallow depth of field. Temple or home puja room setting.
      Photorealistic, warm, sacred, cinematic quality. No text overlay.
      Shot as if by a professional photographer covering a religious event.
    `.trim(),
  },
  {
    key: 'howItWorksStep1',
    cloudinaryId: 'panditconnect/landing/how-step-1',
    width: 800,
    height: 600,
    prompt: `
      A close-up photograph of Indian hands — a woman in colorful bangles and sari —
      holding a modern smartphone. The screen shows a search interface.
      The background is softly blurred, warm tones — a home puja room with diyas visible.
      Natural indoor lighting, warm golden hour feel.
      Photorealistic. No text visible on phone screen. Clean, modern, aspirational.
    `.trim(),
  },
  {
    key: 'howItWorksStep2',
    cloudinaryId: 'panditconnect/landing/how-step-2',
    width: 800,
    height: 600,
    prompt: `
      A flat-lay photograph on a warm wooden surface showing:
      A smartphone with a calendar/booking confirmation screen.
      A small notebook with a pen. A single marigold flower placed decoratively.
      A clay diya (oil lamp) in the corner.
      Warm, soft natural light. Saffron and golden tones.
      Clean, minimal, auspicious atmosphere. Photorealistic. No readable text.
    `.trim(),
  },
  {
    key: 'howItWorksStep3',
    cloudinaryId: 'panditconnect/landing/how-step-3',
    width: 800,
    height: 600,
    prompt: `
      A heartwarming photograph of a completed Indian pooja ceremony.
      A Pandit Ji in white dhoti and sacred thread blesses a smiling Indian family.
      Parents with young children seated on the floor around a decorated puja thali.
      Marigold garlands, flowers, copper vessels, fruits as prasad.
      Warm candlelight and diya flames. Joyful, peaceful, sacred atmosphere.
      Photorealistic. Saffron, gold, and white tones. Traditional Indian home setting.
    `.trim(),
  },
  {
    key: 'forPandits',
    cloudinaryId: 'panditconnect/landing/for-pandits',
    width: 600,
    height: 600,
    prompt: `
      A dignified portrait photograph of a traditional Indian Pandit Ji.
      He wears a white dhoti, sacred thread (janeu), and has tilak on forehead.
      He sits in front of a small puja setup with a lit diya, copper kalash, and flowers.
      He is looking slightly off-camera with a warm, confident expression.
      Soft natural light. Saffron and golden background tones. Temple or home puja room.
      Photorealistic. Respectful, professional, approachable. No text.
    `.trim(),
  },
  {
    key: 'ctaBanner',
    cloudinaryId: 'panditconnect/landing/cta-banner',
    width: 1920,
    height: 600,
    prompt: `
      A wide-angle photograph of a beautifully decorated Indian temple exterior at golden hour.
      The temple has traditional architecture with spires (shikhara), intricate carvings.
      Warm golden sunlight bathes the stone. Marigold garlands adorn the entrance.
      A few devotees in traditional attire visible entering respectfully.
      Rich saffron, amber, and gold tones. Majestic, spiritual, inviting atmosphere.
      Photorealistic. No text. Suitable as a wide banner background image.
    `.trim(),
  },

  // ── Pooja catalogue cards ─────────────────────────────────────────────────
  {
    key: 'poojaSatyanarayan',
    cloudinaryId: 'panditconnect/poojas/satyanarayan-katha',
    width: 600,
    height: 400,
    prompt: `
      Close-up photograph of a Satyanarayan Katha puja setup.
      A decorated puja thali with banana leaves, fruits (banana, coconut), panchamrit in a copper bowl.
      Marigold flowers, tulsi leaves, kumkum (red powder), and haldi arranged neatly.
      A lit brass diya in center. Sacred books (katha book) visible.
      Warm golden light, saffron cloth as base. Photorealistic, vibrant, auspicious.
    `.trim(),
  },
  {
    key: 'poojaGrihaPravesh',
    cloudinaryId: 'panditconnect/poojas/griha-pravesh',
    width: 600,
    height: 400,
    prompt: `
      A photograph of a traditional Indian Griha Pravesh (housewarming) ceremony.
      A decorated threshold (door entrance) of a new home with marigold toran (door hanging).
      A clay pot (kalash) with mango leaves and coconut placed at the entrance.
      Kolam/rangoli design on the floor in bright colors. Lit diyas on both sides of door.
      A family about to enter. Festive, auspicious, warm atmosphere. Photorealistic.
    `.trim(),
  },
  {
    key: 'poojaVivahSanskar',
    cloudinaryId: 'panditconnect/poojas/vivah-sanskar',
    width: 600,
    height: 400,
    prompt: `
      A beautiful photograph of a traditional Hindu wedding (Vivah Sanskar) ceremony.
      The bride and groom in traditional Indian wedding attire sit around the sacred havan fire.
      The Pandit performs the ritual. Flower mandap decorated with marigold and roses.
      Sacred fire (agni) with smoke rising. Wedding garlands. Deep red, gold and orange tones.
      Photorealistic. Joyful, sacred, ornate. No faces required — focus on ceremony setup.
    `.trim(),
  },
  {
    key: 'poojaRudrabhishek',
    cloudinaryId: 'panditconnect/poojas/rudrabhishek',
    width: 600,
    height: 400,
    prompt: `
      A photograph of a Rudrabhishek ceremony — ritual bathing of a Shiva lingam.
      A black stone Shiva lingam decorated with bilva (bel) leaves, white flowers, rudraksha.
      Milk and holy water being poured. Copper vessels around. A lit diya nearby.
      Sacred atmosphere with incense smoke. Deep green, black, white and gold tones.
      Photorealistic. Traditional, devotional, serene.
    `.trim(),
  },
  {
    key: 'poojaNavchandiYagna',
    cloudinaryId: 'panditconnect/poojas/navchandi-yagna',
    width: 600,
    height: 400,
    prompt: `
      A photograph of a Havan/Yagna ceremony with a sacred fire (agni).
      A large havan kund (fire altar) with bright orange and yellow flames.
      A Pandit pouring ghee into the fire with a long wooden ladle (sruk).
      Smoke rising upward. Flowers and offerings around the kund. Copper vessels.
      Warm orange, saffron and gold tones. Dramatic, sacred. Photorealistic.
    `.trim(),
  },
  {
    key: 'poojaGanesh',
    cloudinaryId: 'panditconnect/poojas/ganesh-pooja',
    width: 600,
    height: 400,
    prompt: `
      A beautiful photograph of a Ganesh Pooja setup.
      A beautifully decorated clay Ganesh idol (Ganpati) surrounded by marigold flowers.
      Modak (sweet offering) arranged in front. Durva grass, kumkum, haldi.
      Lit diyas on both sides. Colorful rangoli around the base.
      Warm, festive, joyful. Orange, yellow and red tones. Photorealistic.
    `.trim(),
  },
  {
    key: 'poojaLakshmi',
    cloudinaryId: 'panditconnect/poojas/lakshmi-pooja',
    width: 600,
    height: 400,
    prompt: `
      A photograph of a Lakshmi Pooja setup during Diwali.
      A Lakshmi idol decorated with flowers and jewelry on a red cloth.
      Rows of lit clay diyas (oil lamps) arranged in front creating a warm glow.
      Lotus flowers, coins, and kumkum powder. Gold and red decoration.
      Warm candlelight. Festive, auspicious, golden atmosphere. Photorealistic.
    `.trim(),
  },
  {
    key: 'poojaVastu',
    cloudinaryId: 'panditconnect/poojas/vastu-pooja',
    width: 600,
    height: 400,
    prompt: `
      A photograph of a Vastu Pooja (home blessing) ceremony.
      A Pandit performs rituals in a new empty home with marble/tile floors.
      A puja thali with coconut, kumkum, turmeric, flowers placed in center of the room.
      Marigold garlands at the entrance. Sunlight streaming through windows.
      Clean, auspicious, hopeful atmosphere. Warm tones. Photorealistic.
    `.trim(),
  },
  {
    key: 'poojaMundan',
    cloudinaryId: 'panditconnect/poojas/mundan-sanskar',
    width: 600,
    height: 400,
    prompt: `
      A warm, tender photograph of a Mundan Sanskar (first haircut ceremony).
      A toddler boy in traditional Indian clothes sits on his mother's lap.
      A Pandit Ji performs rituals around them with a puja thali visible.
      Marigold flowers and blessings. Family members smiling gently around.
      Soft indoor light. Saffron cloth and copper kalash visible.
      Loving, sacred, joyful atmosphere. Photorealistic.
    `.trim(),
  },
  {
    key: 'poojaNamekaran',
    cloudinaryId: 'panditconnect/poojas/namkaran',
    width: 600,
    height: 400,
    prompt: `
      A warm photograph of a Namkaran (naming ceremony) for a newborn baby.
      A newborn baby in traditional Indian clothes lies on a decorated cloth.
      A Pandit whispers the name in the baby's ear while family watches.
      Marigold flowers, a small puja thali, diya. Grandparents and parents present.
      Soft warm light. Tender, auspicious, family-centered. Photorealistic.
    `.trim(),
  },
]

// ─── Gemini Imagen API call ───────────────────────────────────────────────────

async function generateImage(imageDef: ImageDef): Promise<Buffer> {
  console.log(`\n[gen] Generating: ${imageDef.key}...`)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: imageDef.prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: getAspectRatio(imageDef.width, imageDef.height) },
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error for ${imageDef.key}: ${response.status} — ${error}`)
  }

  const data = await response.json()
  const parts: Array<{ inlineData?: { data?: string } }> = data.candidates?.[0]?.content?.parts ?? []
  const base64Image = parts.find((p) => p.inlineData?.data)?.inlineData?.data

  if (!base64Image) {
    throw new Error(`No image returned for ${imageDef.key}. Response: ${JSON.stringify(data).slice(0, 600)}`)
  }

  return Buffer.from(base64Image, 'base64')
}

function getAspectRatio(width: number, height: number): string {
  const ratio = width / height
  if (ratio >= 1.9) return '16:9'
  if (ratio >= 1.4) return '4:3'
  if (ratio >= 0.9) return '1:1'
  if (ratio >= 0.6) return '3:4'
  return '9:16'
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'))
        console.log(`  [ok] Uploaded to Cloudinary: ${result.secure_url}`)
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

// ─── Output file ──────────────────────────────────────────────────────────────

const OUTPUT_PATH = path.join(process.cwd(), 'lib', 'generated-images.ts')

/** URLs from a previous run, so single-image retries don't wipe the rest. */
function loadExistingResults(): Record<string, string> {
  if (!fs.existsSync(OUTPUT_PATH)) return {}
  const source = fs.readFileSync(OUTPUT_PATH, 'utf8')
  const match = source.match(/export const GENERATED_IMAGES = (\{[\s\S]*?\}) as const/)
  if (!match) return {}
  try {
    return JSON.parse(match[1])
  } catch {
    return {}
  }
}

function writeOutput(results: Record<string, string>) {
  // Always emit every key (empty string when not yet generated) so the
  // app's fallback logic and TypeScript types stay stable.
  const complete: Record<string, string> = {}
  for (const def of IMAGES) complete[def.key] = results[def.key] ?? ''
  results = complete

  const timestamp = new Date().toISOString()
  const fileContent = `// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Generated: ${timestamp}
// Source: scripts/generate-images.ts using Gemini Imagen API
// To regenerate: pnpm generate-images

export const GENERATED_IMAGES = ${JSON.stringify(results, null, 2)} as const

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
`
  fs.writeFileSync(OUTPUT_PATH, fileContent)
  console.log(`\n[out] Saved image URLs to: lib/generated-images.ts`)
}

// ─── Main runner ──────────────────────────────────────────────────────────────

async function main() {
  console.log('PanditConnect Image Generator')
  console.log('====================================')

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in .env.local — aborting.')
    process.exit(1)
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Cloudinary credentials are not set in .env.local — aborting.')
    process.exit(1)
  }

  // Optional CLI arg regenerates a single image: pnpm generate-images hero
  const targetKey = process.argv[2]
  const imagesToGenerate = targetKey ? IMAGES.filter((i) => i.key === targetKey) : IMAGES
  if (targetKey && imagesToGenerate.length === 0) {
    console.error(`Unknown image key "${targetKey}". Valid keys: ${IMAGES.map((i) => i.key).join(', ')}`)
    process.exit(1)
  }

  console.log(`Generating ${imagesToGenerate.length} image(s) using Gemini Imagen API...\n`)

  const results: Record<string, string> = loadExistingResults()
  const failed: string[] = []

  for (const imageDef of imagesToGenerate) {
    try {
      const imageBuffer = await generateImage(imageDef)
      const url = await uploadToCloudinary(imageBuffer, imageDef.cloudinaryId)
      results[imageDef.key] = url
      await new Promise((r) => setTimeout(r, DELAY_MS))
    } catch (err) {
      console.error(`  [fail] ${imageDef.key}:`, err instanceof Error ? err.message : err)
      failed.push(imageDef.key)
    }
  }

  writeOutput(results)

  console.log('\n====================================')
  console.log(`Generated this run: ${imagesToGenerate.length - failed.length} / ${imagesToGenerate.length}`)
  if (failed.length > 0) {
    console.log(`Failed: ${failed.join(', ')}`)
    console.log('Re-run "pnpm generate-images <key>" to retry a failed image.')
    process.exitCode = 1
  }
  console.log('====================================\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
