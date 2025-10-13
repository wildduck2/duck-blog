import { schema } from '@acme/db'
import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { throwError } from '~/common/libs'
import { DrizzleAsyncProvider } from '~/drizzle'
import { CreateServicesDto, ServicesMessagesType, UpdateServicesDto } from './services.types'

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  // ===== GET ALL =====
  async getAll() {
    try {
      const services = await this.db.query.services.findMany()

      if (!services.length)
        throwError<ServicesMessagesType>('SERVICES_GET_ALL_FAILED', 404, { message: 'No services found' })

      return services
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<ServicesMessagesType>('SERVICES_GET_ALL_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== GET ONE =====
  async getOne(id: string) {
    try {
      const service = await this.db.query.services.findFirst({
        where: eq(schema.services.id, id),
      })

      if (!service)
        throwError<ServicesMessagesType>('SERVICES_GET_ONE_FAILED', 404, { message: `Service ${id} not found` })

      return service
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<ServicesMessagesType>('SERVICES_GET_ONE_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== CREATE =====
  async create(data: CreateServicesDto) {
    try {
      const [_service] = await this.db
        .insert(schema.services)
        .values({
          ...data,
        })
        .returning()

      if (!_service) throwError<ServicesMessagesType>('SERVICES_CREATE_FAILED', 404)

      return _service
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<ServicesMessagesType>('SERVICES_CREATE_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== UPDATE =====
  async update(id: string, dto: UpdateServicesDto) {
    try {
      const [service] = await this.db.update(schema.services).set(dto).where(eq(schema.services.id, id)).returning()

      if (!service) throwError<ServicesMessagesType>('SERVICES_UPDATE_FAILED', 404)

      return service
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<ServicesMessagesType>('SERVICES_UPDATE_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== DELETE =====
  async delete(id: string) {
    try {
      const [service] = await this.db.delete(schema.services).where(eq(schema.services.id, id)).returning()

      if (!service) throwError<ServicesMessagesType>('SERVICES_DELETE_FAILED', 404)

      return null
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<ServicesMessagesType>('SERVICES_DELETE_FAILED', 500, { cause: (err as Error).message })
    }
  }
}
