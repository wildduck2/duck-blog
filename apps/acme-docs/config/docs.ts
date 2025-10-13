import { MainNavItem, SidebarNavItem } from '~/types/nav'

export interface DocsConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
  chartsNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  chartsNav: [],
  mainNav: [
    {
      href: '/docs',
      title: 'Documentation',
    },
  ],
  sidebarNav: [
    {
      collapsible: false,
      items: [
        {
          href: '/docs',
          items: [],
          title: 'Introduction',
        },
        {
          href: '/docs/whoiam',
          items: [],
          label: '',
          title: 'Who am I?',
        },
      ],
      title: 'Getting Started',
    },
  ],
}

type NavItem = {
  title: string
  href?: string
  label?: string
  items?: NavItem[]
}

function extractTitles(navItems: NavItem[]): string[] {
  const titles: string[] = []

  for (const item of navItems) {
    if (item.title) {
      titles.push(item.title)
    }

    if (item.items && item.items.length > 0) {
      titles.push(...extractTitles(item.items))
    }
  }

  return titles
}

export const allTitles = [
  ...extractTitles(docsConfig.mainNav),
  ...extractTitles(docsConfig.sidebarNav),
  ...extractTitles(docsConfig.chartsNav),
]
