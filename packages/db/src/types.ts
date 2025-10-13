import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { accessTokens, otpCodes, services, users } from './tables'

// ========== USERS ==========
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

// ========== OTP CODES ==========
export type OtpCode = InferSelectModel<typeof otpCodes>
export type NewOtpCode = InferInsertModel<typeof otpCodes>

// ========== SERVICES ==========
export type Service = InferSelectModel<typeof services>
export type NewService = InferInsertModel<typeof services>

// ========== ACCESS TOKENS ==========
export type AccessToken = InferSelectModel<typeof accessTokens>
export type NewAccessToken = InferInsertModel<typeof accessTokens>
