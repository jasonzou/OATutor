<script setup lang="ts">
// Problem (ported). Renders all of a problem's steps as ProblemCards, runs BKT
// on first attempts (mutating bktParams in place, like the React app), emits
// mastery, and finishes when every step is correct. Canvas/LTI grade pass-back,
// feedback form, and debug nav are omitted (offline); problem-complete is
// emitted for Platform to drive the next problem.
import update from '@core/models/BKT/BKT-brain.js'
import { cleanArray } from '@core/util/cleanObject'
import { chooseVariables } from '@core/platform-logic/variabilize'
import { sectionNumberOfProblem, textbookSectionUrl } from '@core/util/textbookLink'
import { openExternalOnClick } from '@core/util/openExternal'
import RenderText from '@/components/RenderText.vue'
import ProblemCard from '@/components/problem-layout/ProblemCard.vue'

interface BKTParam { probMastery: number; probTransit: number; probSlip: number; probGuess: number }
interface Lesson {
  courseName?: string
  learningObjectives?: Record<string, number>
  giveStuFeedback?: boolean | null
  giveStuHints?: boolean | null
  keepMCOrder?: boolean | null
  giveHintOnIncorrect?: boolean | null
  keyboardType?: string | null
  doMasteryUpdate?: boolean | null
  unlockFirstHint?: boolean | null
  giveStuBottomHint?: boolean | null
  allowDynamicHint?: boolean
}
interface Step { id: string; knowledgeComponents?: string[]; [k: string]: unknown }
interface Problem {
  id: string
  title?: string
  body?: string
  variabilization?: Record<string, unknown>
  courseName?: string
  lesson?: string
  steps: Step[]
}

const props = withDefaults(
  defineProps<{
    problem: Problem
    lesson: Lesson
    bktParams: Record<string, BKTParam>
    seed?: number
    debug?: boolean
    autoScroll?: boolean
  }>(),
  { seed: 0, debug: false, autoScroll: true },
)
const emit = defineEmits<{
  'display-mastery': [score: number]
  'problem-complete': []
}>()

// Lesson flags (defaults match the React constructor).
const f = computed(() => {
  const l = props.lesson
  return {
    giveStuFeedback: l.giveStuFeedback == null || !!l.giveStuFeedback,
    giveStuHints: l.giveStuHints == null || !!l.giveStuHints,
    keepMCOrder: l.keepMCOrder != null && !!l.keepMCOrder,
    giveHintOnIncorrect: l.giveHintOnIncorrect != null && !!l.giveHintOnIncorrect,
    keyboardType: l.keyboardType ?? '',
    doMasteryUpdate: l.doMasteryUpdate == null || !!l.doMasteryUpdate,
    unlockFirstHint: l.unlockFirstHint != null && !!l.unlockFirstHint,
    giveStuBottomHint: l.giveStuBottomHint == null || !!l.giveStuBottomHint,
  }
})

const stepStates = reactive<Record<number, boolean>>({})
const firstAttempts = reactive<Record<number, boolean>>({})
const problemFinished = ref(false)
const mastery = ref(0)

const variab = computed(() => chooseVariables(props.problem.variabilization ?? {}, props.seed))
const sectionUrl = computed(() =>
  textbookSectionUrl(props.problem.courseName ?? '', sectionNumberOfProblem(props.problem as any)),
)

function answerMade(cardIndex: number, kcArray: string[] | undefined, isCorrect: boolean) {
  if (stepStates[cardIndex] === true) return

  if (stepStates[cardIndex] == null) {
    for (const kc of cleanArray(kcArray ?? [])) {
      const param = props.bktParams[kc]
      if (!param) {
        console.debug('invalid KC', kc)
        continue
      }
      if (f.value.doMasteryUpdate && !firstAttempts[cardIndex]) {
        firstAttempts[cardIndex] = true
        update(param, isCorrect) // mutates param.probMastery in place
      }
    }
  }

  if (!props.debug) {
    const objectives = Object.keys(props.lesson.learningObjectives ?? {})
    const score = objectives.length
      ? objectives.reduce((acc, kc) => acc + (props.bktParams[kc]?.probMastery ?? 0), 0) / objectives.length
      : 0
    mastery.value = score
    emit('display-mastery', score)
  }

  stepStates[cardIndex] = isCorrect
  const numSteps = props.problem.steps.length

  if (!f.value.giveStuFeedback) {
    const numAttempted = Object.values(stepStates).filter(s => s != null).length
    if (numAttempted === numSteps) problemFinished.value = true
    return
  }

  if (isCorrect) {
    const numCorrect = Object.values(stepStates).filter(s => s === true).length
    if (numSteps !== numCorrect) {
      if (props.autoScroll) scrollToStep(cardIndex + 1)
    } else {
      problemFinished.value = true
    }
  }
}

function scrollToStep(i: number) {
  nextTick(() => {
    document.getElementById(`step-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function nextProblem() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  emit('problem-complete')
  // reset for reuse
  Object.keys(stepStates).forEach(k => delete stepStates[Number(k)])
  Object.keys(firstAttempts).forEach(k => delete firstAttempts[Number(k)])
  problemFinished.value = false
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-4">
    <!-- mastery bar -->
    <div class="mb-3">
      <div class="text-xs text-gray-500 mb-1">
        Mastery: {{ Math.round(mastery * 100) }}%
      </div>
      <NProgress
        type="line"
        :percentage="Math.round(mastery * 100)"
        :show-indicator="false"
        :height="6"
      />
    </div>

    <!-- problem header -->
    <h1 v-if="problem.title" class="text-2xl font-bold mb-1">
      <RenderText :text="problem.title" :problem-i-d="problem.id" :variabilization="variab" />
    </h1>
    <div v-if="problem.body" class="mb-4">
      <RenderText :text="problem.body" :problem-i-d="problem.id" :variabilization="variab" />
    </div>

    <!-- steps -->
    <div
      v-for="(step, i) in problem.steps"
      :id="`step-${i}`"
      :key="step.id"
      class="mb-4 scroll-mt-20"
    >
      <ProblemCard
        :step="step"
        :problem-i-d="problem.id"
        :index="i"
        :seed="seed"
        :problem-vars="problem.variabilization"
        :give-stu-feedback="f.giveStuFeedback"
        :give-stu-hints="f.giveStuHints"
        :give-stu-bottom-hint="f.giveStuBottomHint"
        :unlock-first-hint="f.unlockFirstHint"
        :keep-m-c-order="f.keepMCOrder"
        :keyboard-type="f.keyboardType"
        :answer-made="answerMade"
      />
    </div>

    <!-- footer: next problem + textbook link -->
    <div class="flex items-center justify-between mt-2">
      <a
        v-if="sectionUrl"
        :href="sectionUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-[#1976D2]"
        @click="openExternalOnClick(sectionUrl)"
      >
        📖 Open section {{ sectionNumberOfProblem(problem) }} in OpenStax
      </a>
      <NButton v-if="problemFinished" type="primary" @click="nextProblem">
        Next problem
      </NButton>
    </div>
  </div>
</template>
