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

export const words = pgTable(
  'words',
  {
    category: varchar('category', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    language: varchar('language', { length: 255 }).notNull(),
    literal: varchar('literal', { length: 255 }).notNull(),
    translated: varchar('translated', { length: 255 }),
    updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [index('user_words_idx').on(table.user_id, table.created_at)],
)
