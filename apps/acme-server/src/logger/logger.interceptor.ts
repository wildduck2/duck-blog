import { type CallHandler, type ExecutionContext, Inject, Injectable, type NestInterceptor } from '@nestjs/common'
import { WINSTON_MODULE_NEST_PROVIDER, type WinstonLogger } from 'nest-winston'
import { type Observable, tap } from 'rxjs'
import { LoggerService } from './logger.service'

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly meta: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const { method, url } = req
    const now = Date.now()
    const metadata = this.meta.getRequestMetadata(req)

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now
        this.logger.log({
          context: 'HTTP',
          delay,
          message: `${method} ${url} - ${delay}ms`,
          method,
          url,
          ...metadata,
        })
      }),
    )
  }
}
