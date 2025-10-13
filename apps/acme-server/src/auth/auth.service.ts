import { Inject, Injectable } from '@nestjs/common'
import { type DrizzleError, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import otpGenerator from 'otp-generator'
import { PasswordHasher, throwError } from '~/common/libs'
import { DrizzleAsyncProvider, schema } from '~/drizzle'
import type { UpdateAccountInformationSchemaType } from './auth.dto'
import type {
  AuthMessageType,
  DeleteUserDto,
  ForgotPasswordDto,
  GetUserDto,
  ResetPasswordDto,
  SigninDto,
  SignupDto,
  VerifyCodeDto,
} from './auth.types'

@Injectable()
export class AuthService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    // @Inject(WINSTON_MODULE_NEST_PROVIDER)
    // private readonly logger: WinstonLogger,
  ) {}

  async signin(data: SigninDto) {
    try {
      const _user = await this.db.query.users.findFirst({
        where: eq(schema.users.username, data.username),
      })

      if (!_user) {
        throwError<AuthMessageType>('AUTH_USERNAME_INVALID', 401)
      }

      const passwordMatch = await PasswordHasher.comparePassword(data.password, _user.password_hash)
      if (!passwordMatch) {
        console.log(passwordMatch)
        throwError<AuthMessageType>('AUTH_PASSWORD_INVALID', 401)
      }

      // omit password
      const { password_hash: _, ...user } = _user
      return user
    } catch (error) {
      throwError<AuthMessageType>('AUTH_SIGNIN_FAILED', 500)
    }
  }

  async signup(data: SignupDto) {
    try {
      const password_hash = await PasswordHasher.hashPassword(data.password)

      const insertedUsers = await this.db
        .insert(schema.users)
        .values({
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          password_hash,
          username: data.username,
        })
        .returning()

      if (!insertedUsers?.length) {
        throwError<AuthMessageType>('AUTH_REGISTRATION_FAILED', 500)
        return
      }
      const user = insertedUsers[0]
      const { password_hash: _, ...safeUser } = user
      return safeUser
    } catch (error) {
      if (String((error as DrizzleError).cause).includes('user_table_user_name_unique')) {
        throwError<AuthMessageType>('AUTH_USERNAME_ALREADY_EXISTS', 409)
        return
      }

      if (String((error as DrizzleError).cause).includes('user_table_email_unique')) {
        throwError<AuthMessageType>('AUTH_EMAIL_ALREADY_EXISTS', 409)
        return
      }

      throwError<AuthMessageType>('AUTH_REGISTRATION_FAILED', 500)
    }
  }

  async getAccountInformation(data: GetUserDto) {
    try {
      const user = await this.db.query.users.findFirst({
        columns: {
          avatar_url: true,
          email: true,
          first_name: true,
          id: true,
          last_name: true,
          settings: true,
          username: true,
        },
        where: eq(schema.users.id, data.user_id),
      })

      if (!user) {
        throwError<AuthMessageType>('AUTH_USER_NOT_FOUND_OR_UNAUTHORIZED', 401)
        return
      }
      return user
    } catch (error) {
      throwError<AuthMessageType>('AUTH_GET_ACCOUNT_INFORMATION_FAILED', 401)
      return
    }
  }

  async forgotPassword(data: ForgotPasswordDto) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(schema.users.email, data.email),
      })

      if (!user) {
        throwError<AuthMessageType>('AUTH_USER_NOT_FOUND', 404)
        return
      }

      const OTP = otpGenerator.generate(6, {
        lowerCaseAlphabets: true,
        specialChars: true,
        upperCaseAlphabets: true,
      })

      const expires_at = new Date(Date.now() + 60000 * 10)
      const otp = await this.db
        .insert(schema.otpCodes)
        .values({
          code: OTP,
          user_id: user?.id,
          ...data,
          expires_at,
        })
        .returning()

      if (!otp?.length) {
        throwError<AuthMessageType>('AUTH_FORGOT_PASSWORD_FAILED', 500)
        return
      }
      return { otp, user }
    } catch (error) {
      throwError<AuthMessageType>('AUTH_FORGOT_PASSWORD_FAILED', 500)
      return
    }
  }

  async resetPassword(data: ResetPasswordDto) {
    try {
      const password_hash = await PasswordHasher.hashPassword(data.password_hash)
      data.password_hash = password_hash

      const user = await this.db
        .update(schema.users)
        .set({ ...data })
        .where(eq(schema.users.id, data.user_id))
        .returning()

      if (!user?.length) {
        throwError<AuthMessageType>('AUTH_USER_NOT_FOUND_OR_RESET_PASSWORD_FAILED', 500)
        return
      }
      return user
    } catch (error) {
      throwError<AuthMessageType>('AUTH_RESET_PASSWORD_FAILED', 500)
      return
    }
  }

  async updateAccountInformation({ user_id, ...data }: UpdateAccountInformationSchemaType) {
    try {
      const user = await this.db
        .update(schema.users)
        .set({ ...data })
        .where(eq(schema.users.id, user_id))
        .returning()

      if (!user?.length) {
        throwError<AuthMessageType>('AUTH_USER_NOT_FOUND_OR_UPDATE_ACCOUNT_INFORMATION_FAILED', 500)
        return
      }
      return user
    } catch (error) {
      throwError<AuthMessageType>('AUTH_UPDATE_ACCOUNT_INFORMATION_FAILED', 500)
      return
    }
  }

  async verifyCode(data: VerifyCodeDto) {
    try {
      const otp = await this.db.delete(schema.otpCodes).where(eq(schema.otpCodes.user_id, data.user_id)).returning()

      if (!otp?.length) {
        throwError<AuthMessageType>('AUTH_USER_NOT_FOUND_OR_VERIFY_CODE_FAILED', 500)
        return
      }
      return null
    } catch (error) {
      throwError<AuthMessageType>('AUTH_VERIFY_CODE_FAILED', 500)
      return
    }
  }

  async deleteAccount(data: DeleteUserDto) {
    try {
      const user = await this.db.delete(schema.users).where(eq(schema.users.id, data.user_id)).returning()
      if (!user?.length) {
        throwError<AuthMessageType>('AUTH_USER_NOT_FOUND_OR_DELETE_ACCOUNT_FAILED', 500)
        return
      }
      return null
    } catch (error) {
      throwError<AuthMessageType>('AUTH_DELETE_ACCOUNT_FAILED', 500)
      return
    }
  }
}
