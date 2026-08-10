<script setup lang="ts">
// GridInput (ported). Two states: a dimensions-entry form, then an editable grid
// of math cells (mathlive MathField, replacing equation-editor-react). Emits the
// grid as a JSON string (matching the React app's contract). MatrixInput is this
// component with isMatrix=true (renders bracket decorations).
import MathField from '@/components/MathField.vue'

const props = withDefaults(
  defineProps<{
    numRows?: number
    numCols?: number
    defaultValue?: string[][]
    isMatrix?: boolean
    index?: number
  }>(),
  { numRows: 0, numCols: 0, isMatrix: false },
)
const emit = defineEmits<{ 'update:modelValue': [json: string] }>()

const message = useMessage()

function genEmpty(r: number, c: number): string[][] {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => ''))
}

const gridState = ref<string[][]>(
  props.defaultValue && props.defaultValue.length ? props.defaultValue.map(r => [...r]) : [],
)
const numRows = ref(props.defaultValue?.length ?? props.numRows ?? 0)
const numCols = ref(props.defaultValue?.[0]?.length ?? props.numCols ?? 0)

const showInitialSlide = computed(() => gridState.value.length === 0)
const revealClear = computed(() =>
  gridState.value.some(r => r.some(c => c.length > 0)),
)

function emitGrid() {
  emit('update:modelValue', JSON.stringify(gridState.value))
}
function setCell(r: number, c: number, v: string) {
  gridState.value[r][c] = v
  emitGrid()
}
// (Re)builds an empty grid from numRows × numCols. Used by the dimensions form,
// the dimensions popover, and "clear all cells" (clearing = rebuilding empty).
function regenerateGrid() {
  if (Number.isNaN(numRows.value) || numRows.value <= 0 || Number.isNaN(numCols.value) || numCols.value <= 0) {
    message?.error('Matrix must be at least 1 x 1')
    return
  }
  gridState.value = genEmpty(numRows.value, numCols.value)
  emitGrid()
}
</script>

<template>
  <div class="flex flex-col items-center py-2 text-center">
    <!-- dimensions entry -->
    <form v-if="showInitialSlide" @submit.prevent="regenerateGrid">
      <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="font-bold text-lg">
          Enter in matrix dimensions.
        </div>
        <p class="text-gray-500">
          (This can be changed later)
        </p>
        <div class="flex items-center justify-center gap-2 mt-2">
          <NInputNumber v-model:value="numRows" :placeholder="`# rows (Q${index})`" />
          <span class="text-xl">×</span>
          <NInputNumber v-model:value="numCols" :placeholder="`# cols (Q${index})`" />
        </div>
        <NButton class="mt-3" type="primary" attr-type="submit">
          Next
        </NButton>
      </div>
    </form>

    <!-- grid -->
    <div v-else class="w-full max-w-full">
      <div class="flex justify-end mb-1">
        <NPopover trigger="click" placement="bottom-end">
          <template #trigger>
            <NButton size="small">
              DIMENSIONS: {{ gridState.length }} x {{ gridState[0]?.length }}
            </NButton>
          </template>
          <div class="flex items-center gap-2 p-1">
            <NInputNumber v-model:value="numRows" size="small" placeholder="# Rows" />
            <span>×</span>
            <NInputNumber v-model:value="numCols" size="small" placeholder="# Cols" />
            <NButton size="small" type="primary" @click="regenerateGrid">
              Done
            </NButton>
          </div>
        </NPopover>
      </div>

      <div class="flex" :class="{ 'matrix-container': isMatrix }">
        <div v-if="isMatrix" class="matrix-bracket-left" />
        <div
          class="grid py-2 overflow-auto"
          :style="{ gridTemplateColumns: `repeat(${gridState[0]?.length ?? 1}, 1fr)`, gap: '8px' }"
        >
          <template v-for="(row, r) in gridState" :key="r">
            <div
              v-for="(val, c) in row"
              :key="`${r}-${c}`"
              class="grid-cell"
            >
              <MathField :model-value="val" @update:model-value="(v: string) => setCell(r, c, v)" />
            </div>
          </template>
        </div>
        <div v-if="isMatrix" class="matrix-bracket-right" />
      </div>

      <div class="flex justify-end mt-1">
        <NButton
          size="small"
          :class="revealClear ? 'opacity-100' : 'opacity-0'"
          @click="regenerateGrid"
        >
          clear all cells
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matrix-bracket-left,
.matrix-bracket-right {
  width: 6px;
  align-self: stretch;
}
.matrix-bracket-left {
  border-left: 2px solid currentColor;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  margin-right: 4px;
}
.matrix-bracket-right {
  border-right: 2px solid currentColor;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  margin-left: 4px;
}
.grid-cell :deep(math-field) {
  min-width: 60px;
}
</style>
