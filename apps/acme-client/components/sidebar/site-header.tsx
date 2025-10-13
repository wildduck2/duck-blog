import { Button } from '@acme/ui/button'
import { Separator } from '@acme/ui/separator'
import { SidebarTrigger } from '@acme/ui/sidebar'
import { Github } from 'lucide-react'
import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator className="mx-2 data-[orientation=vertical]:h-4" orientation="vertical" />
        <BreadcrumbPath />

        <div className="ml-auto flex items-center gap-2"></div>
      </div>
    </header>
  )
}

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@acme/ui/breadcrumb'
import { usePathname } from 'next/navigation'
import React from 'react'

function formatSegment(segment: string) {
  return segment
    .replace(/[-_]/g, ' ') // replace - and _ with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalize each word
}

export function BreadcrumbPath() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean) // remove empty

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length > 0 ? (
            <BreadcrumbLink asChild>
              <Link href="/">Acme</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Acme</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = '/' + segments.slice(0, index + 1).join('/')

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{formatSegment(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
