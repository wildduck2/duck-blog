'use client'
import type { AccessToken, Service } from '@acme/db/types'
import { Badge } from '@acme/ui/badge'
import { Button } from '@acme/ui/button'
import { Card } from '@acme/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@acme/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@acme/ui/dropdown-menu'
import { Input } from '@acme/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@acme/ui/react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@acme/ui/select'
import { Skeleton } from '@acme/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@acme/ui/table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { Copy, Eye, EyeOff, MoreVertical, RefreshCw, Trash2 } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type z from 'zod'
import { server_api } from '~/libs/axios'
import { queryClient } from '~/providers/react-query'
import { createAccessTokenSchema } from '~/server/access-tokens/access-tokens.dto'

// ============================================================================
// Main Page Component
// ============================================================================

export function AccessTokensPage() {
  const { data, isLoading } = useQuery<AccessToken[]>({
    queryFn: async () => {
      const { data: res } = await server_api.get('/access-tokens')
      return res.data
    },
    queryKey: ['access-tokens'],
  })

  return (
    <div className="flex-1 p-4 xl:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl">Access Tokens</h1>
          <p className="text-base text-muted-foreground">
            Manage your Access tokens for accessing the waste inventory.
          </p>
        </div>
        <AccessTokenCreateButton />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <AccessTokensTable data={data || []} />
      )}
    </div>
  )
}

// ============================================================================
// Table Component
// ============================================================================

