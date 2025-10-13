import { ACCESS_TOKENS_STATUSES } from '@acme/db/constants'
import z from 'zod'
import { AccessTokenMessagesType } from './access-tokens.types'

const errorMessage = <T extends AccessTokenMessagesType>(message: T) => ({ message })

export const createAccessTokenSchema = z.object({
  name: z
    .string(errorMessage('ZOD_INVALID_STRING'))
    .min(1, errorMessage('ZOD_TOO_SHORT'))
    .max(255, errorMessage('ZOD_TOO_LONG')),
  service_id: z.string(errorMessage('ZOD_INVALID_STRING')).uuid(errorMessage('ZOD_INVALID_UUID')),
})

export const updateAccessTokenSchema = createAccessTokenSchema.extend({
  status: z.enum(ACCESS_TOKENS_STATUSES, errorMessage('ZOD_INVALID_STRING')),
})
