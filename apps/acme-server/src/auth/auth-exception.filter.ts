import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    console.log('🔥 Exception caught:', exception)

    response.status(500).json({
      state: 'error',
      error: exception.message,
    })
  }
}
