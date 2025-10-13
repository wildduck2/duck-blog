import { Module } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import { LoggerInterceptor } from './logger.interceptor'
import { LoggerService } from './logger.service'

@Module({
  exports: [LoggerService, LoggerInterceptor],
  imports: [
    WinstonModule.forRoot({
      transports: [
        // new winston.transports.Console({
        //   format: winston.format.combine(
        //     winston.format.timestamp(),
        //     winston.format.colorize(),
        //     winston.format.simple(),
        //   ),
        // }),
      ],
    }),
  ],
  providers: [LoggerService, LoggerInterceptor],
})
export class LoggerModule {}
