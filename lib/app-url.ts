/**
 * Absolute origin used wherever the app must build full URLs (email links,
 * metadata). NEXT_PUBLIC_APP_URL wins when set; otherwise production builds
 * fall back to the live domain and dev falls back to the local server.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://panditconnect.wayd.shop'
    : 'http://localhost:3000')
