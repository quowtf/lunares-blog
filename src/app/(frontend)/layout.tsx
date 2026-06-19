import type { Metadata } from 'next'

import { Cormorant_Garamond } from 'next/font/google'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import PlausibleProvider from 'next-plausible'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'

import './globals.css'

const displaySerif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-display',
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, displaySerif.variable)}
      lang="es"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <PlausibleProvider enabled={process.env.NODE_ENV === 'production'}>
          <Providers>{children}</Providers>
        </PlausibleProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'Lunares',
    template: '%s | Lunares',
  },
  description: 'A collection of thoughts, photographs, stories and moments.',
  openGraph: mergeOpenGraph({
    title: 'Lunares',
    description: 'A collection of thoughts, photographs, stories and moments.',
  }),
  twitter: {
    card: 'summary_large_image',
  },
}
