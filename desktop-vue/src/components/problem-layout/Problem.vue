<script setup lang="ts">
// Problem (ported). Renders all of a problem's steps as ProblemCards, runs BKT
// on first attempts (mutating bktParams in place, like the React app), emits
// mastery, and finishes when every step is correct. Canvas/LTI grade pass-back,
// feedback form, and debug nav are omitted (offline); problem-complete is
// emitted for Platform to drive the next problem.
import update from '@core/models/BKT/BKT-brain.js'
import { cleanArray } from '@core/util/cleanObject'
import { chooseVariables } from '@core/platform-logic/variabilize'
import {
  bookIdForCourse,
  sectionNumberOfProblem,
  textbookSectionByBook,
  textbookSectionUrl,
} from '@core/util/textbookLink'
import { openExternalOnClick } from '@core/util/openExternal'
import { BOOK_TITLES } from '@/shared/config'
import type { BKTParams, LessonPlan, PoolProblem } from '@/shared/types'
import RenderText from '@/components/RenderText.vue'
import ProblemCard from '@/components/problem-layout/ProblemCard.vue'
import SectionContent from '@/components/SectionContent.vue'

const props = withDefaults(
  defineProps<{
    problem: PoolProblem
    lesson: LessonPlan
    bktParams: Record<string, BKTParams>
    seed?: number
    debug?: boolean
    autoScroll?: boolean
    showMastery?: boolean
    browse?: boolean
  }>(),
  { seed: 0, debug: false, autoScroll: true, showMastery: true, browse: false },
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

const showTextbook = ref(false)

const variab = computed(() => chooseVariables(props.problem.variabilization ?? {}, props.seed))
const sectionUrl = computed(() =>
  textbookSectionUrl(props.problem.courseName ?? '', sectionNumberOfProblem(props.problem)),
)
const sectionNumber = computed(() => sectionNumberOfProblem(props.problem))
const bookId = computed(() => bookIdForCourse(props.problem.courseName ?? ''))
const bookTitle = computed(() => (bookId.value && BOOK_TITLES[bookId.value]) || bookId.value || '')
const canShowTextbook = computed(() => !!bookId.value && !!sectionNumber.value)
const sectionMeta = computed(() =>
  bookId.value && sectionNumber.value ? textbookSectionByBook(bookId.value, sectionNumber.value) : null,
)
const sectionTitle = computed(() => {
  if (!sectionNumber.value) return ''
  return sectionMeta.value ? `${sectionNumber.value} ${sectionMeta.value.title}` : `Section ${sectionNumber.value}`
})

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
  <div
    :class="showTextbook && canShowTextbook ? 'max-w-[min(1400px,100%)]' : 'max-w-3xl'"
    class="mx-auto pl-1 pr-2 py-4"
  >
    <!-- mastery bar (hidden when the parent — e.g. Platform — owns the display) -->
    <div v-if="showMastery" class="mb-3">
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

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(min(600px,100%),1fr)_600px] gap-6 items-start">
      <!-- question column -->
      <div class="min-w-0 overflow-x-auto">
        <!-- textbook toggle -->
        <div v-if="canShowTextbook" class="flex-y-center justify-between mb-4">
          <span class="text-sm text-gray-600">Textbook · {{ bookTitle }}</span>
          <NButton
            type="primary"
            :secondary="showTextbook"
            size="large"
            @click="showTextbook = !showTextbook"
          >
            <template #icon>
              <span class="i-lucide-book-open" />
            </template>
            {{ showTextbook ? 'Hide' : 'Show' }} section content
          </NButton>
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
          <NButton v-if="problemFinished && !browse" type="primary" @click="nextProblem">
            Next problem
          </NButton>
        </div>
      </div>

      <!-- textbook panel: side by side with the question -->
      <aside
        v-if="showTextbook && canShowTextbook"
        class="lg:sticky lg:top-4"
      >
        <NCard size="small" :bordered="true">
          <template #header>
            <div class="flex-y-center justify-between w-full">
              <span class="font-bold text-sm">{{ sectionTitle }}</span>
              <div class="flex-y-center gap-3">
                <a
                  v-if="sectionMeta?.url"
                  :href="sectionMeta.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-[#1976D2]"
                  @click="openExternalOnClick(sectionMeta.url)"
                >
                  Open in OpenStax ↗
                </a>
                <NButton size="tiny" quaternary @click="showTextbook = false">
                  Close
                </NButton>
              </div>
            </div>
          </template>
          <div v-if="bookId && sectionNumber" class="pr-1 lg:max-h-[70vh] lg:overflow-y-auto">
            <SectionContent :book-id="bookId" :section="sectionNumber" />
          </div>
        </NCard>
      </aside>
    </div>
  </div>
</template>
