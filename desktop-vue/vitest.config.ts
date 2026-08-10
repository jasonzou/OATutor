// Vitest config. Mirrors the app's vite.config.ts aliases and the auto-import
// transform (store/composable modules rely on unplugin-auto-import for ref,
// computed, etc. — without it they throw "ref is not defined" under test).
// dts is disabled so test runs don't rewrite src/auto-imports.d.ts.
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    AutoImport({
      dts: false,
      imports: ['vue', 'vue-router'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('../src', import.meta.url)),
      '@common': fileURLToPath(new URL('../common', import.meta.url)),
      '@generated': fileURLToPath(new URL('../generated', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
