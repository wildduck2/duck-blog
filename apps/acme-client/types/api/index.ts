import { getAPI } from '~/server/common/types'
import type { WaitlistController } from '~/server/waitlist'

type get<T> = {
  readonly [K in keyof T]: T[K]
}

export type WaitlistErrorType = get<WaitlistController>

export type _APP_API = WaitlistController
export type APP_API = getAPIRes<_APP_API>

type Awaited<T> = T extends Promise<infer U> ? U : T
export type getAPIRes<T extends _APP_API> = {
  [K in keyof T]: {
    // @ts-expect-error
    args: Parameters<T[K]>[0]
    // @ts-expect-error
    return: Awaited<ReturnType<T[K]>>
  }
}
