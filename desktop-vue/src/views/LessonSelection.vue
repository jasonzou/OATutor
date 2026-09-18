<script setup lang="ts">
// Lesson selection (ported). Sits inside DefaultLayout (which supplies branding,
// locale switch, dark toggle). Uses Naive UI cards/select + UnoCSS grid, and the
// shared OATutor core for contextual textbook linking.
import { openExternal } from '@core/util/openExternal'
import { sectionNumberOfLesson, textbookSectionUrl } from '@core/util/textbookLink'
import { useTranslation } from '@/shared/composables/useTranslation'
import { SITE_NAME } from '@/shared/config'
import { courseLanguage, courseNames, defaultCourseName, lessonsForCourse } from '@/shared/lessons'

const { t, locale } = useTranslation()
const router = useRouter()

// Remember the course across visits (and app restarts).
const COURSE_STORAGE_KEY = 'oatutor-selected-course'
const storedCourse = localStorage.getItem(COURSE_STORAGE_KEY)
const selectedCourse = ref(
  storedCourse && courseNames().includes(storedCourse)
    ? storedCourse
    : defaultCourseName(),
)

// Selecting a course enters it for locale purposes (mirrors the React app's
// Platform): the course's declared language becomes the session language.
watch(
  selectedCourse,
  (name) => {
    if (!name) return
    localStorage.setItem(COURSE_STORAGE_KEY, name)
    locale.enterCourse(name, courseLanguage(name))
  },
  { immediate: true },
)
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
    <div class="mb-6">
      <h2 class="text-xl font-bold m-0 mb-3">
        {{ t('lessonSelection.welcomeTo') }} {{ SITE_NAME }}!
      </h2>
      <div class="flex-y-center gap-3">
        <span class="text-gray-600">
          {{ t('lessonSelection.select') }} {{ t('lessonSelection.course') }}:
        </span>
        <NSelect
          v-model:value="selectedCourse"
          :options="courseOptions"
          filterable
          class="w-100"
        />
      </div>
    </div>

    <div class="flex-y-center justify-between mb-4">
      <h3 class="text-lg font-semibold m-0">{{ selectedCourse }}</h3>
      <span class="text-gray-500">{{ lessons.length }} lessons</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NCard
        v-for="lesson in lessons"
        :key="lesson.id"
        hoverable
        class="rounded-lg relative cursor-pointer"
        @click="router.push(`/lessons/${lesson.id}`)"
      >
        <!-- top-right: browse all problems -->
        <NButton
          quaternary
          circle
          size="tiny"
          class="!absolute top-2 right-2"
          aria-label="View all problems for this lesson"
          @click.stop="router.push(`/lessons/${lesson.id}/problems`)"
        >
          <span class="i-lucide-library text-16px" />
        </NButton>

        <div class="text-lg font-semibold">
          {{ lesson.name.replace(/##/g, '') }}
        </div>
        <div class="text-gray-600 mt-1 min-h-2em">
          {{ lesson.topics }}
        </div>
        <div class="mt-4 flex justify-end">
          <NButton
            v-if="textbookSectionUrl(selectedCourse, sectionNumberOfLesson(lesson))"
            size="small"
            tertiary
            @click.stop="openSection(selectedCourse, lesson.name)"
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
