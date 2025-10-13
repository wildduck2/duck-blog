import { z } from 'zod'
import type { AuthMessageType } from './auth.types'

const errorMessage = <T extends AuthMessageType>(message: T) => ({ message })

const string = z.string({ ...errorMessage('ZOD_EXPECTED_STRING') }).max(30, { ...errorMessage('ZOD_TOO_LONG') })

export const signinSchema = z.object({
  password: string.min(8, { ...errorMessage('ZOD_TOO_SHORT') }),
  username: string.min(3, { ...errorMessage('ZOD_TOO_SHORT') }),
})
export type SignupSchemaType = z.infer<typeof signupSchema>

export const signupSchema = signinSchema.extend({
  email: z.string({ ...errorMessage('ZOD_EXPECTED_STRING') }).email({ ...errorMessage('ZOD_INVALID') }),
  firstName: string.min(3, { ...errorMessage('ZOD_TOO_SHORT') }),
  lastName: string.min(3, { ...errorMessage('ZOD_TOO_SHORT') }),
  username: string.min(3, { ...errorMessage('ZOD_TOO_SHORT') }),
})
export type SigninSchemaType = z.infer<typeof signinSchema>

export const withIDSchema = z.object({
  user_id: z.string({ ...errorMessage('ZOD_EXPECTED_STRING') }),
})
export type WithIDSchemaType = z.infer<typeof withIDSchema>

export const forgotPasswordSchema = signupSchema.pick({ email: true })
export type forgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = withIDSchema.extend({
  password_hash: string.min(8, { ...errorMessage('ZOD_TOO_SHORT') }),
})
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>

export const updateAccountInformationSchema = withIDSchema.merge(signupSchema.partial())
export type UpdateAccountInformationSchemaType = z.infer<typeof updateAccountInformationSchema>

export const verifyCodeSchema = resetPasswordSchema.omit({ password_hash: true }).extend({
  otp: z.string({ ...errorMessage('ZOD_EXPECTED_STRING') }).min(6, { ...errorMessage('ZOD_TOO_SHORT') }),
})
export type VerifyCodeSchemaType = z.infer<typeof verifyCodeSchema>
