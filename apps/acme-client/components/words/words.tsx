'use client'

import { Word } from '@acme/db/types'
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

// Define the schema for word creation/editing
const createWordSchema = z.object({
  literal: z.string().min(1, 'Word literal is required'),
  category: z.string().min(1, 'Category is required'),
})

export function WordsPage() {
  return (
    <div className="flex-1 p-4 xl:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl">Words</h1>
          <p className="text-base text-muted-foreground">Manage your word vocabulary and categories.</p>
        </div>
        <WordCreateDialog />
      </div>

      <WordsTable />
    </div>
  )
}

// ============================================================================
// Words Table
// ============================================================================

function WordsTable() {
  const { data, isLoading } = useQuery<Word[]>({
    queryFn: async () => {
      const { data: res } = await server_api.get('/words/get-all')
      return res.data
    },
    queryKey: ['words'],
  })

  if (isLoading) {
    return <WordsTableSkeleton />
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Word</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-[180px]">Created</TableHead>
            <TableHead className="w-[180px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((word) => (
              <TableRow key={word.id}>
                <TableCell className="font-medium">{word.literal}</TableCell>
                <TableCell className="text-muted-foreground">
                  <Badge variant="secondary">{word.category}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(word.created_at, 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <WordActionsMenu word={word} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={4}>
                No words found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function WordsTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Word</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-[180px]">Created</TableHead>
            <TableHead className="w-[180px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
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

function WordActionsMenu({ word }: { word: Word }) {
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
        <WordEditDialog word={word} />
        <DropdownMenuSeparator />
        <WordDeleteDialog word={word} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Create Word Dialog
// ============================================================================

function WordCreateDialog() {
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      literal: '',
      category: '',
    },
    mode: 'onChange',
    resolver: zodResolver(createWordSchema),
  })

  const { mutate: createWord, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof createWordSchema>) => {
      const { data: res } = await server_api.post('/words', data)
      return res.data
    },
    onError: () => {
      toast.error('Failed to create word')
    },
    onSuccess: (newWord) => {
      toast.success('Word created successfully')
      queryClient.setQueryData(['words'], (oldWords: Word[] | undefined) => {
        if (!oldWords) return [newWord]
        return [...oldWords, newWord]
      })
      queryClient.invalidateQueries({ queryKey: ['words'] })
      setOpen(false)
      form.reset()
    },
  })

  const onSubmit = (data: z.infer<typeof createWordSchema>) => {
    createWord(data)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Word</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Word</DialogTitle>
            <DialogDescription>Add a new word to your vocabulary.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="literal">Word</Label>
              <Input id="literal" placeholder="Enter word" {...form.register('literal', { required: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="Enter category" {...form.register('category', { required: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? 'Creating...' : 'Add Word'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Edit Word Dialog
// ============================================================================

function WordEditDialog({ word }: { word: Word }) {
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      literal: word.literal ?? '',
      category: word.category ?? '',
    },
    mode: 'onChange',
    resolver: zodResolver(createWordSchema),
  })

  const { mutate: editWord, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof createWordSchema>) => {
      const { data: res } = await server_api.put(`/words/${word.id}`, data)
      return res.data
    },
    onError: () => {
      toast.error('Failed to update word')
    },
    onSuccess: (updatedWord) => {
      toast.success('Word updated successfully')
      queryClient.setQueryData(['words'], (oldWords: Word[] | undefined) => {
        if (!oldWords) return oldWords
        return oldWords.map((w) => (w.id === word.id ? updatedWord : w))
      })
      queryClient.invalidateQueries({ queryKey: ['words'] })
      setOpen(false)
    },
  })

  const onSubmit = (data: z.infer<typeof createWordSchema>) => {
    editWord(data)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Word
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Word</DialogTitle>
            <DialogDescription>Edit the word in your vocabulary.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-literal">Word</Label>
              <Input id="edit-literal" placeholder="Enter word" {...form.register('literal', { required: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                placeholder="Enter category"
                {...form.register('category', { required: true })}
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
// Delete Word Dialog
// ============================================================================

function WordDeleteDialog({ word }: { word: Word }) {
  const [open, setOpen] = useState(false)

  const { mutate: deleteWord, isPending } = useMutation({
    mutationFn: async () => {
      const { data: res } = await server_api.delete(`/words/${word.id}`)
      return res.data
    },
    onError: () => {
      toast.error('Failed to delete word')
    },
    onSuccess: () => {
      toast.success('Word deleted successfully')
      queryClient.setQueryData(['words'], (oldWords: Word[] | undefined) => {
        if (!oldWords) return oldWords
        return oldWords.filter((w) => w.id !== word.id)
      })
      queryClient.invalidateQueries({ queryKey: ['words'] })
      setOpen(false)
    },
  })

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Word
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Word</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{word.literal}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={() => deleteWord()} variant="destructive">
            {isPending ? 'Deleting...' : 'Delete Word'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
