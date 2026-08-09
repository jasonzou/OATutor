<script setup lang="ts">
// ProblemCard (ported core loop). Renders a step (title/body), takes an answer
// (ProblemInput), checks it via the shared @core checkAnswer, shows correctness,
// and exposes dependency-gated hints (HintSystem). GPT/bio/Firebase logging are
// omitted (offline); answerMade is forwarded for later BKT/mastery wiring.
import { chooseVariables } from '@core/platform-logic/variabilize'
import { checkAnswer } from '@core/platform-logic/checkAnswer'
import RenderText from '@/components/RenderText.vue'
import ProblemInput from '@/components/problem-input/ProblemInput.vue'
import HintSystem from '@/components/problem-layout/HintSystem.vue'
import { useTranslation } from '@/shared/composables/useTranslation'

interface Hint {
  id: string
  title?: string
  text?: string
  type?: string
  dependencies?: number[]
  variabilization?: Record<string, unknown>
  subHints?: Hint[]
  hintAnswer?: string[]
}
interface Step {
  id: string
  stepTitle?: string
  stepBody?: string
  stepAnswer?: string[]
  answerType?: string
  problemType?: string
  precision?: number
  answerValidator?: string
  variabilization?: Record<string, unknown>
  knowledgeComponents?: string[]
  hints?: Record<string, Hint[]>
  choices?: string[]
  numRows?: number
  numCols?: number
  units?: string
}

const props = withDefaults(
  defineProps<{
    step: Step
    problemID?: string
    problemVars?: Record<string, unknown>
    seed?: number
    index?: number
    giveStuFeedback?: boolean
    giveStuHints?: boolean
    unlockFirstHint?: boolean
    giveStuBottomHint?: boolean
    keepMCOrder?: boolean
    keyboardType?: string
    hintPathway?: string
    debug?: boolean
    answerMade?: (index: number, kcs: string[] | undefined, isCorrect: boolean) => void
  }>(),
  {
    giveStuFeedback: true,
    giveStuHints: true,
    giveStuBottomHint: true,
    keepMCOrder: false,
    keyboardType: 'default',
    hintPathway: 'DefaultPathway',
  },
)
const emit = defineEmits<{ answer: [index: number, isCorrect: boolean] }>()

const { t } = useTranslation()
const message = useMessage()

// --- hints: remap dependency ids -> indices; optional bottom-out answer hint ---
const hints = reactive<Hint[]>([])
function findIdx(arr: Hint[], id: string): number {
  return arr.findIndex(h => h.id === id)
}
function buildHints() {
  const src = JSON.parse(JSON.stringify(props.step.hints?.[props.hintPathway] ?? [])) as Hint[]
  src.forEach((h) => {
    h.dependencies = (h.dependencies ?? []).map(d => findIdx(src, String(d)))
    if (h.subHints) {
      h.subHints.forEach((s) => {
        s.dependencies = (s.dependencies ?? []).map(d => findIdx(h.subHints!, String(d)))
      })
    }
  })
  if (props.giveStuBottomHint) {
    src.push({
      id: `${props.step.id}-h${src.length + 1}`,
      title: (t('hintsystem.answer') ?? 'Answer') as string,
      text: `${t('hintsystem.answerIs') ?? 'The answer is '}${props.step.stepAnswer?.[0] ?? ''}`,
      type: 'bottomOut',
      dependencies: Array.from({ length: src.length }, (_, i) => i),
    })
  }
  hints.splice(0, hints.length, ...src)
}
buildHints()

// --- state ---
const inputVal = ref('')
const isCorrect = ref<boolean | null>(null)
const hintsFinished = ref<number[]>(new Array(hints.length).fill(0))
const activeHintType = ref<'none' | 'normal'>('none')

