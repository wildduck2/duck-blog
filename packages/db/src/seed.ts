import * as crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { accessTokens, otpCodes, services, users } from './tables'

/**
 * Helper function to hash passwords.
 * NOTE: In a production environment, a stronger algorithm like bcrypt should be used.
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * Helper function to generate a random 6-digit OTP code.
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Helper function to generate a random 64-character hexadecimal token.
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Helper function to get a random element from an array.
 */
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Helper function to generate a random date within a given range.
 */
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

/**
 * Generate a date within a specific day
 */
function getRandomTimeInDay(date: Date): Date {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  return getRandomDate(dayStart, dayEnd)
}

/**
 * Main seed function to populate the database with realistic test data.
 */
async function seed() {
  try {
    console.log('🌱 Starting database seeding...')

    // Clear existing data to ensure a clean slate
    console.log('🗑 Clearing existing data...')
    await db.delete(accessTokens)
    await db.delete(otpCodes)
    await db.delete(services)
    await db.delete(users)

    // Seed Users with staggered registration dates
    console.log('👤 Seeding users...')
    const now = new Date()
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const insertedUsers = await db
      .insert(users)
      .values([
        {
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
          created_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000), // 85 days ago
          email: 'john.doe@example.com',
          first_name: 'John',
          is_active: true,
          last_login_at: new Date(),
          last_name: 'Doe',
          password_hash: hashPassword('password123'),
          settings: { notifications: true, theme: 'dark' },
          username: 'johndoe',
        },
        {
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
          created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago
          email: 'jane.smith@example.com',
          first_name: 'Jane',
          is_active: true,
          last_login_at: new Date(Date.now() - 86400000), // 1 day ago
          last_name: 'Smith',
          password_hash: '$2a$12$KWOOlMWzhjQ2wLFYzPJ04OxICnhkJajIapYeqq1WLIEUE/IOzT8mW',
          settings: { notifications: false, theme: 'light' },
          username: 'janesmith',
        },
        {
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          email: 'bob.johnson@example.com',
          first_name: 'Bob',
          is_active: false,
          last_login_at: new Date(Date.now() - 2592000000), // 30 days ago
          last_name: 'Johnson',
          password_hash: hashPassword('password123'),
          settings: { notifications: true, theme: 'dark' },
          username: 'bobjohnson',
        },
        {
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          email: 'alice.williams@example.com',
          first_name: 'Alice',
          is_active: true,
          last_name: 'Williams',
          password_hash: hashPassword('password123'),
          settings: { notifications: true, theme: 'auto' },
          username: 'alicewilliams',
        },
        {
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          email: 'charlie.brown@example.com',
          first_name: 'Charlie',
          is_active: true,
          last_name: 'Brown',
          password_hash: hashPassword('password123'),
          settings: { notifications: true, theme: 'dark' },
          username: 'charliebrown',
        },
      ])
      .returning()

    console.log(`   Created ${insertedUsers.length} users.`)

    // Seed Services
    console.log('🔧 Seeding services...')
    const insertedServices = await db
      .insert(services)
      .values([
        { description: 'GitHub API integration for repository management', name: 'GitHub' },
        { description: 'Google OAuth and API services', name: 'Google' },
        { description: 'Payment processing and subscription management', name: 'Stripe' },
        { description: 'Amazon Web Services cloud infrastructure', name: 'AWS' },
        { description: 'Email delivery service', name: 'SendGrid' },
      ])
      .returning()

    console.log(`   Created ${insertedServices.length} services.`)

    // Seed OTP Codes
    console.log('🔐 Seeding OTP codes...')
    const otpCodesData = insertedUsers.slice(0, 2).map((user) => ({
      code: generateOTP(),
      expires_at: new Date(Date.now() + 600000), // 10 minutes from now
      is_active: true,
      user_id: user.id,
    }))
    otpCodesData.push({
      code: generateOTP(),
      expires_at: new Date(Date.now() - 600000), // 10 minutes ago (expired)
      is_active: false,
      user_id: insertedUsers[0].id,
    })

    const insertedOtpCodes = await db.insert(otpCodes).values(otpCodesData).returning()
    console.log(`   Created ${insertedOtpCodes.length} OTP codes.`)

    // Seed Access Tokens with realistic daily distribution
    console.log('🔑 Seeding access tokens with daily distribution...')
    const accessTokensData = []
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago

    // Generate tokens for each day
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
      const currentDay = new Date(startDate)
      currentDay.setDate(currentDay.getDate() + dayOffset)

      // Vary the number of tokens per day (3-12 tokens per day)
      // More recent days tend to have slightly more tokens
      const recentnessBoost = dayOffset > 60 ? 1.5 : 1
      const tokensForDay = Math.floor((3 + Math.random() * 9) * recentnessBoost)

      for (let i = 0; i < tokensForDay; i++) {
        const randomUser = getRandomElement(insertedUsers)
        const randomService = getRandomElement(insertedServices)

        // Token created at a random time during this day
        const created_at = getRandomTimeInDay(currentDay)

        // Expiration: 50% expire in 30-60 days, 30% in 60-120 days, 20% in 7-30 days
        const expiryRandom = Math.random()
        let daysUntilExpiry: number

        if (expiryRandom < 0.2) {
          daysUntilExpiry = 7 + Math.random() * 23 // 7-30 days
        } else if (expiryRandom < 0.7) {
          daysUntilExpiry = 30 + Math.random() * 30 // 30-60 days
        } else {
          daysUntilExpiry = 60 + Math.random() * 60 // 60-120 days
        }

        const expires_at = new Date(created_at.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000)

        // Determine status based on expiration
        let status: 'active' | 'expired' | 'revoked' = 'active'

        if (expires_at < now) {
          status = 'expired'
        } else {
          // 10% chance of being revoked if still active
          if (Math.random() < 0.1) {
            status = 'revoked'
          }
        }

        // Some tokens might be renewed
        const wasRenewed = status === 'active' && Math.random() < 0.15
        const renewed_at = wasRenewed
          ? new Date(created_at.getTime() + Math.random() * (now.getTime() - created_at.getTime()))
          : null

        accessTokensData.push({
          created_at,
          expires_at,
          name: `${randomService.name} Token - ${currentDay.toISOString().split('T')[0]}`,
          notified: status === 'expired' && Math.random() < 0.7, // 70% of expired tokens notified
          renewed_at,
          service_id: randomService.id,
          status,
          token: generateToken(),
          // 15% chance of being a service-level token (no user)
          user_id: Math.random() < 0.15 ? null : randomUser.id,
        })
      }
    }

    const insertedTokens = await db.insert(accessTokens).values(accessTokensData).returning()
    console.log(`   Created ${insertedTokens.length} access tokens.`)

    // Add some user login history
    console.log('📊 Updating user login history...')
    for (const user of insertedUsers.filter((u) => u.is_active)) {
      // Simulate multiple logins over the past 30 days
      const loginDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), now)
      await db.update(users).set({ last_login_at: loginDate }).where(eq(users.id, user.id))
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Users: ${insertedUsers.length}`)
    console.log(`   - Services: ${insertedServices.length}`)
    console.log(`   - OTP Codes: ${insertedOtpCodes.length}`)
    console.log(`   - Access Tokens: ${insertedTokens.length}`)

    // Calculate statistics
    const activeTokens = insertedTokens.filter((t) => t.status === 'active' && t.expires_at > now).length
    const expiredTokens = insertedTokens.filter((t) => t.expires_at < now).length
    const revokedTokens = insertedTokens.filter((t) => t.status === 'revoked').length
    const expiringSoon = insertedTokens.filter(
      (t) =>
        t.status === 'active' && t.expires_at > now && t.expires_at < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ).length

    console.log('\n📈 Token Statistics:')
    console.log(`   - Active: ${activeTokens}`)
    console.log(`   - Expired: ${expiredTokens}`)
    console.log(`   - Revoked: ${revokedTokens}`)
    console.log(`   - Expiring Soon (30 days): ${expiringSoon}`)

    console.log('\n🔒 Test Credentials:')
    console.log('   - Email: john.doe@example.com')
    console.log('   - Password: password123')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n✅ Seed script finished successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('🔥 Seed script failed:', error)
    process.exit(1)
  })
