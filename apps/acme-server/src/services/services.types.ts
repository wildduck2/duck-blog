import { createZodDto } from 'nestjs-zod'
import { SERVICES_MESSAGES } from './services.constants'
import { createServicesSchema, updateServicesSchema } from './services.dto'

export type ServicesMessagesType = (typeof SERVICES_MESSAGES)[number]

export class CreateServicesDto extends createZodDto(createServicesSchema) {}
export class UpdateServicesDto extends createZodDto(updateServicesSchema) {}
