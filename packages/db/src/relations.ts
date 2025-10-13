import { relations } from 'drizzle-orm'
import { accessTokens, otpCodes, services, users } from './tables'

/**
 * USERS RELATIONS
 */
export const usersRelations = relations(users, ({ many }) => ({
  accessTokens: many(accessTokens),
  otpCodes: many(otpCodes),
}))

/**
 * OTP CODES RELATIONS
 */
export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  user: one(users, {
    fields: [otpCodes.user_id],
    references: [users.id],
  }),
}))

/**
 * SERVICES RELATIONS
 */
export const servicesRelations = relations(services, ({ many }) => ({
  tokens: many(accessTokens),
}))

/**
 * ACCESS TOKENS RELATIONS
 */
export const accessTokensRelations = relations(accessTokens, ({ one }) => ({
  service: one(services, {
    fields: [accessTokens.service_id],
    references: [services.id],
  }),
  user: one(users, {
    fields: [accessTokens.user_id],
    references: [users.id],
  }),
}))
