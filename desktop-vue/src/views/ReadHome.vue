<script setup lang="ts">
// Reading mode home (Phase B adds the actual section reader). Lists the
// pre-rendered OpenStax sections by chapter; clicking opens the reader route.
import { availableBooks, chapters } from '@/shared/textbook'

const route = useRoute()
const router = useRouter()
const book = ref(route.params.book as string || availableBooks()[0]?.id || '')
const options = availableBooks().map(b => ({ label: b.id, value: b.id }))
const chapterList = computed(() => chapters(book.value))

function go(section: string) {
  router.push(`/read/${book.value}/${section}`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <div class="flex-y-center justify-between mb-4">
      <h2 class="text-xl font-bold m-0">
        Reading mode
      </h2>
      <NSelect
        v-if="options.length > 1"
        v-model:value="book"
        :options="options"
        size="small"
        class="w-60"
      />
    </div>
    <p class="text-gray-500 mb-4">
      OpenStax textbook sections (official cnx-transforms HTML, MathML via MathJax).
    </p>

    <NCollapse :default-expanded-names="['1']">
      <NCollapseItem
        v-for="ch in chapterList"
        :key="ch.num"
        :title="`Chapter ${ch.num}`"
        :name="String(ch.num)"
      >
        <ul class="list-none p-0 m-0">
          <li v-for="s in ch.sections" :key="s.section" class="py-1">
            <a
              class="text-[color:var(--n-color-target,#1976D2)] no-underline flex-y-center gap-2 cursor-pointer"
              @click.prevent="go(s.section)"
            >
              <span class="i-lucide-file-text text-14px opacity-60" />
              <span class="font-mono text-sm">{{ s.section }}</span>
              <span>{{ s.meta.title }}</span>
            </a>
          </li>
        </ul>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>
