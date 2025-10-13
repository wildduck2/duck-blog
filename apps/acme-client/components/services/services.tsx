'use client'

import { Service } from '@acme/db/types'
import { Badge } from '@acme/ui/badge'
import { Button } from '@acme/ui/button'
import {
  Dialog,
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
import { Label } from '@acme/ui/label'
import { Skeleton } from '@acme/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@acme/ui/table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { formatDate } from 'date-fns'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { server_api } from '~/libs/axios'
import { queryClient } from '~/providers/react-query'
import { createServicesSchema } from '~/server/services/services.dto'

export function ServicesPage() {
  return (
    <div className="flex-1 p-4 xl:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl">Services</h1>
          <p className="text-base text-muted-foreground">Manage your API services for accessing the waste inventory.</p>
        </div>
        <ServiceCreateDialog />
      </div>

      <ServicesTable />
    </div>
  )
}

// ============================================================================
// Services Table
// ============================================================================

function ServicesTable() {
  const { data, isLoading } = useQuery<Service[]>({
    queryFn: async () => {
      const { data: res } = await server_api.get('/services')
      return res.data
    },
    queryKey: ['services'],
  })

  if (isLoading) {
    return <ServicesTableSkeleton />
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[180px]">Created</TableHead>
            <TableHead className="w-[180px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="text-muted-foreground">{service.description}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(service.created_at, 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <ServiceActionsMenu service={service} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={5}>
                No services found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function ServicesTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[180px]">Created</TableHead>
            <TableHead className="w-[140px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-full max-w-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end">
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ============================================================================
// Actions Menu
// ============================================================================

function ServiceActionsMenu({ service }: { service: Service }) {
  return (
    <DropdownMenu placement="bottom-end">
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <ServiceEditDialog service={service} />
        <DropdownMenuSeparator />
        <ServiceDeleteDialog service={service} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Create Service Dialog
// ============================================================================

function ServiceCreateDialog() {
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      description: '',
      name: '',
    },
    mode: 'onChange',
    resolver: zodResolver(createServicesSchema),
  })

  const { mutate: createService, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof createServicesSchema>) => {
      const { data: res } = await server_api.post('/services', data)
      return res.data
    },
    onError: () => {
      toast.error('Failed to create service')
    },
    onSuccess: (newService) => {
      toast.success('Service created successfully')
      queryClient.setQueryData(['services'], (oldServices: Service[] | undefined) => {
        if (!oldServices) return [newService]
        return [...oldServices, newService]
      })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setOpen(false)
      form.reset()
    },
  })

  const onSubmit = (data: z.infer<typeof createServicesSchema>) => {
    createService(data)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Service</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>Add a new service for accessing the waste inventory.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter service name" {...form.register('name', { required: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter service description"
                {...form.register('description', { required: true })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? 'Creating...' : 'Add Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Edit Service Dialog
// ============================================================================

function ServiceEditDialog({ service }: { service: Service }) {
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      description: service.description ?? '',
      name: service.name ?? '',
    },
    mode: 'onChange',
    resolver: zodResolver(createServicesSchema),
  })

  const { mutate: editService, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof createServicesSchema>) => {
      const { data: res } = await server_api.put(`/services/${service.id}`, data)
      return res.data
    },
    onError: () => {
      toast.error('Failed to update service')
    },
    onSuccess: (updatedService) => {
      toast.success('Service updated successfully')
      queryClient.setQueryData(['services'], (oldServices: Service[] | undefined) => {
        if (!oldServices) return oldServices
        return oldServices.map((s) => (s.id === service.id ? updatedService : s))
      })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setOpen(false)
    },
  })

  const onSubmit = (data: z.infer<typeof createServicesSchema>) => {
    editService(data)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Service
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Edit the service for accessing the waste inventory.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" placeholder="Enter service name" {...form.register('name', { required: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Enter service description"
                {...form.register('description', { required: true })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Delete Service Dialog
// ============================================================================

function ServiceDeleteDialog({ service }: { service: Service }) {
  const [open, setOpen] = useState(false)

  const { mutate: deleteService, isPending } = useMutation({
    mutationFn: async () => {
      const { data: res } = await server_api.delete(`/services/${service.id}`)
      return res.data
    },
    onError: () => {
      toast.error('Failed to delete service')
    },
    onSuccess: () => {
      toast.success('Service deleted successfully')
      queryClient.setQueryData(['services'], (oldServices: Service[] | undefined) => {
        if (!oldServices) return oldServices
        return oldServices.filter((s) => s.id !== service.id)
      })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setOpen(false)
    },
  })

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Service
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Service</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{service.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={() => deleteService()} variant="destructive">
            {isPending ? 'Deleting...' : 'Delete Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
