import type { ConfirmEmailProps } from './emails/confirm-email'
import type { TokenExpiryEmailProps } from './emails/expiring-token'
import type { WelcomeEmailProps } from './emails/welcome'

export type EmailTemplate =
  | {
      name: 'welcome'
      args: WelcomeEmailProps
    }
  | {
      name: 'confirm-email'
      args: ConfirmEmailProps
    }
  | {
      name: 'forgot-password'
      args: ConfirmEmailProps
    }
  | {
      name: 'waitlist'
      args: {}
    }
  | {
      name: 'expiring-token'
      args: TokenExpiryEmailProps
    }