const showHints = computed(() => props.giveStuHints == null || !!props.giveStuHints)
const showCorrectness = computed(() => !!props.giveStuFeedback)
const allowRetry = computed(() => !!props.giveStuFeedback)
const variab = computed(() =>
  chooseVariables({ ...(props.problemVars ?? {}), ...(props.step.variabilization ?? {}) }, props.seed),
)
const problemAttempted = computed(() => isCorrect.value != null)

function submit() {
  if (!inputVal.value) {
    message?.warning('Please enter an answer')
    return
  }
  const [, correctAnswer, reason] = checkAnswer({
    attempt: inputVal.value,
    actual: props.step.stepAnswer,
    answerType: props.step.answerType,
    precision: props.step.precision,
    variabilization: variab.value,
    questionText: (props.step.stepBody?.trim() || props.step.stepTitle?.trim() || ''),
    answerValidator: props.step.answerValidator,
  })
  const correct = !!correctAnswer
  isCorrect.value = correct
  if (showCorrectness.value) {
    if (correct) message?.success('Correct!')
    else message?.error(`Incorrect${reason ? `: ${reason}` : ''}`)
  } else {
    message?.success('Submitted')
  }
  props.answerMade?.(props.index ?? 0, props.step.knowledgeComponents, correct)
  emit('answer', props.index ?? 0, correct)
}

function toggleHints() {
  activeHintType.value = activeHintType.value === 'normal' ? 'none' : 'normal'
  if (activeHintType.value === 'normal')
    props.answerMade?.(props.index ?? 0, props.step.knowledgeComponents, false)
}

function unlockHint(i: number, type?: string) {
  const sum = hintsFinished.value.reduce((a, b) => a + b, 0)
  if (sum === 0 && isCorrect.value !== true)
    props.answerMade?.(props.index ?? 0, props.step.knowledgeComponents, false)
  if (hintsFinished.value[i] !== 1)
    hintsFinished.value[i] = type !== 'scaffold' ? 1 : 0.5
}

// A scaffold hint answered correctly marks it fully finished (1).
function onScaffoldSubmit(i: number, correct: boolean) {
  if (correct) hintsFinished.value[i] = 1
}
</script>

<template>
  <NCard>
    <h2 v-if="step.stepTitle" class="text-lg font-semibold mb-2">
      <RenderText :text="step.stepTitle" :problem-i-d="problemID" :variabilization="variab" />
    </h2>
    <div v-if="step.stepBody" class="mb-3">
      <RenderText :text="step.stepBody" :problem-i-d="problemID" :variabilization="variab" />
    </div>

    <HintSystem
      v-if="activeHintType === 'normal' && showHints"
      :hints="hints"
      :problem-i-d="problemID"
      :index="index"
      :seed="seed"
      :step-vars="{ ...(problemVars ?? {}), ...(step.variabilization ?? {}) }"
      :hint-status="hintsFinished"
      :unlock-first-hint="unlockFirstHint"
      @unlock-hint="unlockHint"
      @submit-hint="onScaffoldSubmit"
    />

    <ProblemInput
      v-model="inputVal"
      :step="step"
      :state="{ inputVal, isCorrect }"
      :index="index"
      :show-correctness="showCorrectness"
      :allow-retry="allowRetry"
      :keep-m-c-order="keepMCOrder"
      :seed="seed"
      :keyboard-type="keyboardType"
    />

    <div class="flex items-center justify-center gap-4 mt-4">
      <NButton v-if="showHints" quaternary circle aria-label="Toggle hints" @click="toggleHints">
        <span class="i-lucide-hand" />
      </NButton>
      <NButton
        type="primary"
        :disabled="(!allowRetry && problemAttempted)"
        @click="submit"
      >
        {{ t('problem.Submit') ?? 'Submit' }}
      </NButton>
      <span v-if="isCorrect === true" class="i-lucide-circle-check text-xl text-green-600" />
      <span v-else-if="isCorrect === false" class="i-lucide-circle-x text-xl text-red-600" />
    </div>
  </NCard>
</template>
