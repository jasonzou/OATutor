<script setup lang="ts">
// MultipleChoice (ported). Radio group. Reorders choices the same way the React
// version did (anything containing " above" sinks to the end; others unshift).
// Labels are plain text for now; a renderText() port can replace {{ choice }}.
const props = defineProps<{
  choices?: string[]
  modelValue?: string
  variabilization?: Record<string, unknown>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const ordered = computed(() => {
  const out: string[] = []
  for (const c of [...new Set(props.choices ?? [])]) {
    if (c.includes(' above')) out.push(c)
    else out.unshift(c)
  }
  return out
})
function onChange(v: string) {
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="mr-[5%] text-center">
    <NRadioGroup :value="modelValue" @update:value="onChange">
      <NRadio v-for="choice in ordered" :key="choice" :value="choice">
        {{ choice }}
      </NRadio>
      <span v-if="!ordered.length" class="text-red-500">
        Error: This problem has no answer choices. Please submit feedback.
      </span>
    </NRadioGroup>
  </div>
</template>
