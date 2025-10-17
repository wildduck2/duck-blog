import { relations } from 'drizzle-orm'
import { otpCodes, users, words } from './tables'

/**
 * USERS RELATIONS
 */
export const usersRelations = relations(users, ({ many }) => ({
  otpCodes: many(otpCodes),
  words: many(words),
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
 * Words RELATIONS
 */
export const wordsRelations = relations(words, ({ one }) => ({
  user: one(users, {
    fields: [words.user_id],
    references: [users.id],
  }),
}))
