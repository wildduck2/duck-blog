import 'express-session'
import 'drizzle-orm'
import { DrizzleTables } from '../src/drizzle'

declare module 'express-session' {
  interface SessionData {
    user: Omit<DrizzleTables['userTable']['$inferSelect'], 'password'>
  }
}

declare module 'drizzle-orm' {
  interface DrizzleError {
    code: string
  }
}
