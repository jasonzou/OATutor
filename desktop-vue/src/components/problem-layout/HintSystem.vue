<script setup lang="ts">
// HintSystem (ported, display layer). Renders one collapsible panel per hint,
// gated by dependency status, with hint titles/text via RenderText. The scaffold
// answer box (HintTextbox) and recursive sub-hints (SubHintSystem) are stubbed
// here and ported next, alongside the ProblemCard core loop.
import { chooseVariables } from '@core/platform-logic/variabilize'
import RenderText from '@/components/RenderText.vue'
import { useTranslation } from '@/shared/composables/useTranslation'

interface Hint {
  id: string
  title?: string
  text?: string
  type?: string
  dependencies?: number[]
  variabilization?: Record<string, unknown>
  subHints?: Hint[]
}
const props = defineProps<{
  hints: Hint[]
  problemID?: string
  index?: number
  seed?: number
  stepVars?: Record<string, unknown>
  hintStatus?: number[] // 0 = locked, 1 = unlocked
  unlockFirstHint?: boolean
  isIncorrect?: boolean
}>()
const emit = defineEmits<{ unlockHint: [index: number, type?: string] }>()

const { t } = useTranslation()
const hintLabel = (i: number) => `${t('hintsystem.hint') ?? 'Hint '}${i + 1}`

const expanded = ref<string[]>([])
// auto-open the first hint when requested (matches the React behavior)
if ((props.unlockFirstHint || props.isIncorrect) && props.hints.length) {
  expanded.value = ['0']
  emit('unlockHint', 0, props.hints[0].type)
}

function isLocked(i: number): boolean {
  if (i === 0) return false
  const deps = props.hints[i].dependencies ?? []
  return !deps.every(d => props.hintStatus?.[d] === 1)
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
  return chooseVariables(
    { ...(props.stepVars ?? {}), ...(hint.variabilization ?? {}) },
    props.seed,
  )
}
</script>

<template>
  <div class="w-full">
    <NCollapse :expanded-names="expanded" @update:expanded-names="onUpdate">
      <NCollapseItem
        v-for="(hint, i) in hints"
        :key="`${problemID}-${hint.id}`"
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
          <RenderText
            :text="hint.text"
            :problem-i-d="problemID"
            :variabilization="varsFor(hint)"
          />
          <NAlert v-if="hint.type === 'scaffold'" type="info" :show-icon="false" class="mt-2">
            Scaffold answer input + sub-hints are ported in the next step.
          </NAlert>
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>
