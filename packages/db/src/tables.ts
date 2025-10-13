import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { ACCESS_TOKENS_STATUSES } from './constants'

export const tokenStatus = pgEnum('token_status', ACCESS_TOKENS_STATUSES)

/**
 * @name USERS
 * @description This is for the users table
 */
export const users = pgTable(
  'users',
  {
    avatar_url: text('avatar_url'),
    created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    first_name: varchar('first_name', { length: 100 }).notNull(),
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    is_active: boolean('is_active').default(true).notNull(),
    last_login_at: timestamp('last_login_at', { withTimezone: true }),
    last_name: varchar('last_name', { length: 100 }).notNull(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    settings: jsonb('settings').default(sql`'{}'::jsonb`),
    updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    version: integer('version').default(1).notNull(),
  },
  (table) => [
    index('active_users_idx').on(table.is_active, table.last_login_at).where(sql`deleted_at IS NULL`),
    uniqueIndex('user_email_idx').on(table.email),
    uniqueIndex('user_username_idx').on(table.username),
  ],
)

/**
 * @name OTP CODES
 * @description This is for the auth tokens and verification tokens and so on
 */
export const otpCodes = pgTable(
  'otp_codes',
  {
    code: varchar('code', { length: 6 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    is_active: boolean('is_active').default(true).notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('active_codes_idx').on(table.is_active, table.expires_at).where(sql`deleted_at IS NULL`),
    index('user_codes_idx').on(table.user_id, table.created_at),
  ],
)

/**
 * @name SERVICES
 * @description Defines the API services for which tokens exist
 */
export const services = pgTable(
  'services',
  {
    created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    description: text('description'),
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 100 }).notNull().unique(),
    updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    uniqueIndex('service_name_idx').on(table.name),
    index('active_services_idx').on(table.name).where(sql`deleted_at IS NULL`),
  ],
)

/**
 * @name ACCESS TOKENS
 * @description Stores tokens per service (and optionally linked to a user)
 */
export const accessTokens = pgTable(
  'access_tokens',
  {
    created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    notified: boolean('notified').default(false),
    renewed_at: timestamp('renewed_at', { withTimezone: true }),
    service_id: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    status: tokenStatus('status').notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('token_service_idx').on(table.service_id, table.status),
    index('token_expiry_idx').on(table.expires_at),
    index('token_user_idx').on(table.user_id),
  ],
)
