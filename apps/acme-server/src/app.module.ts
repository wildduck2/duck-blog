import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AccessTokensModule } from './access-tokens'
import { AnalyticsModule } from './analytics'
import { CronService } from './app.service'
import { AuthModule } from './auth'
import { DrizzleModule } from './drizzle'
import { EmailModule } from './email'
import { LoggerModule } from './logger'
import { MinioModule } from './minio'
import { RedisModule } from './redis'
import { ServicesModule } from './services'

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    LoggerModule,
    DrizzleModule,
    RedisModule,
    MinioModule,
    EmailModule,
    AuthModule,
    AccessTokensModule,
    ServicesModule,
    AnalyticsModule,
  ],
  providers: [CronService],
})
export class AppModule {}
