// uno.config — modeled on showy-naive-starter. rem->px (base 14), iconify icons
// (lucide), attributify + typography presets, and a few layout shortcuts.
import presetRemToPx from '@unocss/preset-rem-to-px'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then(i => i.default),
      },
    }),
    presetAttributify(),
    presetTypography(),
    presetRemToPx({ baseFontSize: 14 }),
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-y-center': 'flex items-center',
    'flex-x-center': 'flex justify-center',
    'h-header': 'h-15',
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
})
