// Progress store — durable per-lesson progress for the Vue app.
//   userID:              created once, persisted
//   lessons[lessonId]:   { completed: problem ids, mastery: { kc: probMastery } }
//
// Backed by localStorage (works in every build) and mirrored to the Tauri store
// on desktop via @core/util/desktopStorage (hydrated at bootstrap in main.ts).
// Mastery snapshots store only KCs whose probMastery differs from the default
// params — restoring applies them onto a fresh copy of the defaults.
import { defineStore } from 'pinia'
import generateRandomInt from '@core/util/generateRandomInt'
import { persistToDesktop } from '@core/util/desktopStorage'

const USER_ID_KEY = 'oatutor-user_id'
const PROGRESS_KEY = 'oatutor-progress'

export interface LessonProgress {
  completed: string[]
  mastery: Record<string, number>
}
interface ProgressBlob {
  [lessonId: string]: LessonProgress
}

function readBlob(): ProgressBlob {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') as ProgressBlob
  } catch {
    return {}
  }
}

export const useProgressStore = defineStore('progress', () => {
  // userID (create once)
  const userID = ref(localStorage.getItem(USER_ID_KEY) ?? '')
  if (!userID.value) {
    userID.value = generateRandomInt().toString()
    localStorage.setItem(USER_ID_KEY, userID.value)
    persistToDesktop(USER_ID_KEY, userID.value)
  }

  const lessons = ref<ProgressBlob>(readBlob())

  function write() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(lessons.value))
    persistToDesktop(PROGRESS_KEY, JSON.stringify(lessons.value))
  }

  function getLesson(lessonId: string): LessonProgress {
    return lessons.value[lessonId] ?? { completed: [], mastery: {} }
  }

  function saveLesson(lessonId: string, completed: string[], mastery: Record<string, number>) {
    lessons.value[lessonId] = { completed: [...completed], mastery: { ...mastery } }
    write()
  }

  function resetLesson(lessonId: string) {
    delete lessons.value[lessonId]
    write()
  }

  function resetAll() {
    lessons.value = {}
    write()
  }

  return { userID, lessons, getLesson, saveLesson, resetLesson, resetAll }
})

/** Diff live BKT params against the pristine defaults -> mastery snapshot. */
export function snapshotMastery(
  defaults: Record<string, { probMastery: number }>,
  bkt: Record<string, { probMastery: number }>,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const kc of Object.keys(bkt)) {
    const d = defaults[kc]?.probMastery
    if (d !== undefined && bkt[kc].probMastery !== d)
      out[kc] = bkt[kc].probMastery
  }
  return out
}

/** Apply a mastery snapshot onto fresh BKT params (mutates in place). */
export function applyMasterySnapshot(
  bkt: Record<string, { probMastery: number }>,
  mastery: Record<string, number>,
) {
  for (const [kc, m] of Object.entries(mastery)) {
    if (bkt[kc] && typeof m === 'number')
      bkt[kc].probMastery = m
  }
}
