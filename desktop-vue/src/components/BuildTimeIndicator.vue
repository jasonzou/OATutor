<script setup lang="ts">
import { BUILD_TIMESTAMP } from '@core/util/runtimeEnv'
const buildTime = Number(BUILD_TIMESTAMP)
</script>

<template>
  <span v-if="!Number.isNaN(buildTime)" class="text-xs opacity-60">
    Built on: {{ new Date(buildTime).toUTCString() }}
  </span>
</template>
