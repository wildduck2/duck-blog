import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Inject,
  Injectable,
  type WsExceptionFilter,
} from '@nestjs/common'
import type { Response } from 'express'
import { WINSTON_MODULE_NEST_PROVIDER, type WinstonLogger } from 'nest-winston'
import type { Socket } from 'socket.io'
import { AppError } from '../libs'

@Injectable()
@Catch()
export class ErrorExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  catch(exception: AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const logPayload = {
      headers: request.headers,
      ip:
        request.headers['x-forwarded-for'] ||
        (request as any).connection?.remoteAddress ||
        (request as any).socket.remoteAddress,
      message: exception.message,
      method: request.method,
      stack: exception.stack,
      type: 'HTTP_EXCEPTION',
      url: request.url,
    }

    // this.logger.error(logPayload)

    response.status(exception.status).json({
      message: exception.message,
      state: 'error',
    })
  }
}

@Injectable()
@Catch()
export class WSErrorExceptionFilter implements WsExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  catch(exception: Error, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient<Socket>()
    const data = host.switchToWs().getData()
    const ip = client.handshake?.address

    const logPayload = {
      data: data,
      event: data?.event || 'unknown',
      headers: client.handshake?.headers,
      ip,
      message: exception.message,
      stack: exception.stack,
      type: 'WS_EXCEPTION',
    }

    this.logger.error(logPayload)

    client.emit('error', {
      message: exception.message,
      status: 'error',
    })
  }
}
