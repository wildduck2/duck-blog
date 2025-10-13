import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { and, eq, lte } from 'drizzle-orm/sql'
import { DrizzleAsyncProvider, schema } from './drizzle'
import { EmailService } from './email'

@Injectable()
export class CronService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private email: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async notifyExpiringTokens() {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // 1. Find tokens expiring in the next 24 hours and not notified yet
    const tokens = await this.db
      .select({
        email: schema.users.email,
        expires_at: schema.accessTokens.expires_at,
        id: schema.accessTokens.id,
        name: schema.accessTokens.name,
        notified: schema.accessTokens.notified,
      })
      .from(schema.accessTokens)
      .innerJoin(schema.users, eq(schema.users.id, schema.accessTokens.user_id))
      .where(and(lte(schema.accessTokens.expires_at, in24h), eq(schema.accessTokens.notified, false)))

    // 2. Send notifications
    for (const token of tokens) {
      await this.email.sendEmail({
        subject: 'Your Access Token is Expiring Soon',
        template: {
          args: {
            expiresAt: token.expires_at.toISOString(),
            tokenName: token.name,
          },
          name: 'expiring-token',
        },
        text: `Your token ${token.name} will expire at ${token.expires_at.toISOString()}. Please renew.`,
        to: token.email as string,
      })

      // 3. Mark token as notified
      await this.db.update(schema.accessTokens).set({ notified: true }).where(eq(schema.accessTokens.id, token.id))
    }
  }
}
