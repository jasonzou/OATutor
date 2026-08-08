<script setup lang="ts">
// ProblemInput (partial port, Phase 2 "mathlive-first"). Handles the TextBox
// variants — math (MathField/mathlive), plain string (NInput), short essay
// (textarea). MultipleChoice / GridInput / MatrixInput are stubbed here and
// ported in the next step. Auto-detects MatrixInput from a \begin{matrix} answer.
import MathField from '@/components/MathField.vue'

interface Step {
  problemType?: string
  answerType?: string
  stepAnswer?: string[]
  hintAnswer?: string[]
  choices?: string[]
  units?: string
  numRows?: number
  numCols?: number
}
interface InputState {
  inputVal?: string
  isCorrect?: boolean | null
  usedHints?: boolean
}

const props = withDefaults(
  defineProps<{
    step: Step
    modelValue?: string
    state?: InputState
    index?: number
    showCorrectness?: boolean
    allowRetry?: boolean
    keyboardType?: string
    debug?: boolean
  }>(),
  { keyboardType: 'default' },
)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  keypress: [event: KeyboardEvent]
}>()

const MATRIX_RE = /\\begin{[a-zA-Z]?matrix}/

const resolvedType = computed(() => {
  const s = props.step
  const ans = s.stepAnswer?.[0] ?? s.hintAnswer?.[0]
  if (s.problemType !== 'MultipleChoice' && ans && MATRIX_RE.test(ans))
    return 'MatrixInput'
  return s.problemType ?? 'TextBox'
})

const correctAnswer = computed(
  () => props.step.stepAnswer?.[0] ?? props.step.hintAnswer?.[0] ?? '',
)
const problemAttempted = computed(() => props.state?.isCorrect != null)
const disableInput = computed(() => problemAttempted.value && !props.allowRetry)
const isMath = computed(
  () =>
    resolvedType.value === 'TextBox'
    && props.step.answerType !== 'string'
    && props.step.answerType !== 'short-essay',
)
const isString = computed(
  () => resolvedType.value === 'TextBox' && props.step.answerType === 'string',
)
const isEssay = computed(
  () => resolvedType.value === 'TextBox' && props.step.answerType === 'short-essay',
)

function setVal(v: string) {
  emit('update:modelValue', v)
}
function onKey(e: KeyboardEvent) {
  emit('keypress', e)
}

onMounted(() => {
  // Best-effort, mirrors the React app.
  try {
    ;(window as unknown as { mathVirtualKeyboard: { layouts: unknown[] } })
      .mathVirtualKeyboard.layouts = [props.keyboardType]
  } catch {
    /* ignore */
  }
})
</script>

<template>
  <div class="flex-center" :class="{ 'opacity-50 pointer-events-none': disableInput }">
    <div class="w-full">
      <MathField
        v-if="isMath"
        :model-value="debug ? correctAnswer : modelValue"
        :disabled="disableInput"
        @update:model-value="setVal"
      />

      <NInput
        v-else-if="isString"
        :value="debug ? correctAnswer : modelValue"
        :status="showCorrectness && state?.isCorrect === false ? 'error' : undefined"
        placeholder="Enter a response"
        :aria-label="`Answer question ${index ?? ''}`"
        @update:value="setVal"
        @keypress="onKey"
      />

      <NInput
        v-else-if="isEssay"
        type="textarea"
        :value="modelValue"
        @update:value="setVal"
      />

      <NAlert v-else type="info" :show-icon="false">
        {{ resolvedType }} input — ported in the next step.
      </NAlert>

      <div v-if="step.units" class="mt-1 text-gray-500">
        {{ step.units }}
      </div>
    </div>
  </div>
</template>
