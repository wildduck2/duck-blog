'use client'
import { Button } from '@acme/ui/button'
import { IconLogout } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { userAtom } from '../auth.atom'
import { handleSignout } from './signout.libs'

export function Signout() {
  const router = useRouter()
  const setUser = useSetAtom(userAtom)

  const { mutate } = useMutation({
    mutationFn: handleSignout,
    onError: (error: Error) => {
      toast.error(error.name)
    },
    onSuccess: (data) => {
      if (data?.state === 'success') {
        localStorage.setItem('user', JSON.stringify(''))
        setUser({} as never)
        toast.success('Signed out successfully')
        router.push('/auth/signin')
      }
    },
  })

  return (
    <Button className="flex w-full items-center justify-start gap-2" onClick={() => mutate()} size="sm" variant="ghost">
      <IconLogout />
      Log out
    </Button>
  )
}
