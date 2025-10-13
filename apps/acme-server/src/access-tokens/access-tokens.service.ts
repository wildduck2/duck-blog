import { Inject, Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { desc, eq, sql } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { throwError } from '~/common/libs'
import { DrizzleAsyncProvider, schema } from '~/drizzle'
import { AccessTokenMessagesType, CreateAccessTokenDto, UpdateAccessTokenDto } from './access-tokens.types'

@Injectable()
export class AccessTokensService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  // ===== GET ALL =====
  async getAll({ page = 1, pageSize = 10, order = 'desc', orderBy = 'created_at' }) {
    try {
      const offset = (page - 1) * pageSize

      const tokens = await this.db
        .select()
        .from(schema.accessTokens)
        .orderBy(order === 'asc' ? schema.accessTokens[orderBy] : desc(schema.accessTokens[orderBy]))
        .limit(pageSize)
        .offset(offset)

      if (!tokens.length)
        throwError<AccessTokenMessagesType>('ACCESS_TOKENS_GET_ALL_FAILED', 404, { message: 'No tokens found' })

      return tokens
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<AccessTokenMessagesType>('ACCESS_TOKENS_GET_ALL_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== GET ONE =====
  async getOne(id: string) {
    try {
      const token = await this.db.query.accessTokens.findFirst({
        where: eq(schema.accessTokens.id, id),
      })

      if (!token)
        throwError<AccessTokenMessagesType>('ACCESS_TOKENS_GET_ONE_FAILED', 404, { message: `Token ${id} not found` })

      return token
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<AccessTokenMessagesType>('ACCESS_TOKENS_GET_ONE_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== CREATE =====
  async create(data: CreateAccessTokenDto & { user_id: string }) {
    try {
      const token = randomBytes(32).toString('hex') // 64-char token
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // default 7 days

      const [_token] = await this.db
        .insert(schema.accessTokens)
        .values({ expires_at: expiry, status: 'active', token, ...data })
        .returning()

      if (!_token) throwError<AccessTokenMessagesType>('ACCESS_TOKENS_CREATE_FAILED', 404)

      return _token
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<AccessTokenMessagesType>('ACCESS_TOKENS_CREATE_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== UPDATE =====
  async update(id: string, dto: UpdateAccessTokenDto) {
    try {
      const [token] = await this.db
        .update(schema.accessTokens)
        .set(dto)
        .where(eq(schema.accessTokens.id, id))
        .returning()

      if (!token) throwError<AccessTokenMessagesType>('ACCESS_TOKENS_UPDATE_FAILED', 404)

      return token
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<AccessTokenMessagesType>('ACCESS_TOKENS_UPDATE_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== DELETE =====
  async delete(id: string) {
    try {
      const [token] = await this.db.delete(schema.accessTokens).where(eq(schema.accessTokens.id, id)).returning()

      if (!token) throwError<AccessTokenMessagesType>('ACCESS_TOKENS_DELETE_FAILED', 404)

      return null
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<AccessTokenMessagesType>('ACCESS_TOKENS_DELETE_FAILED', 500, { cause: (err as Error).message })
    }
  }

  // ===== RENEW =====
  async renew(id: string) {
    try {
      const token = randomBytes(32).toString('hex') // 64-char token
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // default 7 days

      const [_token] = await this.db
        .update(schema.accessTokens)
        .set({ expires_at: expiry, token })
        .where(eq(schema.accessTokens.id, id))
        .returning()

      if (!_token) throwError<AccessTokenMessagesType>('ACCESS_TOKENS_RENEW_FAILED', 404)

      return _token
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 404) throw err
      throwError<AccessTokenMessagesType>('ACCESS_TOKENS_RENEW_FAILED', 500, { cause: (err as Error).message })
    }
  }
}
