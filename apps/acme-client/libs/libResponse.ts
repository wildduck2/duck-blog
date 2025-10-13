import { toast } from 'sonner'
import type { ResponseType } from '~/server/common/types'
export function libResponse<T>(error: any): ResponseType<T> {
  const err = error as any
  const message = String(err?.response?.data?.message).split('_').splice(1)
  toast.error(message.join(' ').slice(0, 1) + message.join(' ').slice(1).toLowerCase())

  return {
    message: err?.response?.data?.message,
    state: 'error',
  }
}
