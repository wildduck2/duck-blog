'use client'
import { Button } from '@acme/ui/button'
import { Input } from '@acme/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@acme/ui/react-hook-form'
import { cn } from '@gentleduck/libs/cn'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
// import { type SigninSchemaType, signinSchema } from '~/server/auth/auth.dto'
import { userAtom } from '../auth.atom'
import { PasswordInput } from '../auth.chunks'
import { handleSignin } from './signin.libs'

export function SigninPage({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter()
  const userAtomSetter = useSetAtom(userAtom)

  const form = useForm<SigninSchemaType>({
    defaultValues: {
      password: '',
      username: '',
    },
    mode: 'onChange',
    // resolver: zodResolver(signinSchema),
  })

  const signinMutation = useMutation({
    mutationFn: handleSignin,
    onSuccess: (data) => {
      if (data?.status === 'Ok') {
        localStorage.setItem('user', JSON.stringify(data.data))
        toast.success('Signed in successfully')
        userAtomSetter(data.data)
        router.push('/')
      }
    },
  })

  const onSubmit = (data: SigninSchemaType) => {
    signinMutation.mutate(data)
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-bold text-2xl">Login to your account</h1>
        <p className="text-balance text-muted-foreground text-sm">Enter your email below to login to your account</p>
      </div>

      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="wilddcuk2" type="text" {...field} disabled={signinMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            className="w-full cursor-pointer"
            disabled={!form.formState.isValid || signinMutation.isPending}
            type="submit">
            {signinMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link className="underline underline-offset-4" href="/auth/signup">
          Sign up
        </Link>
      </div>
    </div>
  )
}
