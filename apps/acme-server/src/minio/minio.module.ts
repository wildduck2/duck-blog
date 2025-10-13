import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MinioController } from './minio.controller'
import { MinioService } from './minio.service'

@Module({
  controllers: [MinioController],
  exports: [MinioService],
  imports: [ConfigModule],
  providers: [MinioService],
})
export class MinioModule {}
