import { v2 as cloudinary, type UploadApiOptions } from 'cloudinary'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
})

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET)
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WEBP allowed'
  if (file.size > MAX_MB * 1024 * 1024) return `Image must be under ${MAX_MB}MB`
  return null
}

interface UploadOptions {
  /** When true, the asset is uploaded with authenticated delivery (not publicly listable). */
  private?: boolean
}

/**
 * Upload an image to Cloudinary and return its delivery URL.
 * Profile photos use public delivery; identity documents use authenticated delivery.
 */
export async function uploadImage(file: File, folder: string, options: UploadOptions = {}): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const uploadOptions: UploadApiOptions = {
    folder: `panditconnect/${folder}`,
    resource_type: 'image',
    transformation: [{ width: 800, quality: 'auto', fetch_format: 'auto' }],
    ...(options.private ? { type: 'authenticated' } : {}),
  }

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err || !result) return reject(err ?? new Error('Upload failed'))
      resolve(result.secure_url)
    })
    stream.end(buffer)
  })
}
