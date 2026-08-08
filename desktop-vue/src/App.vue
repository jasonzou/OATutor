<script setup lang="ts">
// Naive UI providers wrap the app so deep components can useMessage()/useDialog().
// Theme overrides are a starting point (Material-ish blue, matching the old MUI look);
// a pinia theme store + dark mode can follow the showy-naive-starter pattern later.
const themeOverrides = {
  common: {
    primaryColor: '#1976D2',
    primaryColorHover: '#2196F3',
    primaryColorPressed: '#115293',
    primaryColorSuppl: '#1976D2',
  },
}
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides" inline-theme-disabled>
    <NLoadingBarProvider>
      <NDialogProvider>
        <NMessageProvider>
          <NNotificationProvider>
            <RouterView />
          </NNotificationProvider>
        </NMessageProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
