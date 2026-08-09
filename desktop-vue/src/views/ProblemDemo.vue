<script setup lang="ts">
// ProblemCard demo against real content. Loads the processed content pool and
// renders the first step of a real problem. Route: /demo/problem
import ProblemCard from '@/components/problem-layout/ProblemCard.vue'
import { getContentPool, loadContentPool } from '@core/util/contentPool'

const ready = ref(false)
const problem = ref<any>(null)
const step = computed(() => problem.value?.steps?.[0])

onMounted(async () => {
  await loadContentPool()
  const pool = getContentPool() as any[]
  problem.value
    = pool.find(
      (p: any) =>
        p.courseName === 'OpenStax: Calculus Volume 1'
        && p.steps?.length
        && p.steps[0]?.hints?.DefaultPathway?.length,
    ) ?? pool.find((p: any) => p.steps?.length)
  ready.value = true
})

// BKT/mastery wiring arrives with Platform; no-op for the demo.
function answerMade(_i: number, _kcs: string[] | undefined, _correct: boolean) {}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <h2 class="text-xl font-bold mb-1">
      ProblemCard (Vue) — live content
    </h2>
    <p class="text-gray-500 mb-3">
      Step rendered with RenderText + ProblemInput + HintSystem; submit uses the
      shared checkAnswer.
    </p>

    <NSpin v-if="!ready" size="small" />
    <template v-else-if="problem">
      <div class="text-gray-500 mb-2">
        {{ problem.title }} · {{ problem.id }}
      </div>
      <ProblemCard
        :step="step"
        :problem-i-d="problem.id"
        :index="0"
        :seed="12345"
        :answer-made="answerMade"
      />
    </template>
    <NAlert v-else type="warning" :show-icon="false">
      No problem found in the pool.
    </NAlert>
  </div>
</template>
