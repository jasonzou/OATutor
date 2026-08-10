<script setup lang="ts">
// Renders a pre-rendered OpenStax section (public/textbook/<book>/<section>.html,
// produced by src/tools/renderOpenstaxSections.js) and typesets its $$ LaTeX with
// the app's MathJax instance. Content-only: page chrome (headers, back nav) is
// the caller's job, so this can back both the question-view panel and a future
// /textbook route.
const props = defineProps<{ bookId: string; section: string }>()

const el = ref<HTMLElement | null>(null)
const html = ref<string | null>(null)
const error = ref<string | null>(null)

async function load() {
  html.value = null
  error.value = null
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}textbook/${props.bookId}/${props.section}.html`)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    html.value = await res.text()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
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

onMounted(load)
watch(() => [props.bookId, props.section], load)
watch(html, () => {
  if (html.value && el.value) nextTick(typeset)
})
</script>

<template>
  <div>
    <p v-if="error" class="text-sm text-red-600">Failed to load this section ({{ error }}).</p>
    <p v-if="!html && !error" class="text-sm text-gray-500">Loading…</p>
    <div ref="el" class="cnx-content" v-html="html ?? undefined" />
  </div>
</template>
