'use client'
import { SidebarInset, SidebarProvider } from '@acme/ui/sidebar'
import type React from 'react'
import { AppSidebar } from '~/components/sidebar/sidebar'
import { SiteHeader } from '~/components/sidebar/site-header'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider
      style={
        {
          '--header-height': 'calc(var(--spacing) * 12)',
          '--sidebar-width': 'calc(var(--spacing) * 74)',
        } as React.CSSProperties
      }>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
