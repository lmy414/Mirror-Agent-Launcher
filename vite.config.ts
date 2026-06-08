import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [solid()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@bridge': resolve(__dirname, 'src/bridge'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
