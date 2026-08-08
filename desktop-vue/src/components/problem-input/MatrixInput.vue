<script setup lang="ts">
// MatrixInput (ported) — GridInput with bracket decorations.
import GridInput from './GridInput.vue'

withDefaults(
  defineProps<{
    numRows?: number
    numCols?: number
    defaultValue?: string[][]
    index?: number
  }>(),
  {},
)
const emit = defineEmits<{ 'update:modelValue': [json: string] }>()
</script>

<template>
  <GridInput
    v-bind="$props"
    :is-matrix="true"
    @update:model-value="(v: string) => emit('update:modelValue', v)"
  />
</template>
