import { Body, Controller, Get, Post, Req, Res, Session, UseFilters, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import type { SessionData } from 'express-session'
import { ErrorExceptionFilter } from '~/common/exceptions'
import { ZodValidationPipe } from '~/common/pipes'
import type { ResponseType } from '~/common/types'
import { EmailService, TemplateText } from '~/email'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  updateAccountInformationSchema,
  withIDSchema,
} from './auth.dto'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import type {
  AuthMessageType,
  ForgotPasswordDto,
  GetUserDto,
  ResetPasswordDto,
  SigninDto,
  SignupDto,
  UpdateAccountInformationDto,
  VerifyCodeDto,
} from './auth.types'

@Controller('auth')
@UseFilters(ErrorExceptionFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Post('signin')
  async signin(
    @Body(new ZodValidationPipe(signinSchema)) body: SigninDto,
    @Session() session: SessionData,
  ): Promise<ResponseType<typeof this.authService.signin, AuthMessageType>> {
    const data = await this.authService.signin(body)
    session.user = data as never
    // session = { ...session, user: data! }

    console.log(body)

    return {
      data,
      message: 'AUTH_SIGNIN_SUCCESS',
      state: 'success',
    }
  }

  @Post('signup')
  async signup(
    @Body(new ZodValidationPipe(signupSchema)) body: SignupDto,
  ): Promise<ResponseType<typeof this.authService.signup, AuthMessageType>> {
    const user = await this.authService.signup(body)

    if (user) {
      this.emailService.sendTestEmail({
        subject: TemplateText.welcome.subject,
        template: {
          args: {
            username: user.username,
          },
          name: 'welcome',
        },
        text: TemplateText.welcome.text,
        to: user.email,
      })
    }

    return { data: user, message: 'AUTH_REGISTRATION_SUCCESS', state: 'success' }
  }

  @Get('signout')
  @UseGuards(AuthGuard)
  async signout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseType<() => null, AuthMessageType>> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err)
          reject({ message: 'Could not destroy session', state: 'error' })
        } else {
          res.clearCookie('connect.sid')
          resolve({ data: null, message: 'AUTH_SIGNOUT_SUCCESS', state: 'success' })
        }
      })
    })
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Session() session: SessionData,
  ): Promise<ResponseType<typeof this.authService.getAccountInformation, AuthMessageType>> {
    const user = await this.authService.getAccountInformation({
      user_id: session.user.id,
    })

    if (!user) {
      return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err)
            reject({ message: 'Could not destroy session', state: 'error' })
          } else {
            res.clearCookie('connect.sid', {
              httpOnly: true,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
            resolve({ message: 'AUTH_GET_ACCOUNT_INFORMATION_FAILED', state: 'error' })
          }
        })
      })
    }

    return { data: user, message: 'AUTH_GET_ACCOUNT_INFORMATION_SUCCESS', state: 'success' }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordDto,
  ): Promise<ResponseType<typeof this.authService.forgotPassword, AuthMessageType>> {
    const data = await this.authService.forgotPassword(body)

    if (data?.otp) {
      this.emailService.sendTestEmail({
        subject: TemplateText.forgot_password.subject,
        template: {
          args: {
            code: data?.otp[0]?.code,
          },
          name: 'forgot-password',
        },
        text: TemplateText.forgot_password.text,
        to: body.email,
      })
    }

    return { data: data?.user as never, message: 'AUTH_FORGOT_PASSWORD_EMAIL_SENT', state: 'success' }
  }

  @Post('reset-password')
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordDto,
  ): Promise<ResponseType<typeof this.authService.resetPassword, AuthMessageType>> {
    const data = await this.authService.resetPassword(body)
    return { data, message: 'AUTH_RESET_PASSWORD_SUCCESS', state: 'success' }
  }

  @Post('update-profile')
  async updateAccountInformation(
    @Body(new ZodValidationPipe(updateAccountInformationSchema)) body: UpdateAccountInformationDto,
  ): Promise<ResponseType<typeof this.authService.updateAccountInformation, AuthMessageType>> {
    const data = await this.authService.updateAccountInformation(body)
    return { data, message: 'AUTH_UPDATE_ACCOUNT_INFORMATION_SUCCESS', state: 'success' }
  }

  @Post('verify-code')
  async verifyEmail(@Body(new ZodValidationPipe(withIDSchema)) body: VerifyCodeDto) {
    const data = await this.authService.verifyCode(body)
    return { data, state: 'success' }
  }

  @Post('delete-account')
  async deleteAccount(
    @Body(new ZodValidationPipe(withIDSchema)) body: GetUserDto,
  ): Promise<ResponseType<typeof this.authService.deleteAccount, AuthMessageType>> {
    const data = await this.authService.deleteAccount(body)
    return { data, message: 'AUTH_DELETE_ACCOUNT_SUCCESS', state: 'success' }
  }
}
