'use client'
import { Button } from '@acme/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@acme/ui/input-otp'
import { Form, FormField, FormItem } from '@acme/ui/react-hook-form'
import { cn } from '@gentleduck/libs/cn'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type VerifyCodeSchemaType, verifyCodeSchema } from '~/server/auth/auth.dto'
import { userAtom } from '../auth.atom'
import { handleVerifyCode } from './verify-code.libs'

export function VerifyCodePage() {
  const router = useRouter()
  const user = useAtomValue(userAtom)

  const form = useForm<VerifyCodeSchemaType>({
    defaultValues: {
      otp: '',
      user_id: String(user?.id),
    },
    mode: 'onChange',
    resolver: zodResolver(verifyCodeSchema),
  })

  const verifyCodeMutation = useMutation({
    mutationFn: handleVerifyCode,
    onSuccess: (data) => {
      if (data?.state === 'success') {
        toast.success('Verified code successfully')
        router.push('/auth/reset-password')
      }
    },
  })

  const onSubmit = (data: VerifyCodeSchemaType) => {
    verifyCodeMutation.mutate(data)
  }

  return (
    <div className={cn('flex flex-col gap-6')}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-bold text-2xl">Verify Code</h1>
        <p className="text-balance text-muted-foreground text-sm">Enter the code sent to your email</p>
      </div>

      <Form {...form}>
        <form className="mx-auto grid w-fit gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid w-full">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormItem>
              )}
            />
          </div>

          <Button
            className="w-full cursor-pointer"
            disabled={!form.formState.isValid || verifyCodeMutation.isPending}
            type="submit">
            {verifyCodeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
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
