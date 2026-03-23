import type { NextConfig } from 'next'

const isVercelPreview = process.env.VERCEL_ENV === 'preview'

function buildCsp() {
  const scriptSrc = ["'self'", "'unsafe-inline'", 'https://js.stripe.com']
  const styleSrc = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']
  const fontSrc = ["'self'", 'https://fonts.gstatic.com']
  const imgSrc = ["'self'", 'data:', 'https://*.supabase.co']
  const connectSrc = ["'self'", 'https://*.supabase.co', 'https://api.openai.com', 'https://graph.facebook.com']
  const frameSrc = ['https://js.stripe.com']

  if (isVercelPreview) {
    scriptSrc.push('https://vercel.live')
    styleSrc.push('https://vercel.live')
    fontSrc.push('https://vercel.live', 'https://assets.vercel.com')
    imgSrc.push('https://vercel.live', 'https://vercel.com', 'blob:')
    connectSrc.push('https://vercel.live', 'wss://ws-us3.pusher.com')
    frameSrc.push('https://vercel.live')
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `font-src ${fontSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
  ].join('; ')
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon.svg',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: buildCsp(),
          },
        ],
      },
    ]
  },
  serverExternalPackages: ['@prisma/client', 'bullmq', 'ioredis'],
}

export default nextConfig
