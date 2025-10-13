import type { Readable } from 'node:stream'
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_NEST_PROVIDER, type WinstonLogger } from 'nest-winston'
import { throwError } from '~/common/libs'
import type { MinioMessageType } from './minio.types'

@Injectable()
export class MinioService {
  private readonly s3: S3Client
  private readonly bucket: string

  constructor(
    private readonly config: ConfigService,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') || 'uploads'

    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.config.get<string>('MINIO_ACCESS_KEY') ?? 'root',
        secretAccessKey: this.config.get<string>('MINIO_SECRET_KEY') ?? 'root',
      },
      endpoint: this.config.get<string>('MINIO_ENDPOINT') ?? 'http://localhost:9000',
      forcePathStyle: true,
      region: this.config.get<string>('MINIO_REGION') ?? 'us-east-1',
    })
  }

  async ensureBucketExists() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }))
    } catch (error) {
      this.logger.warn(`Bucket "${this.bucket}" not found. Creating...`)
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }))
    }
  }

  async uploadFile(key: string, body: Buffer, contentType: string) {
    try {
      await this.ensureBucketExists()
      const command = new PutObjectCommand({
        Body: body,
        Bucket: this.bucket,
        ContentType: contentType,
        Key: key,
      })

      await this.s3.send(command)
      return `${this.bucket}/${key}`
    } catch (error) {
      throwError<MinioMessageType>('MINIO_FILE_DOWNLOAD_FAILED')
      return
    }
  }

  async getFile(key: string) {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key })
      const result = await this.s3.send(command)
      return result.Body as Readable
    } catch (error) {
      throwError<MinioMessageType>('MINIO_FILE_DOWNLOAD_FAILED')
      return
    }
  }
}
