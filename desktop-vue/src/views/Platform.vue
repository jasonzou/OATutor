<script setup lang="ts">
// Platform (ported). The full per-lesson runner: loads the lesson's problems,
// runs BKT on first attempts, and auto-selects the next problem via the
// lowest-mastery heuristic. The heuristic is ported inline because the @core
// defaultHeuristic.js imports the React app's config.js (which imports React),
// so importing it would pull React into this bundle. Renders Problem; handles
// graduation / exhaustion. Route: /lessons/:id
import { useRoute, useRouter } from 'vue-router'
import { loadContentPool, getContentPool } from '@core/util/contentPool'
import bktParamsJson from '@core/content-sources/oatutor/bkt-params/defaultBKTParams.json'
import skillModel from '@core/content-sources/oatutor/skillModel.json'
import coursePlans from '@core/content-sources/oatutor/coursePlans.json'
import { cleanArray } from '@core/util/cleanObject'
import { MASTERY_THRESHOLD } from '@/shared/config'
import { useLocaleStore } from '@/shared/store/locale'
import { applyMasterySnapshot, snapshotMastery, useProgressStore } from '@/shared/store/progress'
import type { BKTParams, LessonPlan, PoolProblem } from '@/shared/types'
import Problem from '@/components/problem-layout/Problem.vue'

const route = useRoute()
const router = useRouter()
const locale = useLocaleStore()
const progress = useProgressStore()
// Pristine defaults to diff mastery against (never mutated).
const bktDefaults = bktParamsJson as Record<string, { probMastery: number }>

// skillModel.json is generated content: step id -> KC ids.
const skillModelMap = skillModel as Record<string, string[]>

type Status = 'loading' | 'learning' | 'graduated' | 'exhausted' | 'missing'

const status = ref<Status>('loading')
const mastery = ref(0)
const lessonProblems = ref<PoolProblem[]>([])
const bkt = reactive<Record<string, BKTParams>>(
  JSON.parse(JSON.stringify(bktParamsJson)) as Record<string, BKTParams>,
)
const completed = reactive(new Set<string>())
const currProblem = ref<PoolProblem | null>(null)
const seed = ref(Date.now())

const lesson = computed<LessonPlan | null>(() => {
  const id = route.params.id as string
  const plans = coursePlans as unknown as Array<{ courseName: string; language?: string; lessons?: LessonPlan[] }>
  for (const c of plans) {
    const l = (c.lessons || []).find((x) => x.id === id)
    if (l) return { ...l, courseName: c.courseName, language: c.language }
  }
  return null
})

/** Lowest-mastery heuristic (port of defaultHeuristic — see header note). */
function heuristic(problems: PoolProblem[]): PoolProblem | undefined {
  let chosen: PoolProblem[] = []
  for (const p of problems) {
    if (completed.has(p.id) || p.probMastery == null || p.probMastery >= MASTERY_THRESHOLD)
      continue
    if (chosen.length === 0 || chosen[0].probMastery! > p.probMastery)
      chosen = [p]
    else if (chosen[0].probMastery === p.probMastery)
      chosen.push(p)
  }
  return chosen[Math.floor(Math.random() * chosen.length)]
}

/** Compute per-problem mastery, then pick the next problem (or terminal status). */
function nextProblem() {
  const l = lesson.value
  if (!l) {
    status.value = 'missing'
    return
  }
  const objectives = Object.keys(l.learningObjectives || {})
  for (const p of lessonProblems.value) {
    let probMastery = 1
    let relevant = false
    if (p.lessonId === l.id) relevant = true
    for (const s of p.steps || []) {
      for (const kc of cleanArray(s.knowledgeComponents || [])) {
        if (!bkt[kc]) continue
        if (kc in (l.learningObjectives || {})) relevant = true
        probMastery *= bkt[kc].probMastery
      }
    }
    p.probMastery = relevant ? probMastery : null
  }

  const score = objectives.length
    ? objectives.reduce((acc, kc) => acc + (bkt[kc]?.probMastery ?? 0), 0) / objectives.length
    : 0
  mastery.value = score

  // Graduation: every tracked skill above threshold (mirrors the React app —
  // broad by design, so exhaustion is the usual completion path).
  const graduated = !Object.keys(bkt).some(k => bkt[k].probMastery <= MASTERY_THRESHOLD)
  if (graduated) {
    status.value = 'graduated'
    currProblem.value = null
    return
  }

  let chosen = heuristic(lessonProblems.value)
  if (!chosen) {
    if (!l.allowRecycle) {
      status.value = 'exhausted'
      currProblem.value = null
      return
    }
    completed.clear()
    chosen = heuristic(lessonProblems.value)
  }
  if (chosen) {
    currProblem.value = chosen
    status.value = 'learning'
  }
}

