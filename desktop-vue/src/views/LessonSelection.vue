<script setup lang="ts">
// Lesson selection (ported). Sits inside DefaultLayout (which supplies branding,
// locale switch, dark toggle). Uses Naive UI cards/select + UnoCSS grid, and the
// shared OATutor core for contextual textbook linking.
import { openExternal } from '@core/util/openExternal'
import { sectionNumberOfLesson, textbookSectionUrl } from '@core/util/textbookLink'
import { useTranslation } from '@/shared/composables/useTranslation'
import { courseNames, defaultCourseName, lessonsForCourse } from '@/shared/lessons'

const { t } = useTranslation()

const selectedCourse = ref(defaultCourseName())
const courseOptions = computed(() =>
  courseNames().map(name => ({ label: name, value: name })),
)
const lessons = computed(() => lessonsForCourse(selectedCourse.value))

function openSection(courseName: string, lessonName: string) {
  const url = textbookSectionUrl(courseName, sectionNumberOfLesson({ name: lessonName }))
  if (url) openExternal(url)
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex-y-center justify-between mb-4">
      <h2 class="text-xl font-bold m-0">
        {{ t('lessonSelection.welcomeTo') }} {{ t('lessonSelection.select') }}
        {{ t('lessonSelection.course') }}
      </h2>
      <NSelect
        v-model:value="selectedCourse"
        :options="courseOptions"
        filterable
        class="w-100"
      />
    </div>

    <p class="text-gray-500 mb-4">
      {{ lessons.length }} lessons
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
            {{ t('lessonSelection.onlyselect') }}
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
