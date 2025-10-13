import { createZodDto } from 'nestjs-zod'
import type { AuthMessages } from './auth.constants'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  updateAccountInformationSchema,
  verifyCodeSchema,
  withIDSchema,
} from './auth.dto'

export type AuthMessageType = (typeof AuthMessages)[number]

// DTOS TYPES
// Why these are here?
// well this clear because when i import the schemas in the client `Ts` parse these files and
// compiles them and throws errors of missing packages
export class SigninDto extends createZodDto(signinSchema) {}
export class SignupDto extends createZodDto(signupSchema) {}
export class SignoutDto extends createZodDto(withIDSchema) {}
export class GetUserDto extends createZodDto(withIDSchema) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class UpdateAccountInformationDto extends createZodDto(updateAccountInformationSchema) {}
export class DeleteUserDto extends createZodDto(withIDSchema) {}
export class VerifyCodeDto extends createZodDto(verifyCodeSchema) {}
