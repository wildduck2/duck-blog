import { Global, Module } from '@nestjs/common'
import { DrizzleAsyncProvider, drizzleProvider } from './drizzle.service'

@Global()
@Module({
  exports: [DrizzleAsyncProvider],
  providers: [...drizzleProvider],
})
export class DrizzleModule {}
