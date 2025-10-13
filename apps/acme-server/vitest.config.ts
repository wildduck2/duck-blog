import path from 'node:path'
import config from '@acme/vitest-config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  ...config,
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
    environment: 'node',
    globals: true,
    include: ['./**/*.test.ts'],
  },
})
