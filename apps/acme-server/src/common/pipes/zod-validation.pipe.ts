import type { ArgumentMetadata, PipeTransform } from '@nestjs/common'
import type { ZodError, ZodSchema, z } from 'zod'
import { throwError } from '../libs'

// NOTE: how pipes handles errors.
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): z.infer<typeof this.schema> {
    try {
      return this.schema.parse(value)
    } catch (error) {
      const { errors } = error as ZodError
      console.log(error)
      throwError(`${errors[0].message}`)
    }
  }
}
