import type { MinioMessage } from './minio.constants'

export type MinioMessageType = (typeof MinioMessage)[number]
