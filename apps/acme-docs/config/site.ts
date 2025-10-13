import { absoluteUrl } from '~/lib/utils'

export const siteConfig = {
  description: 'acme is a tiny, open source, and self-contained design system for tiny design systems.',
  links: {
    github: 'https://github.com/acme/docs',
    twitter: 'https://x.com/acme',
  },
  name: 'acme/docs',
  ogImage: absoluteUrl('/og/root.png'),
  title: 'acme/docs',
  url: absoluteUrl('/'),
}

export type SiteConfig = typeof siteConfig

export const META_THEME_COLORS = {
  dark: '#09090b',
  light: '#ffffff',
}
