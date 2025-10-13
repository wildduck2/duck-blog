'use client'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { userAtom } from './auth.atom'

export function useAuth() {
  const userAtomValue = useAtomValue(userAtom)
  const router = useRouter()

  // if (userAtomValue === null) {
  //   router.push('/auth/signin')
  // }

  return {
    userAtomValue,
  }
}
