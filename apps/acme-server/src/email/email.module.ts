import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DrizzleModule } from '~/drizzle'
import { EmailService } from './email.service'

@Module({
  controllers: [],
  exports: [EmailService],
  imports: [DrizzleModule],
  providers: [EmailService],
})
export class EmailModule {}