export function AccessTokensTable({ data }: { data: AccessToken[] }) {
  const [visibleTokens, setVisibleTokens] = React.useState<Set<string>>(new Set())

  const toggleTokenVisibility = (id: string) => {
    setVisibleTokens((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Token has been copied to your clipboard.')
  }

  if (data.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No access tokens found. Create one to get started.</p>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">Name</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="min-w-[400px]">Token</TableHead>
            <TableHead className="w-[180px]">Created</TableHead>
            <TableHead className="w-[200px]">Expires</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((token) => (
            <TableRow key={token.id}>
              <TableCell className="font-medium">{token.name}</TableCell>
              <TableCell className="w-[120px]">{getStatusBadge(token.status, token.expires_at.toString())}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="max-w-[555px] flex-1 rounded bg-muted px-2 py-1 font-mono text-sm">
                    {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                  </code>
                  <Button
                    className="h-8 w-8 p-0"
                    onClick={() => toggleTokenVisibility(token.id)}
                    size="sm"
                    variant="ghost">
                    {visibleTokens.has(token.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(token.token)}
                    size="sm"
                    variant="ghost">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(token?.created_at.toString())}</TableCell>
              <TableCell className="text-sm">{getExpiryInfo(token.expires_at.toString())}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu placement="bottom-end">
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => copyToClipboard(token.token)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy token
                    </DropdownMenuItem>
                    <AccessTokenRenewButton data={token} />
                    <DropdownMenuSeparator />
                    <AccessTokenRevokeButton data={token} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

// ============================================================================
// Action Buttons
// ============================================================================

export function AccessTokenRenewButton({ data }: { data: AccessToken }) {
  const { mutate: renewToken } = useMutation({
    mutationFn: async (token: string) => {
      toast.loading('Renewing token...', { id: token })
      const { data: res } = await server_api.put(`/access-tokens/${token}/renew`)
      return res.data
    },
    mutationKey: ['access-tokens', data.id],
    onError: () => {
      toast.error('Failed to renew token', { id: data.id })
    },
    onSuccess: (updatedToken: AccessToken) => {
      toast.success('Token renewed Successfully', { id: data.id })
      queryClient.setQueryData(['access-tokens'], (oldTokens: AccessToken[] | null) => {
        if (!oldTokens) return oldTokens
        return oldTokens.map((token) => (token.id === updatedToken.id ? updatedToken : token))
      })
    },
  })

  return (
    <DropdownMenuItem onClick={() => renewToken(data.id)}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Renew token
    </DropdownMenuItem>
  )
}

export function AccessTokenRevokeButton({ data }: { data: AccessToken }) {
  const { mutate: revokeToken } = useMutation({
    mutationFn: async (token: string) => {
      toast.loading('Revoking token...', { id: token })
      const { data: res } = await server_api.delete(`/access-tokens/${token}`)
      return res.data
    },
    mutationKey: ['access-tokens', data.id],
    onError: () => {
      toast.error('Failed to revoke token', { id: data.id })
    },
    onSuccess: () => {
      toast.success('Token revoked Successfully', { id: data.id })
      queryClient.setQueryData(['access-tokens'], (oldTokens: AccessToken[] | null) => {
        if (!oldTokens) return oldTokens
        return oldTokens.filter((token) => token.id !== data.id)
      })
    },
  })

  return (
    <DropdownMenuItem className="text-destructive" onClick={() => revokeToken(data.id)}>
      <Trash2 className="mr-2 h-4 w-4" />
      Revoke token
    </DropdownMenuItem>
  )
}

// ============================================================================
// Create Token Dialog
// ============================================================================

export function AccessTokenCreateButton() {
  const [open, setOpen] = React.useState(false)

  const form = useForm<z.infer<typeof createAccessTokenSchema>>({
    defaultValues: {
      name: '',
      service_id: '',
    },
    mode: 'onChange',
    resolver: zodResolver(createAccessTokenSchema),
  })

  const { mutate: createToken, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof createAccessTokenSchema>) => {
      const { data: res } = await server_api.post('/access-tokens', data)
      return res.data
    },
    onError: () => {
      toast.error('Failed to create access token')
    },
    onSuccess: (newToken) => {
      toast.success('Access token created successfully')
      queryClient.setQueryData(['access-tokens'], (oldTokens: AccessToken[] | undefined) => {
        if (!oldTokens) return [newToken]
        return [...oldTokens, newToken]
      })
      queryClient.invalidateQueries({ queryKey: ['access-tokens'] })
      form.reset()
      setOpen(false)
    },
  })
  console.log(form.watch())

  const onSubmit = (data: z.infer<typeof createAccessTokenSchema>) => {
    createToken(data)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Access Token</Button>
      </DialogTrigger>
      <DialogContent className="w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Access Token</DialogTitle>
          <DialogDescription>Add a new access token for accessing the waste inventory.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter token name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <FormControl>
                    <ServiceSelect {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isPending} type="submit">
                {isPending ? 'Creating...' : 'Add Access Token'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function ServiceSelect({
  value,
  onChange,
}: {
  value?: string
  onChange?: ((value: string) => void) | undefined
}) {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryFn: async () => {
      const { data: res } = await server_api.get('/services')
      return res.data
    },
    queryKey: ['services-select'],
  })

  return (
    <Select onValueChange={onChange} value={services?.find((s) => s.id === value)?.name}>
      <SelectTrigger className="w-full" disabled={isLoading}>
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a service'} />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem disabled value="loading">
            Loading...
          </SelectItem>
        ) : (
          services &&
          services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

function getStatusBadge(status: AccessToken['status'], expiresAt: string) {
  const isExpired = isPast(new Date(expiresAt))

  if (status === 'revoked') {
    return (
      <Badge className="font-medium" variant="destructive">
        Revoked
      </Badge>
    )
  }

  if (status === 'expired' || isExpired) {
    return (
      <Badge className="font-medium text-muted-foreground" variant="secondary">
        Expired
      </Badge>
    )
  }

  return (
    <Badge className="bg-green-400 font-medium hover:bg-green-600" variant="default">
      Active
    </Badge>
  )
}

function maskToken(token: string) {
  return `${token.slice(0, 8)}${'•'.repeat(48)}${token.slice(-8)}`
}

function formatDate(date: string) {
  return format(new Date(date), 'MMM dd, yyyy')
}

function getExpiryInfo(expiresAt: string) {
  const expiryDate = new Date(expiresAt)
  const isExpired = isPast(expiryDate)

  if (isExpired) {
    return <span className="text-muted-foreground">Expired {formatDistanceToNow(expiryDate, { addSuffix: true })}</span>
  }

  return <span className="text-foreground">Expires {formatDistanceToNow(expiryDate, { addSuffix: true })}</span>
}
