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
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { userAtom } from '../auth.atom'
import { PasswordInput } from '../auth.chunks'
import { type SignupSchemaType, signupSchemaClient } from './signup.dto'
import { handleSignup } from './signup.libs'

export function SignupPage({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter()
  const userAtomSetter = useSetAtom(userAtom)

  const form = useForm<SignupSchemaType>({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      passwordConfirm: '',
      username: '',
    },
    mode: 'onChange',
    resolver: zodResolver(signupSchemaClient),
  })

  const signupMutation = useMutation({
    mutationFn: handleSignup,
    onSuccess: (data) => {
      if (data?.state === 'success') {
        userAtomSetter(data.data)
        localStorage.setItem('user', JSON.stringify(data.data))
        toast.success('Signed up successfully')
        router.push('/auth/signin')
      }
    },
  })

  const onSubmit = (data: SignupSchemaType) => {
    signupMutation.mutate(data)
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-bold text-2xl">Create your account</h1>
        <p className="text-muted-foreground text-sm">Enter your information below to create your account</p>
      </div>

      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          {/* First Name */}
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" type="text" {...field} disabled={signupMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" type="text" {...field} disabled={signupMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Username */}
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" type="text" {...field} disabled={signupMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rb1m1@example.com"
                      type="email"
                      {...field}
                      disabled={signupMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Password */}
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

          {/* Confirm Password */}
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full cursor-pointer"
            disabled={signupMutation.isPending || !form.formState.isValid}
            type="submit">
            {signupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link className="underline underline-offset-4" href="/auth/signin">
          Sign in
        </Link>
      </div>
    </div>
  )
}
