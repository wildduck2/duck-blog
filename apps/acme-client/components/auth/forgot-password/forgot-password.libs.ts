import axios from 'axios'
import { libResponse } from '~/libs/libResponse'
import type { forgotPasswordSchemaType } from '~/server/auth/auth.dto'

export async function handleForgetPassword(_data: forgotPasswordSchemaType) {
  try {
    const { data } = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/v1/auth/forgot-password', _data, {
      withCredentials: true,
    })

    return data
  } catch (error) {
    return libResponse(error)
  }
}
