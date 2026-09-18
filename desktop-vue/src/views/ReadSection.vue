<script setup lang="ts">
// Section reader: renders the same pre-rendered fragment (and with the same
// component/styling/typesetting) as the in-question section panel — the only
// difference is page chrome (header, Contents nav, prev/next).
import { openExternalOnClick } from '@core/util/openExternal'
import { flatSections, sectionMeta } from '@/shared/textbook'
import SectionContent from '@/components/SectionContent.vue'

const route = useRoute()
const router = useRouter()

const book = computed(() => route.params.book as string)
const section = computed(() => route.params.section as string)
const meta = computed(() => sectionMeta(book.value, section.value))

const flat = computed(() => flatSections(book.value))
const posIdx = computed(() => flat.value.indexOf(section.value))
const prev = computed(() => (posIdx.value > 0 ? flat.value[posIdx.value - 1] : null))
const next = computed(() =>
  posIdx.value >= 0 && posIdx.value < flat.value.length - 1 ? flat.value[posIdx.value + 1] : null,
)
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

    <SectionContent :book-id="book" :section="section" hide-title />

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
