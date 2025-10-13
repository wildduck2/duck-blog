export type ResponseType<TData extends unknown, TError extends readonly string[] = any> =
  | {
      state: 'error'
      error: TError[number]
      message: string
    }
  | {
      data: Awaited<ReturnType<TData>>
      state: 'success'
    }
