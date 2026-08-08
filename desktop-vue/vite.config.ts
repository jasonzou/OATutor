// vite.config — modeled on showy-naive-starter (Vue + UnoCSS + auto-import +
// Naive UI component auto-resolve). @core points at the shared framework-agnostic
// OATutor core in the parent React app's src/, so this Vue app reuses it as-is.
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      dts: 'src/auto-imports.d.ts',
      imports: [
        'vue',
        'vue-router',
        { 'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'] },
      ],
    }),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [NaiveUiResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('../src', import.meta.url)),
      '@generated': fileURLToPath(new URL('../generated', import.meta.url)),
    },
  },
  build: { outDir: 'dist' },
  server: { port: 3002 },
})
