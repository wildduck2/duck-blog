import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { otpCodes, words, users } from './tables'

// ========== USERS ==========
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

// ========== OTP CODES ==========
export type OtpCode = InferSelectModel<typeof otpCodes>
export type NewOtpCode = InferInsertModel<typeof otpCodes>

// ========== WORDS ==========
export type Word = InferSelectModel<typeof words>
export type NewWord = InferInsertModel<typeof words>
