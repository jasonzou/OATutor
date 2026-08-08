<script setup lang="ts">
// Stand-in for React screens not yet ported. Removed as each component is converted.
defineProps<{ title?: string }>()
</script>

<template>
  <div class="max-w-3xl mx-auto p-8">
    <NCard>
      <div class="flex-y-center gap-2 text-gray-500">
        <span class="i-lucide-hourglass" />
        <span>
          <strong>{{ title || 'This screen' }}</strong>
          — placeholder; rendered once the corresponding React component is ported.
        </span>
      </div>
    </NCard>
  </div>
</template>
