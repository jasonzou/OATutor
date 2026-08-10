<script setup lang="ts">
// Renders a LaTeX string with MathJax (loaded in index.html). Emits the math
// wrapped in $$...$$ (inline) or \[...\] (display) and typesets just this node.
const props = defineProps<{ math?: string; display?: boolean }>()
const el = ref<HTMLElement | null>(null)

function delimited() {
  return props.display ? `\\[${props.math}\\]` : `$$${props.math}$$`
}

async function typeset() {
  const node = el.value
  const MJ = (window as unknown as { MathJax?: any }).MathJax
  if (!node || !MJ?.startup?.promise) return
  try {
    await MJ.startup.promise
    MJ.typesetClear?.([node])
    await MJ.typesetPromise([node])
  } catch {
    /* leave the raw delimited text visible */
  }
}

onMounted(typeset)
watch(() => [props.math, props.display], typeset)
</script>

<template>
  <!-- display math needs a block wrapper; inline math stays in a span -->
  <component
    :is="display ? 'div' : 'span'"
    v-if="typeof math === 'string' && math.length"
    ref="el"
  >{{ delimited() }}</component>
</template>
