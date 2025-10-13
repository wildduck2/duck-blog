import { schema } from '@acme/db'
import { ConfigService } from '@nestjs/config'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider'

export const drizzleProvider = [
  {
    inject: [ConfigService],
    provide: DrizzleAsyncProvider,
    useFactory: async (configService: ConfigService) => {
      const connectionString = configService.get<string>('DATABASE_URL')
      const pool = new Pool({ connectionString })
      const _drizzle = drizzle(pool, { casing: 'snake_case', schema }) as NodePgDatabase<typeof schema>
      console.log('✅ Drizzle Connection initialized')
      return _drizzle
    },
  },
]

export { schema }
