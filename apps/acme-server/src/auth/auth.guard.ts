import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common'
import type { Request } from 'express'
import type { Observable } from 'rxjs'
import { throwError } from '~/common/libs'
import type { AuthMessageType } from './auth.types'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    if (context.switchToHttp().getRequest<Request>().session.user) return true

    throwError<AuthMessageType>('AUTH_UNAUTHORIZED', 401)
    return false
  }
}
