import { Inject, Injectable } from '@nestjs/common'
import { and, count, desc, eq, gt, gte, isNull, lt, lte, sql } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DrizzleAsyncProvider, schema } from '~/drizzle'

const { accessTokens, users, services, otpCodes } = schema

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async getTokenOverview() {
    const now = new Date()
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const result = await this.drizzle
      .select({
        active: count(
          sql`CASE WHEN ${accessTokens.expires_at} >= ${now} AND ${accessTokens.deleted_at} IS NULL THEN 1 END`,
        ),
        deleted: count(sql`CASE WHEN ${accessTokens.deleted_at} IS NOT NULL THEN 1 END`),
        expired: count(sql`CASE WHEN ${accessTokens.expires_at} < ${now} THEN 1 END`),
        expiringSoon: count(
          sql`CASE WHEN ${accessTokens.expires_at} BETWEEN ${now} AND ${thirtyDaysFromNow} AND ${accessTokens.deleted_at} IS NULL THEN 1 END`,
        ),
        total: count(),
      })
      .from(accessTokens)

    return result[0]
  }

  async getTokensByStatus() {
    return await this.drizzle
      .select({
        count: count(),
        status: accessTokens.status,
      })
      .from(accessTokens)
      .where(isNull(accessTokens.deleted_at))
      .groupBy(accessTokens.status)
  }

  async getTokensByService() {
    const now = new Date()

    return await this.drizzle
      .select({
        activeTokens: count(
          sql`CASE WHEN ${accessTokens.expires_at} >= ${now} AND ${accessTokens.deleted_at} IS NULL THEN 1 END`,
        ),
        expiredTokens: count(sql`CASE WHEN ${accessTokens.expires_at} < ${now} THEN 1 END`),
        serviceDescription: services.description,
        serviceId: services.id,
        serviceName: services.name,
        totalTokens: count(),
      })
      .from(accessTokens)
      .innerJoin(services, eq(accessTokens.service_id, services.id))
      .where(isNull(services.deleted_at))
      .groupBy(services.id, services.name, services.description)
      .orderBy(desc(count()))
  }

  async getTokensExpiringInDays(days: number = 30) {
    const now = new Date()
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    return await this.drizzle
      .select({
        daysUntilExpiry: sql<number>`EXTRACT(DAY FROM ${accessTokens.expires_at} - ${now})`,
        expiresAt: accessTokens.expires_at,
        id: accessTokens.id,
        name: accessTokens.name,
        serviceName: services.name,
        status: accessTokens.status,
        userEmail: users.email,
        userName: sql<string>`CONCAT(${users.first_name}, ' ', ${users.last_name})`,
      })
      .from(accessTokens)
      .innerJoin(services, eq(accessTokens.service_id, services.id))
      .leftJoin(users, eq(accessTokens.user_id, users.id))
      .where(
        and(isNull(accessTokens.deleted_at), gt(accessTokens.expires_at, now), lt(accessTokens.expires_at, futureDate)),
      )
      .orderBy(accessTokens.expires_at)
  }

  async getUserTokenStats(limit: number = 10) {
    const now = new Date()

    return await this.drizzle
      .select({
        activeTokens: count(
          sql`CASE WHEN ${accessTokens.expires_at} >= ${now} AND ${accessTokens.deleted_at} IS NULL THEN 1 END`,
        ),
        email: users.email,
        expiredTokens: count(sql`CASE WHEN ${accessTokens.expires_at} < ${now} THEN 1 END`),
        totalTokens: count(),
        userId: users.id,
        userName: sql<string>`CONCAT(${users.first_name}, ' ', ${users.last_name})`,
      })
      .from(users)
      .leftJoin(accessTokens, eq(users.id, accessTokens.user_id))
      .where(isNull(users.deleted_at))
      .groupBy(users.id, users.first_name, users.last_name, users.email)
      .having(gt(count(), 0))
      .orderBy(desc(count()))
      .limit(limit)
  }

  async getTokensNeedingNotification() {
    const now = new Date()

    return await this.drizzle
      .select({
        expiresAt: accessTokens.expires_at,
        id: accessTokens.id,
        name: accessTokens.name,
        serviceName: services.name,
        status: accessTokens.status,
        userEmail: users.email,
      })
      .from(accessTokens)
      .innerJoin(services, eq(accessTokens.service_id, services.id))
      .leftJoin(users, eq(accessTokens.user_id, users.id))
      .where(and(isNull(accessTokens.deleted_at), lt(accessTokens.expires_at, now), eq(accessTokens.notified, false)))
      .orderBy(accessTokens.expires_at)
  }

  async getTokenRenewalStats() {
    const result = await this.drizzle
      .select({
        avgRenewalTimeSeconds: sql<number>`AVG(EXTRACT(EPOCH FROM (${accessTokens.renewed_at} - ${accessTokens.created_at})))`,
        renewedThisMonth: count(
          sql`CASE WHEN ${accessTokens.renewed_at} >= DATE_TRUNC('month', CURRENT_TIMESTAMP) THEN 1 END`,
        ),
        totalRenewed: count(sql`CASE WHEN ${accessTokens.renewed_at} IS NOT NULL THEN 1 END`),
      })
      .from(accessTokens)
      .where(isNull(accessTokens.deleted_at))

    return result[0]
  }

  async getOtpCodeStats() {
    const now = new Date()

    const result = await this.drizzle
      .select({
        active: count(
          sql`CASE WHEN ${otpCodes.is_active} = true AND ${otpCodes.expires_at} >= ${now} AND ${otpCodes.deleted_at} IS NULL THEN 1 END`,
        ),
        deleted: count(sql`CASE WHEN ${otpCodes.deleted_at} IS NOT NULL THEN 1 END`),
        expired: count(sql`CASE WHEN ${otpCodes.expires_at} < ${now} THEN 1 END`),
        total: count(),
      })
      .from(otpCodes)

    return result[0]
  }

  async getActiveUsersStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const result = await this.drizzle
      .select({
        activeUsers: count(sql`CASE WHEN ${users.is_active} = true AND ${users.deleted_at} IS NULL THEN 1 END`),
        deletedUsers: count(sql`CASE WHEN ${users.deleted_at} IS NOT NULL THEN 1 END`),
        recentlyActive: count(sql`CASE WHEN ${users.last_login_at} >= ${thirtyDaysAgo} THEN 1 END`),
        totalUsers: count(),
      })
      .from(users)

    return result[0]
  }

  /**
   * Get time series data for tokens and users
   * @param days Number of days to look back (7, 30, or 90)
   */
  async getTimeSeriesData(days: number = 30) {
    const now = new Date()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get daily token creation stats
    const tokenTimeSeries = await this.drizzle
      .select({
        activeCreated: count(sql`CASE WHEN ${accessTokens.expires_at} >= ${now} THEN 1 END`),
        date: sql<string>`DATE(${accessTokens.created_at})`,
        totalCreated: count(),
      })
      .from(accessTokens)
      .where(and(gte(accessTokens.created_at, startDate), lte(accessTokens.created_at, now)))
      .groupBy(sql`DATE(${accessTokens.created_at})`)
      .orderBy(sql`DATE(${accessTokens.created_at})`)

    // Get daily user registration stats
    const userTimeSeries = await this.drizzle
      .select({
        date: sql<string>`DATE(${users.created_at})`,
        totalRegistered: count(),
      })
      .from(users)
      .where(and(gte(users.created_at, startDate), lte(users.created_at, now)))
      .groupBy(sql`DATE(${users.created_at})`)
      .orderBy(sql`DATE(${users.created_at})`)

    // Get daily login activity stats
    const loginTimeSeries = await this.drizzle
      .select({
        date: sql<string>`DATE(${users.last_login_at})`,
        totalLogins: count(),
      })
      .from(users)
      .where(
        and(
          sql`${users.last_login_at} IS NOT NULL`,
          gte(users.last_login_at, startDate),
          lte(users.last_login_at, now),
        ),
      )
      .groupBy(sql`DATE(${users.last_login_at})`)
      .orderBy(sql`DATE(${users.last_login_at})`)

    // Fill in missing dates with zero values
    const allDates: string[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      allDates.push(date.toISOString().split('T')[0])
    }

    const timeSeriesData = allDates.map((date) => {
      const tokenData = tokenTimeSeries.find((t) => t.date === date)
      const userData = userTimeSeries.find((u) => u.date === date)
      const loginData = loginTimeSeries.find((l) => l.date === date)

      return {
        activeTokensCreated: tokenData?.activeCreated || 0,
        date,
        tokensCreated: tokenData?.totalCreated || 0,
        userLogins: loginData?.totalLogins || 0,
        usersRegistered: userData?.totalRegistered || 0,
      }
    })

    return timeSeriesData
  }

  /**
   * Calculate percentage change compared to previous period
   */
  async getPercentageChanges() {
    const now = new Date()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Current period (last 30 days)
    const currentPeriod = await this.drizzle
      .select({
        activeTokens: count(sql`CASE WHEN ${accessTokens.expires_at} >= ${now} THEN 1 END`),
        expiringSoon: count(
          sql`CASE WHEN ${accessTokens.expires_at} BETWEEN ${now} AND ${sql`${now}::timestamp + INTERVAL '30 days'`} THEN 1 END`,
        ),
        totalTokens: count(),
      })
      .from(accessTokens)
      .where(and(gte(accessTokens.created_at, thirtyDaysAgo), isNull(accessTokens.deleted_at)))

    // Previous period (30-60 days ago)
    const previousPeriod = await this.drizzle
      .select({
        activeTokens: count(sql`CASE WHEN ${accessTokens.expires_at} >= ${thirtyDaysAgo} THEN 1 END`),
        totalTokens: count(),
      })
      .from(accessTokens)
      .where(
        and(
          gte(accessTokens.created_at, sixtyDaysAgo),
          lt(accessTokens.created_at, thirtyDaysAgo),
          isNull(accessTokens.deleted_at),
        ),
      )

    // User stats
    const currentUsers = await this.drizzle
      .select({ count: count() })
      .from(users)
      .where(gte(users.created_at, thirtyDaysAgo))

    const previousUsers = await this.drizzle
      .select({ count: count() })
      .from(users)
      .where(and(gte(users.created_at, sixtyDaysAgo), lt(users.created_at, thirtyDaysAgo)))

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      activeTokensChange: calculateChange(currentPeriod[0]?.activeTokens || 0, previousPeriod[0]?.activeTokens || 0),
      expiringSoonChange: calculateChange(
        currentPeriod[0]?.expiringSoon || 0,
        0, // No previous comparison for expiring soon
      ),
      totalTokensChange: calculateChange(currentPeriod[0]?.totalTokens || 0, previousPeriod[0]?.totalTokens || 0),
      totalUsersChange: calculateChange(currentUsers[0]?.count || 0, previousUsers[0]?.count || 0),
    }
  }

  async getComprehensiveDashboard(timeRange: 'week' | 'month' | 'quarter' = 'month') {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90

    const [
      overview,
      byStatus,
      byService,
      expiringTokens,
      userStats,
      renewalStats,
      otpStats,
      activeUsersStats,
      needingNotification,
      timeSeriesData,
      percentageChanges,
    ] = await Promise.all([
      this.getTokenOverview(),
      this.getTokensByStatus(),
      this.getTokensByService(),
      this.getTokensExpiringInDays(30),
      this.getUserTokenStats(10),
      this.getTokenRenewalStats(),
      this.getOtpCodeStats(),
      this.getActiveUsersStats(),
      this.getTokensNeedingNotification(),
      this.getTimeSeriesData(days),
      this.getPercentageChanges(),
    ])

    return {
      otp: otpStats,
      percentageChanges,
      timeSeries: timeSeriesData,
      timestamp: new Date().toISOString(),
      tokens: {
        byService,
        byStatus,
        expiringSoon: expiringTokens,
        needingNotification,
        overview,
        renewalStats,
      },
      users: {
        stats: activeUsersStats,
        topUsers: userStats,
      },
    }
  }
}
