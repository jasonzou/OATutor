<script setup lang="ts">
import { SITE_NAME } from '@/shared/config'
</script>

<template>
  <RouterLink to="/" class="flex-y-center gap-2 no-underline color-inherit">
    <span class="i-lucide-graduation-cap text-2xl text-[#1976D2]" />
    <span class="text-xl font-bold">{{ SITE_NAME }}</span>
  </RouterLink>
</template>
