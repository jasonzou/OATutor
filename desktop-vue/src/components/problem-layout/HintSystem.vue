<script setup lang="ts">
// HintSystem (ported, RECURSIVE). Renders one collapsible panel per hint, gated
// by dependency status, with hint titles/text via RenderText. Scaffold hints get
// a HintTextbox answer box; revealing a scaffold's sub-hints renders a nested
// HintSystem (so "hints within hints" — and their own scaffold boxes — work at
// any depth). This unifies the React HintSystem + SubHintSystem.
import { chooseVariables } from '@core/platform-logic/variabilize'
import RenderText from '@/components/RenderText.vue'
import HintTextbox from './HintTextbox.vue'
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
  answerType?: string
  problemType?: string
}

const props = withDefaults(
  defineProps<{
    hints: Hint[]
    problemID?: string
    index?: number
    seed?: number
    stepVars?: Record<string, unknown>
    hintStatus?: number[]
    unlockFirstHint?: boolean
    depth?: number
  }>(),
  { depth: 0, unlockFirstHint: false },
)
const emit = defineEmits<{
  unlockHint: [index: number, type?: string]
  'submit-hint': [index: number, isCorrect: boolean]
}>()

const { t } = useTranslation()
const hintLabel = (i: number) => `${t('hintsystem.hint') ?? 'Hint '}${i + 1}`

// finished-state for these hints; defaults to all-0 if the parent didn't supply.
const status = computed(() =>
  props.hintStatus && props.hintStatus.length === props.hints.length
    ? props.hintStatus
    : new Array(props.hints.length).fill(0),
)

const expanded = ref<string[]>([])
const showSubhints = reactive<Record<number, boolean>>({})
// Per-hint finished-state for sub-hints, owned here for the recursion.
const subStatus = reactive<Record<number, number[]>>({})
props.hints.forEach((h, i) => {
  if (h.subHints?.length) subStatus[i] = new Array(h.subHints.length).fill(0)
})

onMounted(() => {
  if (props.unlockFirstHint && props.hints.length)
    emit('unlockHint', 0, props.hints[0].type)
})

function isLocked(i: number): boolean {
  if (i === 0) return false
  const deps = props.hints[i].dependencies ?? []
  return !deps.every(d => status.value[d] === 1)
}

function onUpdate(names: string | string[] | null) {
  const arr = Array.isArray(names) ? names : names == null ? [] : [names]
  const allowed = arr.filter(n => !isLocked(Number(n)))
  const opened = allowed.find(n => !expanded.value.includes(n))
  expanded.value = allowed
  if (opened != null) {
    const i = Number(opened)
    emit('unlockHint', i, props.hints[i]?.type)
  }
}

function varsFor(hint: Hint) {
  return chooseVariables({ ...(props.stepVars ?? {}), ...(hint.variabilization ?? {}) }, props.seed)
}
</script>

<template>
  <div
    class="w-full"
    :class="{ 'ml-4 mt-2 border-l border-gray-300 pl-3 dark:border-gray-600': depth > 0 }"
  >
    <NCollapse :expanded-names="expanded" @update:expanded-names="onUpdate">
      <NCollapseItem
        v-for="(hint, i) in hints"
        :key="`${problemID}-${depth}-${hint.id}`"
        :name="String(i)"
      >
        <template #header>
          <span :class="{ 'opacity-40': isLocked(i) }">
            <span v-if="isLocked(i)" class="i-lucide-lock mr-1" />
            {{ hintLabel(i) }}
            <RenderText
              :text="hint.title === 'nan' ? '' : hint.title"
              :problem-i-d="problemID"
              :variabilization="varsFor(hint)"
            />
          </span>
        </template>

        <div>
          <RenderText :text="hint.text" :problem-i-d="problemID" :variabilization="varsFor(hint)" />

          <HintTextbox
            v-if="hint.type === 'scaffold'"
            :hint="hint"
            :index="index"
            :hint-num="i"
            :hint-vars="{ ...(stepVars ?? {}), ...(hint.variabilization ?? {}) }"
            :seed="seed"
            @submit-hint="(_p: string, c: boolean) => emit('submit-hint', i, c)"
            @toggle-hints="showSubhints[i] = !showSubhints[i]"
          />

          <!-- recursive sub-hints (revealed by the scaffold's toggle) -->
          <HintSystem
            v-if="showSubhints[i] && hint.subHints?.length"
            :hints="hint.subHints"
            :hint-status="subStatus[i]"
            :problem-i-d="problemID"
            :index="index"
            :seed="seed"
            :step-vars="{ ...(stepVars ?? {}), ...(hint.variabilization ?? {}) }"
            :depth="depth + 1"
            :unlock-first-hint="unlockFirstHint"
            @unlock-hint="(j: number, type?: string) => (subStatus[i][j] = type !== 'scaffold' ? 1 : 0.5)"
            @submit-hint="(j: number, c: boolean) => { if (c) subStatus[i][j] = 1 }"
          />
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>
