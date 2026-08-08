<script setup lang="ts">
// Standalone verifier for the ProblemInput + MathLive port. Route: /demo/input
import ProblemInput from '@/components/problem-input/ProblemInput.vue'

const value = ref('')
const keyboardType = ref('default')

// Sample numeric TextBox step (uses the math field).
const step = {
  id: 'demo-2-2',
  problemType: 'TextBox',
  answerType: 'numeric',
  stepAnswer: ['\\frac{1}{2}'],
  stepBody: 'What is one half, written as a fraction?',
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-8">
    <h2 class="text-xl font-bold mb-1">
      ProblemInput + MathLive (Vue)
    </h2>
    <p class="text-gray-500 mb-4">
      Type math (try <code>1/2</code>); the live LaTeX value appears below.
    </p>

    <ProblemInput v-model="value" :step="step" :keyboard-type="keyboardType" />

    <NCard size="small" class="mt-4">
      <div class="font-mono text-sm break-all">
        value = {{ JSON.stringify(value) }}
      </div>
    </NCard>
  </div>
</template>
