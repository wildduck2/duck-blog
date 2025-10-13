import axios from 'axios'
import { libResponse } from '~/libs/libResponse'
import type { ResponseType } from '~/server/common/types'

export async function handleSignout(): Promise<ResponseType<null>> {
  try {
    console.log('out')
    const { data } = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/v1/auth/signout', {
      withCredentials: true,
    })

    return data
  } catch (error) {
    return libResponse(error)
  }
}