onMounted(async () => {
  const l = lesson.value
  if (!l) {
    status.value = 'missing'
    return
  }
  // Enter the course for locale purposes (mirrors the React Platform).
  if (l.courseName) locale.enterCourse(l.courseName, l.language)

  await loadContentPool()
  const pool = getContentPool() as PoolProblem[]
  const mine = pool.filter(p => p.lessonId === l.id && p.steps?.length)
  // inject step KCs (Platform's job in the React app)
  for (const p of mine) {
    for (const s of p.steps) {
      if (!s.knowledgeComponents)
        s.knowledgeComponents = cleanArray(skillModelMap[s.id] || [])
    }
  }
  lessonProblems.value = mine

  // Restore durable progress: completed problems + BKT mastery snapshot.
  const saved = progress.getLesson(l.id!)
  saved.completed.forEach(id => completed.add(id))
  applyMasterySnapshot(bkt, saved.mastery)

  nextProblem()
})

onUnmounted(() => {
  locale.exitCourse()
})

function onComplete() {
  if (currProblem.value) completed.add(currProblem.value.id)
  // Persist progress (completed set + mastery diff vs defaults).
  progress.saveLesson(lesson.value!.id!, [...completed], snapshotMastery(bktDefaults, bkt))
  seed.value = Date.now()
  nextProblem()
}

function exit() {
  router.push('/')
}
</script>

<template>
  <div class="max-w-[min(1400px,100%)] mx-auto p-4">
    <div v-if="lesson" class="flex-y-center justify-between mb-2">
      <div>
        <h1 class="text-xl font-bold m-0">
          {{ lesson.name?.replace(/##/g, '') }}
        </h1>
        <div class="text-gray-500 text-sm">
          {{ lesson.topics }}
        </div>
      </div>
      <NButton quaternary size="small" @click="exit">
        Exit lesson
      </NButton>
    </div>
    <div class="mb-4">
      <div class="text-xs text-gray-500 mb-1">
        Mastery: {{ Math.round(mastery * 100) }}% · {{ completed.size }}/{{ lessonProblems.length }} completed
      </div>
      <NProgress type="line" :percentage="Math.round(mastery * 100)" :show-indicator="false" :height="6" />
    </div>

    <div v-if="status === 'loading'" class="text-center mt-10">
      <NSpin />
    </div>

    <NResult
      v-else-if="status === 'graduated'"
      status="success"
      title="Lesson mastered!"
      description="You've reached the mastery threshold for this lesson."
    >
      <template #footer>
        <NButton type="primary" @click="exit">
          Back to lessons
        </NButton>
      </template>
    </NResult>

    <NResult
      v-else-if="status === 'exhausted'"
      status="info"
      title="All problems attempted"
      description="You've worked through every problem in this lesson. Recycle is off."
    >
      <template #footer>
        <NButton type="primary" @click="exit">
          Back to lessons
        </NButton>
      </template>
    </NResult>

    <NResult
      v-else-if="status === 'missing'"
      status="warning"
      title="Lesson not found"
    >
      <template #footer>
        <NButton @click="exit">
          Home
        </NButton>
      </template>
    </NResult>

    <!-- Platform owns the mastery display here, so Problem's built-in bar is
         hidden to avoid rendering it twice. -->
    <Problem
      v-else-if="currProblem"
      :key="currProblem.id + '-' + seed"
      :problem="currProblem"
      :lesson="lesson!"
      :bkt-params="bkt"
      :seed="seed"
      :show-mastery="false"
      @display-mastery="(s: number) => (mastery = s)"
      @problem-complete="onComplete"
    />
  </div>
</template>
