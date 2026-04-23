import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kenopia — Tempat Curhat Bersama AI',
  description:
    'Luapkan emosimu dan dapatkan respons penuh empati dari AI. Kenopia hadir 24 jam untuk mendengar keluh kesahmu.',
  keywords: ['curhat', 'emosi', 'AI', 'mental health', 'support', 'kenopia'],
  authors: [{ name: 'Kenopia' }],

  manifest: '/manifest.json',
  themeColor: '#2563eb',

  icons: {
    icon: [
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon.png',
  },

  openGraph: {
    title: 'Kenopia — Tempat Curhat Bersama AI',
    description:
      'Luapkan emosimu dan dapatkan respons penuh empati dari AI.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        {children}

        {/* Service Worker PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js')
                    .then(() => console.log('SW terdaftar'))
                    .catch(err => console.log('SW gagal', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}