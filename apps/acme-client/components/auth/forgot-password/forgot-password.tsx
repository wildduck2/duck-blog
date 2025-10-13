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
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { forgotPasswordSchema, type forgotPasswordSchemaType } from '~/server/auth/auth.dto'
import { userAtom } from '../auth.atom'
import { handleForgetPassword } from './forgot-password.libs'

export function ForgetPasswordPage() {
  const router = useRouter()
  const userAtomSetter = useSetAtom(userAtom)

  const form = useForm<forgotPasswordSchemaType>({
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
    resolver: zodResolver(forgotPasswordSchema),
  })

  const forgetPasswordMutation = useMutation({
    mutationFn: handleForgetPassword,
    onSuccess: (data) => {
      if (data?.state === 'success') {
        localStorage.setItem('user', JSON.stringify(data.data))
        toast.success('Forgot password successfully')
        userAtomSetter(data.data)
        router.push('/auth/verify-code')
      }
    },
  })

  const onSubmit = (data: forgotPasswordSchemaType) => {
    forgetPasswordMutation.mutate(data)
  }

  return (
    <div className={cn('flex flex-col gap-6')}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-bold text-2xl">Forget Password</h1>
        <p className="text-balance text-muted-foreground text-sm">Enter your email to reset your password</p>
      </div>

      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@example.com"
                      type="email"
                      {...field}
                      disabled={forgetPasswordMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            className="w-full cursor-pointer"
            disabled={!form.formState.isValid || forgetPasswordMutation.isPending}
            type="submit">
            {forgetPasswordMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Forget password
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
