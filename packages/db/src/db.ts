import 'dotenv/config'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as relations from './relations'
import * as tables from './tables'

const schema = {
  ...tables,
  ...relations,
}

const client = new Pool({
  connectionString: process.env.DATABASE_URL as string,
})

export const db = drizzle(client, { casing: 'snake_case', schema })

export { schema }
export type DrizzleSchema = typeof schema
