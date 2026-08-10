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
    vue({
      // mathlive registers <math-field> as a custom element; tell Vue's compiler
      // to pass it through instead of treating it as a Vue component.
      template: { compilerOptions: { isCustomElement: tag => tag === 'math-field' } },
    }),
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
      '@common': fileURLToPath(new URL('../common', import.meta.url)),
      '@generated': fileURLToPath(new URL('../generated', import.meta.url)),
    },
  },
  // Share the repo's public/ (mathjax, textbook, static figures) so the Vue app
  // renders content identically to the React app.
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  // Modern Sass API — silences the legacy-js-api deprecation warning.
  css: { preprocessorOptions: { scss: { api: 'modern' } } },
  build: { outDir: 'dist' },
  server: { port: 3002 },
})
