<script setup lang="ts">
// Section reader (Phase B): fetches the official cnx-transforms fragment for
// the section (public/textbook/<dir>/<section>.html), injects it, and typesets
// its MathML with MathJax (tex-mml-chtml build loaded in index.html).
import { openExternalOnClick } from '@core/util/openExternal'
import { contentDirFor, flatSections, sectionMeta } from '@/shared/textbook'

const route = useRoute()
const router = useRouter()

const book = computed(() => route.params.book as string)
const section = computed(() => route.params.section as string)
const meta = computed(() => sectionMeta(book.value, section.value))
const dir = computed(() => contentDirFor(book.value))

const contentEl = ref<HTMLElement | null>(null)
const html = ref<string | null>(null)
const error = ref<string | null>(null)

const flat = computed(() => flatSections(book.value))
const posIdx = computed(() => flat.value.indexOf(section.value))
const prev = computed(() => (posIdx.value > 0 ? flat.value[posIdx.value - 1] : null))
const next = computed(() =>
  posIdx.value >= 0 && posIdx.value < flat.value.length - 1 ? flat.value[posIdx.value + 1] : null,
)

watchEffect(async () => {
  if (!dir.value || !section.value) return
  error.value = null
  html.value = null
  try {
    const r = await fetch(
      `${import.meta.env.BASE_URL}textbook/${dir.value}/${section.value}.html`,
    )
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    html.value = rewriteMediaPaths(await r.text(), dir.value)
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
})

// The staged fragments reference figures as "media/..." relative to their own
// directory (public/textbook/<dir>/), but they're injected into the app document
// at the site root. Rewrite to the absolute public path so images actually load.
function rewriteMediaPaths(html: string, dir: string): string {
  const prefix = `${import.meta.env.BASE_URL}textbook/${dir}/media/`
  return html
    .replace(/src="media\//g, `src="${prefix}`)
    .replace(/src='media\//g, `src='${prefix}`)
    .replace(/url\(media\//g, `url(${prefix}`)
}

// Typeset after the fragment is injected.
watchEffect(async () => {
  if (!html.value || !contentEl.value) return
  const MJ = (window as any).MathJax
  if (!MJ?.startup?.promise) return
  try {
    await MJ.startup.promise
    await MJ.typesetPromise([contentEl.value])
  } catch {
    /* typesetting failures leave readable raw markup */
  }
})
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <!-- header -->
    <div class="flex-y-center justify-between mb-2">
      <NButton quaternary size="small" @click="router.push('/read')">
        <template #icon>
          <span class="i-lucide-arrow-left" />
        </template>
        Contents
      </NButton>
      <a
        v-if="meta?.url"
        :href="meta.url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-[#1976D2] flex-y-center gap-1"
        @click="openExternalOnClick(meta.url)"
      >
        Open in OpenStax
        <span class="i-lucide-external-link text-12px" />
      </a>
    </div>
    <h2 class="text-2xl font-bold mb-1">
      <span class="font-mono text-xl text-gray-400 mr-2">{{ section }}</span>
      <span>{{ meta?.title ?? 'Section' }}</span>
    </h2>
    <NDivider style="margin: 8px 0 16px" />

    <NSpin v-if="!html && !error" class="block mx-auto mt-10" />
    <NAlert v-else-if="error" type="error" :show-icon="false">
      Failed to load this section ({{ error }}).
    </NAlert>

    <!-- CNX fragment -->
    <div v-else ref="contentEl" class="cnx-content" v-html="html" />

    <!-- prev / next -->
    <div class="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
      <NButton v-if="prev" quaternary size="small" @click="router.push(`/read/${book}/${prev}`)">
        <template #icon>
          <span class="i-lucide-chevron-left" />
        </template>
        {{ prev }}
      </NButton>
      <span v-else />
      <NButton v-if="next" quaternary size="small" @click="router.push(`/read/${book}/${next}`)">
        {{ next }}
        <template #icon>
          <span class="i-lucide-chevron-right" />
        </template>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
/* Style the official CNX/HTML5 output (data-type attributes). */
.cnx-content :deep([data-type='document-title']) {
  display: none; /* we render our own header */
}
.cnx-content :deep([data-type='abstract']) {
  background: rgba(125, 125, 125, 0.08);
  border-left: 3px solid #1976d2;
  border-radius: 4px;
  padding: 8px 12px;
  margin: 0 0 16px;
  font-size: 0.95em;
}
.cnx-content :deep(figure) {
  margin: 16px auto;
  text-align: center;
}
.cnx-content :deep(figure img) {
  max-width: 100%;
  height: auto;
}
.cnx-content :deep(figcaption) {
  font-size: 0.85em;
  color: #888;
  margin-top: 4px;
}
.cnx-content :deep([data-type='exercise']) {
  border: 1px solid rgba(125, 125, 125, 0.3);
  border-radius: 6px;
  padding: 8px 14px;
  margin: 12px 0;
}
.cnx-content :deep([data-type='exercise'] > [data-type='problem']) {
  font-weight: 500;
}
.cnx-content :deep(table) {
  border-collapse: collapse;
  margin: 12px auto;
}
.cnx-content :deep(td),
.cnx-content :deep(th) {
  border: 1px solid rgba(125, 125, 125, 0.4);
  padding: 4px 10px;
}
.cnx-content :deep(math[display='block']) {
  display: block;
  margin: 10px 0;
  overflow-x: auto;
}
</style>
