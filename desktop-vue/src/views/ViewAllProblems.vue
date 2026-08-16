<script setup lang="ts">
// ViewAllProblems (ported). Read/browse mode for a lesson: renders every problem
// in the lesson with interactive inputs but NO mastery/progress effects — a
// local throwaway copy of the BKT params is used so browsing never touches saved
// progress. Route: /lessons/:id/problems
import { useRoute, useRouter } from 'vue-router'
import { getContentPool, loadContentPool } from '@core/util/contentPool'
import bktParamsJson from '@core/content-sources/oatutor/bkt-params/defaultBKTParams.json'
import coursePlans from '@core/content-sources/oatutor/coursePlans.json'
import type { BKTParams, LessonPlan, PoolProblem } from '@/shared/types'
import Problem from '@/components/problem-layout/Problem.vue'

const route = useRoute()
const router = useRouter()

const ready = ref(false)
const problems = ref<PoolProblem[]>([])
const seed = Date.now()
// Isolated, non-persisted params: answering while browsing must not affect
// saved mastery (the React version shared App-level params; we keep it local).
const bkt = reactive(JSON.parse(JSON.stringify(bktParamsJson)) as Record<string, BKTParams>)

const lesson = computed<LessonPlan | null>(() => {
  const id = route.params.id as string
  const plans = coursePlans as unknown as Array<{ courseName?: string; lessons?: LessonPlan[] }>
  for (const c of plans) {
    const l = (c.lessons || []).find(x => x.id === id)
    if (l) return { ...l, courseName: c.courseName ?? l.courseName }
  }
  return null
})

onMounted(async () => {
  await loadContentPool()
  problems.value = (getContentPool() as PoolProblem[]).filter(
    p => p.lessonId === lesson.value?.id && p.steps?.length,
  )
  ready.value = true
})

const topicsText = computed(() => {
  const t = lesson.value?.topics
  if (!t) return ''
  return Array.isArray(t) ? t.join(', ') : String(t)
})

function back() {
  router.push(lesson.value ? `/lessons/${lesson.value.id}` : '/')
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex-y-center justify-between mb-3">
      <NButton quaternary size="small" @click="back">
        <template #icon>
          <span class="i-lucide-arrow-left" />
        </template>
        Back to lesson
      </NButton>
      <div class="text-sm text-gray-500">
        {{ problems.length }} problems
      </div>
    </div>

    <h1 v-if="lesson" class="text-xl font-bold mb-1">
      {{ lesson.name?.replace(/##/g, '') }}
      <span v-if="topicsText" class="font-normal text-gray-500">: {{ topicsText }}</span>
    </h1>
    <NDivider style="margin: 8px 0 16px" />

    <div v-if="!ready" class="text-center mt-10">
      <NSpin />
    </div>
    <NAlert v-else-if="!problems.length" type="info" :show-icon="false">
      No problems found for this lesson.
    </NAlert>

    <div v-for="p in problems" :key="p.id" class="mb-6 relative">
      <!-- ID badge -->
      <span
        class="absolute top-2 right-2 z-10 text-xs px-2 py-0.5 rounded bg-white/80 dark:bg-gray-800/80 text-gray-500"
      >
        {{ p.id }}
      </span>
      <Problem
        :problem="p"
        :lesson="lesson!"
        :bkt-params="bkt"
        :seed="seed"
        :auto-scroll="false"
        :browse="true"
      />
    </div>
  </div>
</template>
