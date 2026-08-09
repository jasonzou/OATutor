<script setup lang="ts">
// Multi-step Problem demo with live BKT. Loads the pool + BKT params + skill
// model, injects step KCs (as Platform does in React), and runs the Problem
// loop. Route: /demo/lesson
import { loadContentPool, getContentPool } from '@core/util/contentPool'
import bktParamsJson from '@core/content-sources/oatutor/bkt-params/defaultBKTParams.json'
import skillModel from '@core/content-sources/oatutor/skillModel.json'
import { cleanArray } from '@core/util/cleanObject'
import Problem from '@/components/problem-layout/Problem.vue'

const ready = ref(false)
const problems = ref<any[]>([])
const idx = ref(0)
// Held by the parent so BKT mastery persists across problems (mutated in place).
const bkt = reactive(JSON.parse(JSON.stringify(bktParamsJson)))

const problem = computed(() => problems.value[idx.value])

const skillModelMap = skillModel as Record<string, string[]>

function injectKCs(p: any) {
  p.steps?.forEach((s: any) => {
    if (!s.knowledgeComponents)
      s.knowledgeComponents = cleanArray(skillModelMap[s.id] || [])
  })
  return p
}
const lesson = computed(() => {
  const p = problem.value
  if (!p) return {}
  const kcs = new Set<string>()
  p.steps?.forEach((s: any) =>
    (s.knowledgeComponents || []).forEach((k: string) => kcs.add(k)),
  )
  const learningObjectives: Record<string, number> = {}
  kcs.forEach((k) => {
    if (bkt[k]) learningObjectives[k] = 0.95
  })
  return {
    courseName: p.courseName,
    learningObjectives,
    giveStuFeedback: true,
    giveStuHints: true,
    giveStuBottomHint: true,
  }
})

onMounted(async () => {
  await loadContentPool()
  const pool = (getContentPool() as any[]).filter(
    p => p.courseName === 'OpenStax: Calculus Volume 1' && p.steps?.length,
  )
  pool.forEach(injectKCs)
  problems.value = pool
  ready.value = true
})

function onComplete() {
  if (problems.value.length)
    idx.value = (idx.value + 1) % problems.value.length
}
</script>

<template>
  <div class="mt-20 text-center">
    <NSpin v-if="!ready" />
  </div>
  <Problem
    v-if="ready && problem"
    :key="problem.id"
    :problem="problem"
    :lesson="lesson"
    :bkt-params="bkt"
    :seed="12345"
    @problem-complete="onComplete"
  />
  <NAlert v-else-if="ready" type="warning" :show-icon="false" class="mx-auto max-w-2xl mt-10">
    No multi-step Calculus problems found in the pool.
  </NAlert>
</template>
