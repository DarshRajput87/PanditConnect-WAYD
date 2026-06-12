// Uploads the locally generated images (UI Design/images) to Cloudinary and
// rewrites lib/generated-images.ts with the resulting delivery URLs.
// Run with: pnpm upload-images

import { v2 as cloudinary } from 'cloudinary'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const IMAGES_FOLDER = path.join(process.cwd(), 'UI Design', 'images')

interface ImageMapping {
  key: string // key in GENERATED_IMAGES
  localName: string // filename in the images folder (without extension)
  cloudinaryId: string // Cloudinary public_id
}

const IMAGE_MAPPINGS: ImageMapping[] = [
  // Landing page
  { key: 'hero', localName: 'Hero Banner', cloudinaryId: 'panditconnect/landing/hero' },
  { key: 'howItWorksStep1', localName: 'How It Works Step 1', cloudinaryId: 'panditconnect/landing/how-step-1' },
  { key: 'howItWorksStep2', localName: 'How It Works Step 2', cloudinaryId: 'panditconnect/landing/how-step-2' },
  { key: 'howItWorksStep3', localName: 'How It Works Step 3', cloudinaryId: 'panditconnect/landing/how-step-3' },
  { key: 'forPandits', localName: 'For Pandits', cloudinaryId: 'panditconnect/landing/for-pandits' },
  { key: 'ctaBanner', localName: 'CTA Banner', cloudinaryId: 'panditconnect/landing/cta-banner' },

  // Pooja catalogue
  { key: 'poojaSatyanarayan', localName: 'Satyanarayan Katha', cloudinaryId: 'panditconnect/poojas/satyanarayan-katha' },
  { key: 'poojaGrihaPravesh', localName: 'Griha Pravesh', cloudinaryId: 'panditconnect/poojas/griha-pravesh' },
  { key: 'poojaVivahSanskar', localName: 'Vivah Sanskar', cloudinaryId: 'panditconnect/poojas/vivah-sanskar' },
  { key: 'poojaRudrabhishek', localName: 'Rudrabhishek', cloudinaryId: 'panditconnect/poojas/rudrabhishek' },
  { key: 'poojaNavchandiYagna', localName: 'Navchandi Yagna', cloudinaryId: 'panditconnect/poojas/navchandi-yagna' },
  { key: 'poojaGanesh', localName: 'Ganesh Pooja', cloudinaryId: 'panditconnect/poojas/ganesh-pooja' },
  { key: 'poojaLakshmi', localName: 'Lakshmi Pooja', cloudinaryId: 'panditconnect/poojas/lakshmi-pooja' },
  { key: 'poojaVastu', localName: 'Vastu Pooja', cloudinaryId: 'panditconnect/poojas/vastu-pooja' },
  { key: 'poojaMundan', localName: 'Mundan Sanskar', cloudinaryId: 'panditconnect/poojas/mundan-sanskar' },
  { key: 'poojaNamekaran', localName: 'Namkaran', cloudinaryId: 'panditconnect/poojas/namkaran' },
]

function findLocalFile(folderPath: string, baseName: string): string | null {
  const extensions = ['.png', '.jpg', '.jpeg', '.webp']
  for (const ext of extensions) {
    const fullPath = path.join(folderPath, baseName + ext)
    if (fs.existsSync(fullPath)) return fullPath
  }
  // Fallback: case-insensitive prefix match
  const files = fs.readdirSync(folderPath)
  const match = files.find((f) => f.toLowerCase().startsWith(baseName.toLowerCase()))
  return match ? path.join(folderPath, match) : null
}

async function uploadFile(localPath: string, publicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
  })
  // Deliver with automatic format + quality so the heavy source PNGs are
  // served as optimized WebP/AVIF instead of multi-MB originals. Strip the
  // SDK's `?_a=` analytics param — its `+` survives poorly through encoders.
  const url = cloudinary.url(result.public_id, {
    secure: true,
    version: result.version,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })
  return url.split('?')[0]
}

async function main() {
  // Optional arg re-uploads a single image: pnpm upload-images hero
  const onlyKey = process.argv[2]
  const mappings = onlyKey ? IMAGE_MAPPINGS.filter((m) => m.key === onlyKey) : IMAGE_MAPPINGS
  if (onlyKey && mappings.length === 0) {
    console.error(`Unknown key "${onlyKey}". Valid keys: ${IMAGE_MAPPINGS.map((m) => m.key).join(', ')}`)
    process.exit(1)
  }

  console.log('PanditConnect — Local Image Uploader')
  console.log('====================================')
  console.log(`Source folder: ${IMAGES_FOLDER}`)
  console.log(`Images to upload: ${mappings.length}\n`)

  if (!fs.existsSync(IMAGES_FOLDER)) {
    console.error(`Images folder not found: ${IMAGES_FOLDER}`)
    process.exit(1)
  }

  const results: Record<string, string> = {}
  const failed: string[] = []
  const skipped: string[] = []

  for (const mapping of mappings) {
    const localPath = findLocalFile(IMAGES_FOLDER, mapping.localName)
    if (!localPath) {
      console.warn(`Skipped: ${mapping.key} — file "${mapping.localName}" not found`)
      skipped.push(mapping.key)
      continue
    }
    try {
      console.log(`Uploading: ${path.basename(localPath)} -> ${mapping.cloudinaryId}`)
      const url = await uploadFile(localPath, mapping.cloudinaryId)
      results[mapping.key] = url
      console.log(`  OK: ${url}`)
    } catch (err) {
      console.error(`  FAILED: ${mapping.key}`, err)
      failed.push(mapping.key)
    }
  }

  // Merge with any URLs already present so a partial re-run never wipes
  // previously successful uploads.
  const outputPath = path.join(process.cwd(), 'lib', 'generated-images.ts')
  let existingResults: Record<string, string> = {}
  if (fs.existsSync(outputPath)) {
    try {
      const existing = fs.readFileSync(outputPath, 'utf-8')
      const match = existing.match(/GENERATED_IMAGES = ({[\s\S]*?}) as const/)
      if (match) existingResults = JSON.parse(match[1])
    } catch {
      // Malformed file — regenerate from scratch
    }
  }
  const merged = { ...existingResults, ...results }

  const fileContent = `// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Last updated: ${new Date().toISOString()}
// Source: local images uploaded via scripts/upload-local-images.ts
// To re-upload: pnpm upload-images

export const GENERATED_IMAGES = ${JSON.stringify(merged, null, 2)} as const

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

  fs.writeFileSync(outputPath, fileContent)
  console.log(`\nSaved: lib/generated-images.ts`)

  console.log('====================================')
  console.log(`Uploaded: ${Object.keys(results).length}/${mappings.length}`)
  if (skipped.length) console.log(`Skipped:  ${skipped.join(', ')}`)
  if (failed.length) console.log(`Failed:   ${failed.join(', ')}`)

  if (failed.length || skipped.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
