import { Module } from '@nestjs/common'
import { AccessTokensController } from './access-tokens.controller'
import { AccessTokensService } from './access-tokens.service'

@Module({
  controllers: [AccessTokensController],
  providers: [AccessTokensService],
})
export class AccessTokensModule {}
