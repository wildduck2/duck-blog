import axios from 'axios'
import { libResponse } from '~/libs/libResponse'
import type { ResetPasswordSchemaType } from '~/server/auth/auth.dto'

export async function handleResetPassword(_data: ResetPasswordSchemaType) {
  try {
    const { data } = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/v1/auth/reset-password', _data, {
      withCredentials: true,
    })

    return data
  } catch (error) {
    return libResponse(error)
  }
}
