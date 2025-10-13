import axios from 'axios'
import { libResponse } from '~/libs/libResponse'
import type { VerifyCodeSchemaType } from '~/server/auth/auth.dto'

export async function handleVerifyCode(_data: VerifyCodeSchemaType) {
  try {
    const { data } = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/v1/auth/verify-code', _data, {
      withCredentials: true,
    })

    return data
  } catch (error) {
    return libResponse(error)
  }
}
