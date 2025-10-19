import * as crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { otpCodes, users, words } from './tables'

/**
 * Helper function to hash passwords.
 * NOTE: In production, use bcrypt or Argon2 instead of sha256.
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
 * Helper function to get a random date within a given range.
 */
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

/**
 * Main seeding function
 */
async function seed() {
  try {
    console.log('🌱 Starting database seeding...')

    // Clear existing data
    console.log('🗑 Clearing existing data...')
    await db.delete(words)
    await db.delete(otpCodes)
    await db.delete(users)

    // Create Users
    console.log('👤 Seeding users...')
    const now = new Date()
    const usersData = [
      {
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        created_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        password_hash: hashPassword('password123'),
        is_active: true,
        settings: { notifications: true, theme: 'dark' },
        last_login_at: now,
      },
      {
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        username: 'janesmith',
        password_hash: hashPassword('password123'),
        is_active: true,
        settings: { notifications: false, theme: 'light' },
        last_login_at: new Date(Date.now() - 86400000),
      },
      {
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        email: 'bob.johnson@example.com',
        first_name: 'Bob',
        last_name: 'Johnson',
        username: 'bobjohnson',
        password_hash: hashPassword('password123'),
        is_active: false,
        settings: { notifications: true, theme: 'dark' },
        last_login_at: new Date(Date.now() - 2592000000),
      },
      {
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        email: 'alice.williams@example.com',
        first_name: 'Alice',
        last_name: 'Williams',
        username: 'alicewilliams',
        password_hash: hashPassword('password123'),
        is_active: true,
        settings: { notifications: true, theme: 'auto' },
        last_login_at: now,
      },
    ]

    const insertedUsers = await db.insert(users).values(usersData).returning()
    console.log(`   Created ${insertedUsers.length} users.`)

    // Map usernames to IDs to avoid FK issues
    const userMap: Record<string, string> = {}
    insertedUsers.forEach((u) => {
      userMap[u.username] = u.id
    })

    // Seed Words
    console.log('🗣 Seeding words...')
    const wordsData = [
      {
        category: 'cloud',
        literal: 'aws',
        translated: 'أمازون ويب سيرفيسز',
        language: 'ar',
        user_id: userMap['johndoe'],
      },
      {
        category: 'cloud',
        literal: 'azure',
        translated: 'مايكروسوفت أزور',
        language: 'ar',
        user_id: userMap['johndoe'],
      },
      {
        category: 'cloud',
        literal: 'gcp',
        translated: 'منصة جوجل السحابية',
        language: 'ar',
        user_id: userMap['johndoe'],
      },

      { category: 'framework', literal: 'react', translated: 'ريأكت', language: 'ar', user_id: userMap['janesmith'] },
      { category: 'framework', literal: 'vue', translated: 'فيو', language: 'ar', user_id: userMap['janesmith'] },
      { category: 'framework', literal: 'svelte', translated: 'سفيلت', language: 'ar', user_id: userMap['janesmith'] },

      { category: 'tool', literal: 'docker', translated: 'دوكر', language: 'ar', user_id: userMap['bobjohnson'] },
      {
        category: 'tool',
        literal: 'kubernetes',
        translated: 'كوبرنتس',
        language: 'ar',
        user_id: userMap['bobjohnson'],
      },
      {
        category: 'tool',
        literal: 'terraform',
        translated: 'تيرافورم',
        language: 'ar',
        user_id: userMap['bobjohnson'],
      },
    ]

    const insertedWords = await db.insert(words).values(wordsData).returning()
    console.log(`   Created ${insertedWords.length} words.`)

    // Seed OTP Codes
    console.log('🔐 Seeding OTP codes...')
    const otpCodesData = [
      {
        code: generateOTP(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_active: true,
        user_id: userMap['johndoe'],
      },
      {
        code: generateOTP(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        is_active: true,
        user_id: userMap['janesmith'],
      },
      {
        code: generateOTP(),
        expires_at: new Date(Date.now() - 5 * 60 * 1000),
        is_active: false,
        user_id: userMap['johndoe'],
      },
    ]

    const insertedOtpCodes = await db.insert(otpCodes).values(otpCodesData).returning()
    console.log(`   Created ${insertedOtpCodes.length} OTP codes.`)

    // Update login timestamps for active users
    console.log('📊 Updating user login history...')
    for (const user of insertedUsers.filter((u) => u.is_active)) {
      const loginDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), now)
      await db.update(users).set({ last_login_at: loginDate }).where(eq(users.id, user.id))
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Users: ${insertedUsers.length}`)
    console.log(`   - Words: ${insertedWords.length}`)
    console.log(`   - OTP Codes: ${insertedOtpCodes.length}`)

    console.log('\n🔒 Test Credentials:')
    console.log('   - Email: john.doe@example.com')
    console.log('   - Password: password123')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run seed
seed()
  .then(() => {
    console.log('\n✅ Seed script finished successfully.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('🔥 Seed script failed:', err)
    process.exit(1)
  })
