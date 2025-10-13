'use client'
import type { User } from '@acme/db/types'
import { atomWithStorage } from 'jotai/utils'

export const userAtom = atomWithStorage<Omit<User, 'password'> | null>('user', null)
