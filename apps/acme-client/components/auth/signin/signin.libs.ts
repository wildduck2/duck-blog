import type { User } from '@acme/db/types'
import axios from 'axios'
import { toast } from 'sonner'
import { libResponse } from '~/libs/libResponse'
import type { SigninSchemaType } from '~/server/auth/auth.dto'
import type { ResponseType } from '~/server/common/types'

export async function handleSignin(_data: SigninSchemaType): Promise<ResponseType<Omit<User, 'password'>>> {
  try {
    const { data } = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/v1/auth/signin', _data, {
      withCredentials: true,
    })

    return data
  } catch (error) {
    return libResponse(error)
  }
}

export async function handleSigninWithGithub(): Promise<void> {}
