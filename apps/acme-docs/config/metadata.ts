import { Metadata, Viewport } from 'next'
import { absoluteUrl } from '~/lib/utils'
import { allTitles } from './docs'
import { siteConfig } from './site'

export const VIEWPORT: Viewport = {
  themeColor: [
    { color: 'white', media: '(prefers-color-scheme: light)' },
    { color: 'black', media: '(prefers-color-scheme: dark)' },
  ],
}

export const METADATA: Metadata = {
  alternates: {
    canonical: siteConfig.url,
  },
  authors: [
    {
      name: 'wilddcuk2',
      url: 'https://github.com/wildduck2',
    },
  ],
  creator: 'wilddcuk2',
  description: siteConfig.description,
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/favicon.ico',
    shortcut: '/favicon-96x96.png',
  },
  keywords: [
    // Brand
    'acme',
  ],
  manifest: `${siteConfig.url}/site.webmanifest`,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: siteConfig.name,
        height: 630,
        url: siteConfig.ogImage,
        width: 1200,
      },
    ],
    locale: 'en_US',
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: 'website',
    url: siteConfig.url,
  },
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@acme',
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    title: siteConfig.name,
  },
}

const ogImage = {
  alt: siteConfig.name,
  height: 630,
  url: siteConfig.ogImage,
  width: 1200,
}

export const SLUG_METADATA = (doc: { title: string; description: string; slug: string }): Metadata => ({
  ...METADATA,
  description: doc.description,
  openGraph: {
    ...METADATA.openGraph,
    description: doc.description,
    images: [ogImage],
    title: doc.title,
    type: 'article',
    url: absoluteUrl(doc.slug),
  },
  title: doc.title,
  twitter: {
    ...METADATA.twitter,
    description: doc.description,
    images: [siteConfig.ogImage],
    title: doc.title,
  },
})
