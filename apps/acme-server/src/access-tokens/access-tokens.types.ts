import { createZodDto } from 'nestjs-zod'
import { ACCESS_TOKENS_MESSAGES } from './access-tokens.constants'
import { createAccessTokenSchema, updateAccessTokenSchema } from './access-tokens.dto'

export type AccessTokenMessagesType = (typeof ACCESS_TOKENS_MESSAGES)[number]

export class CreateAccessTokenDto extends createZodDto(createAccessTokenSchema) {}
export class UpdateAccessTokenDto extends createZodDto(updateAccessTokenSchema) {}
