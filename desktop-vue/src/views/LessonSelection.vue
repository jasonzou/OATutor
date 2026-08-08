<script setup lang="ts">
// First ported screen (Phase 0). Proves the stack end-to-end: Naive UI components
// (auto-imported), UnoCSS layout utilities, and reuse of the OATutor framework-
// agnostic core (@core/util/*) for contextual textbook linking.
import { openExternal } from '@core/util/openExternal'
import { sectionNumberOfLesson, textbookSectionUrl } from '@core/util/textbookLink'
import { courseNames, defaultCourseName, lessonsForCourse } from '@/shared/lessons'

const selectedCourse = ref(defaultCourseName())
const courseOptions = computed(() =>
  courseNames().map((name) => ({ label: name, value: name })),
)
const lessons = computed(() => lessonsForCourse(selectedCourse.value))

function openSection(courseName: string, lessonName: string) {
  const url = textbookSectionUrl(courseName, sectionNumberOfLesson({ name: lessonName }))
  if (url) openExternal(url)
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <header class="flex-y-center justify-between mb-6">
      <div class="flex-y-center gap-2">
        <span class="i-lucide-graduation-cap text-2xl text-[#1976D2]" />
        <h1 class="text-2xl font-bold m-0">
          OATutor
        </h1>
      </div>
      <NSelect
        v-model:value="selectedCourse"
        :options="courseOptions"
        filterable
        class="w-100"
      />
    </header>

    <p class="text-gray-500 mb-4">
      {{ lessons.length }} lessons · pick a course above
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NCard
        v-for="lesson in lessons"
        :key="lesson.id"
        hoverable
        class="rounded-lg"
      >
        <div class="text-lg font-semibold">
          {{ lesson.name.replace(/##/g, '') }}
        </div>
        <div class="text-gray-600 mt-1 min-h-2em">
          {{ lesson.topics }}
        </div>
        <div class="mt-4 flex gap-2">
          <NButton size="small" type="primary">
            Start lesson
          </NButton>
          <NButton
            v-if="textbookSectionUrl(selectedCourse, sectionNumberOfLesson(lesson))"
            size="small"
            tertiary
            @click="openSection(selectedCourse, lesson.name)"
          >
            <template #icon>
              <span class="i-lucide-external-link" />
            </template>
            Open in OpenStax
          </NButton>
        </div>
      </NCard>
    </div>
  </div>
</template>
