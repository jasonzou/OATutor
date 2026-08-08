<script setup lang="ts">
// Thin Vue wrapper around mathlive's <math-field> custom element. mathlive is
// framework-agnostic, so this is actually simpler than the React wrapper.
// `import 'mathlive'` (side effect) registers the <math-field> element.
import 'mathlive'
import type { MathfieldElement } from 'mathlive'

const props = defineProps<{
  modelValue?: string
  disabled?: boolean
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const mf = ref<MathfieldElement | null>(null)

function read() {
  return mf.value?.value ?? ''
}
function onInput() {
  emit('update:modelValue', read())
}

onMounted(() => {
  const el = mf.value
  if (!el) return
  el.mathVirtualKeyboardPolicy = 'auto'
  el.addEventListener('input', onInput)
  if (props.modelValue) el.value = props.modelValue
})

onBeforeUnmount(() => {
  mf.value?.removeEventListener('input', onInput)
})

// External value changes (e.g. reset) -> push into the field without re-emitting.
watch(
  () => props.modelValue,
  (v) => {
    if (mf.value && mf.value.value !== (v ?? '')) mf.value.value = v ?? ''
  },
)
</script>

<template>
  <math-field
    ref="mf"
    :disabled="disabled"
    style="display: block; width: 100%; border: 1px solid var(--n-border-color, #ccc); border-radius: 4px; padding: 4px 8px"
  />
</template>
