import z from 'zod'
import { ServicesMessagesType } from './services.types'

const errorMessage = <T extends ServicesMessagesType>(message: T) => ({ message })

export const createServicesSchema = z.object({
  description: z.string(errorMessage('ZOD_INVALID_STRING')).optional(),
  name: z
    .string(errorMessage('ZOD_INVALID_STRING'))
    .min(1, errorMessage('ZOD_TOO_SHORT'))
    .max(255, errorMessage('ZOD_TOO_LONG')),
})

export const updateServicesSchema = createServicesSchema
