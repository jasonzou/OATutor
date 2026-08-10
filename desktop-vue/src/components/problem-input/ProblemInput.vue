<script setup lang="ts">
// ProblemInput. Handles the TextBox variants — math (MathField/mathlive), plain
// string (NInput), short essay (textarea) — plus MultipleChoice, GridInput, and
// MatrixInput. Auto-detects MatrixInput from a \begin{...matrix} answer.
import MathField from '@/components/MathField.vue'
import MultipleChoice from './MultipleChoice.vue'
import GridInput from './GridInput.vue'
import MatrixInput from './MatrixInput.vue'
import { parseMatrixTex } from '@core/util/parseMatrixTex'
import { shuffleArray } from '@core/util/shuffleArray'
import type { AnswerTarget } from '@/shared/types'

interface InputState {
  inputVal?: string
  isCorrect?: boolean | null
  usedHints?: boolean
}

const props = withDefaults(
  defineProps<{
    step: AnswerTarget
    modelValue?: string
    state?: InputState
    index?: number
    showCorrectness?: boolean
    allowRetry?: boolean
    keepMCOrder?: boolean
    seed?: number
    keyboardType?: string
    debug?: boolean
  }>(),
  { keyboardType: 'default' },
)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  keypress: [event: KeyboardEvent]
}>()

// Matches \begin{matrix}, \begin{pmatrix}, \begin{bmatrix}, \begin{smallmatrix}, …
const MATRIX_RE = /\\begin{[a-zA-Z]*matrix}/

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

// keepMCOrder reverses rather than preserving source order — intentional parity
// with the React ProblemInput (`[...choices].reverse()`); without it, choices are
// shuffled with the problem seed.
const mcChoices = computed(() => {
  const c = props.step.choices ?? []
  return props.keepMCOrder ? [...c].reverse() : shuffleArray(c, props.seed)
})
// Debug mode pre-fills the correct answer (mirrors the React app's
// use_expanded_view && debug default); normal users always start empty.
const matrixDefault = computed<string[][] | undefined>(() =>
  props.debug ? parseMatrixTex(correctAnswer.value)?.[0] : undefined,
)

function setVal(v: string) {
  emit('update:modelValue', v)
}
function onKey(e: KeyboardEvent) {
  emit('keypress', e)
}

onMounted(() => {
  // Best-effort, mirrors the React app.
  applyKeyboardLayout(props.keyboardType)
})
watch(() => props.keyboardType, applyKeyboardLayout)

function applyKeyboardLayout(layout: string) {
  try {
    ;(window as unknown as { mathVirtualKeyboard: { layouts: unknown[] } })
      .mathVirtualKeyboard.layouts = [layout]
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="flex-center" :class="{ 'opacity-50 pointer-events-none': disableInput }">
    <div class="w-full">
      <MathField
        v-if="isMath"
        :model-value="debug ? correctAnswer : modelValue"
        :disabled="disableInput"
        :aria-label="`Answer question ${index ?? ''}`"
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

      <MultipleChoice
        v-else-if="resolvedType === 'MultipleChoice'"
        :choices="mcChoices"
        :model-value="modelValue"
        @update:model-value="setVal"
      />

      <GridInput
        v-else-if="resolvedType === 'GridInput'"
        :num-rows="step.numRows"
        :num-cols="step.numCols"
        :default-value="matrixDefault"
        :index="index"
        @update:model-value="setVal"
      />

      <MatrixInput
        v-else-if="resolvedType === 'MatrixInput'"
        :num-rows="step.numRows"
        :num-cols="step.numCols"
        :default-value="matrixDefault"
        :index="index"
        @update:model-value="setVal"
      />

      <NAlert v-else type="info" :show-icon="false">
        Unknown problem type: {{ resolvedType }}
      </NAlert>

      <div v-if="step.units" class="mt-1 text-gray-500">
        {{ step.units }}
      </div>
    </div>
  </div>
</template>
