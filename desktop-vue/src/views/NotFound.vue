<script setup lang="ts">
</script>

<template>
  <div class="max-w-3xl mx-auto p-12 text-center">
    <div class="i-lucide-search-x text-5xl text-gray-400 mb-4" />
    <h2 class="text-2xl font-bold">
      404
    </h2>
    <p class="text-gray-500 mb-4">
      Page not found.
    </p>
    <NButton type="primary" @click="$router.push('/')">
      Back to lessons
    </NButton>
  </div>
</template>
