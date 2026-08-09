<script setup lang="ts">
// HintTextbox (ported). The answer box for a "scaffold" hint: a ProblemInput for
// the hint's answer (hint.hintAnswer / answerType / problemType), a submit that
// runs checkAnswer, correctness feedback, and a toggle to reveal sub-hints.
import { chooseVariables } from '@core/platform-logic/variabilize'
import { checkAnswer } from '@core/platform-logic/checkAnswer'
import ProblemInput from '@/components/problem-input/ProblemInput.vue'
import { useTranslation } from '@/shared/composables/useTranslation'

interface Hint {
  hintAnswer?: string[]
  answerType?: string
  precision?: number
  answerValidator?: string
  problemType?: string
  choices?: string[]
  numRows?: number
  numCols?: number
  text?: string
  subHints?: unknown[]
  variabilization?: Record<string, unknown>
}

const props = withDefaults(
  defineProps<{
    hint: Hint
    index?: number
    hintNum?: number
    hintVars?: Record<string, unknown>
    seed?: number
    giveStuFeedback?: boolean
    isSub?: boolean
  }>(),
  { giveStuFeedback: true, isSub: false },
)
const emit = defineEmits<{
  'submit-hint': [parsed: string, isCorrect: boolean]
  'toggle-hints': []
}>()

const { t } = useTranslation()
const message = useMessage()
const inputVal = ref('')
const isCorrect = ref<boolean | null>(null)
const variab = computed(() => chooseVariables(props.hintVars ?? {}, props.seed))
const allowRetry = computed(() => !!props.giveStuFeedback)

function submit() {
  if (!inputVal.value) {
    message?.warning('Please enter an answer')
    return
  }
  const [parsed, correctAnswer, reason] = checkAnswer({
    attempt: inputVal.value,
    actual: props.hint.hintAnswer,
    answerType: props.hint.answerType,
    precision: props.hint.precision,
    variabilization: variab.value,
    questionText: props.hint.text ?? '',
    answerValidator: props.hint.answerValidator,
  })
  const correct = !!correctAnswer
  isCorrect.value = correct
  if (correct) message?.success('Correct!')
  else message?.error(`Incorrect${reason ? `: ${reason}` : ''}`)
  emit('submit-hint', parsed ?? inputVal.value, correct)
}
</script>

<template>
  <div class="mt-2">
    <ProblemInput
      v-model="inputVal"
      :step="hint"
      :state="{ inputVal, isCorrect }"
      :index="index"
      :show-correctness="giveStuFeedback"
      :allow-retry="allowRetry"
      :seed="seed"
      :variabilization="variab"
    />

    <div class="flex items-center justify-center gap-3 mt-2">
      <NButton
        v-if="!isSub && hint.subHints?.length"
        quaternary
        circle
        aria-label="Toggle sub-hints"
        @click="emit('toggle-hints')"
      >
        <span class="i-lucide-hand" />
      </NButton>
      <NButton
        type="primary"
        size="small"
        :disabled="(!allowRetry && isCorrect != null)"
        @click="submit"
      >
        {{ t('problem.Submit') ?? 'Submit' }}
      </NButton>
      <span v-if="isCorrect === true" class="i-lucide-circle-check text-green-600" />
      <span v-else-if="isCorrect === false" class="i-lucide-circle-x text-red-600" />
    </div>
  </div>
</template>
