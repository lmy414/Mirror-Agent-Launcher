import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'dist-electron', 'release'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@bridge': path.resolve(__dirname, 'src/bridge'),
    },
  },
})
