import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  dialect: 'postgresql',
  out: './migrations',
  schema: './src/tables.ts',
  verbose: true,
})
