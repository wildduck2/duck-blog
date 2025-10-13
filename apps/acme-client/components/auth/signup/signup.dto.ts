import type z from 'zod'
import { signupSchema } from '~/server/auth/auth.dto'

export const signupSchemaClient = signupSchema
  .extend({
    passwordConfirm: signupSchema.shape.password,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'ZOD_PASSWORD_MISMATCH',
    path: ['passwordConfirm'],
  })

export type SignupSchemaType = z.infer<typeof signupSchemaClient>
