'use client'

import { User } from '@acme/acme-db/types'
import { Avatar } from '@acme/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@acme/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@acme/ui/sidebar'
import { Skeleton } from '@acme/ui/skeleton'
import { IconCreditCard, IconDotsVertical, IconNotification, IconUserCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { server_api } from '~/libs/axios'
import { Signout } from '../auth/signout'

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const { data: user, isLoading } = useQuery({
    queryFn: async () => {
      const { data } = await server_api.get(process.env.NEXT_PUBLIC_API_URL + '/v1/auth/me', {
        withCredentials: true,
      })
      return data.data as User
    },
    queryKey: ['session'],
    retry: false,
  })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu placement={isMobile ? 'bottom-end' : 'right-end'} sideOffset={4}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg">
              {isLoading ? (
                <Skeleton className="h-8 w-8 rounded-lg" />
              ) : (
                <>
                  <Avatar
                    alt={user?.username}
                    className="h-8 w-8 rounded-lg"
                    fallback={user?.username}
                    src={user?.avatar_url as string}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.username}</span>
                    <span className="truncate text-muted-foreground text-xs">{user?.email}</span>
                  </div>
                  <IconDotsVertical className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  alt={user?.username}
                  className="h-8 w-8 rounded-lg"
                  fallback={user?.username}
                  src={user?.avatar_url as string}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.username}</span>
                  <span className="truncate text-muted-foreground text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Signout />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
