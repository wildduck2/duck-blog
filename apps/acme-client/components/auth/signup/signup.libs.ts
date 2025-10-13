import type { User } from '@acme/db/types'
import axios from 'axios'
import { libResponse } from '~/libs/libResponse'
import type { ResponseType } from '~/server/common/types'
import type { SignupSchemaType } from './signup.dto'

export async function handleSignup(_data: SignupSchemaType): Promise<ResponseType<Omit<User, 'password'>>> {
  try {
    const { data } = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/v1/auth/signup', _data, {
      withCredentials: true,
    })

    return data
  } catch (error) {
    return libResponse(error)
  }
}

export async function handleSignupWithGithub(): Promise<void> {}
