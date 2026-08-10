// Pure (framework-agnostic) lesson data, ported from the React app's config.js
// lesson-flattening logic (minus the React context). The Vue app reads the same
// coursePlans.json shipped in the OATutor content source.
import coursePlans from '@core/content-sources/oatutor/coursePlans.json'

interface RawLesson {
  id: string
  name: string
  topics: string
  [k: string]: unknown
}

interface RawCourse {
  courseName: string
  courseOER?: string
  courseLicense?: string
  language?: string
  lessons: RawLesson[]
}

export interface Lesson {
  id: string
  name: string
  topics: string
  courseName: string
}

const plans = coursePlans as unknown as RawCourse[]

// Hide editor/internal courses (prefixed with "!!") like the React app does.
const visibleCourses = plans.filter((p) => !p.courseName.startsWith('!!'))

export function courses(): readonly RawCourse[] {
  return visibleCourses
}

export function courseNames(): string[] {
  return visibleCourses.map((p) => p.courseName)
}

export function lessonsForCourse(courseName: string): Lesson[] {
  const c = visibleCourses.find((p) => p.courseName === courseName)
  if (!c) return []
  return c.lessons.map((l) => ({ ...l, courseName: c.courseName }))
}

export function defaultCourseName(): string {
  return (
    visibleCourses.find((p) => /calculus/i.test(p.courseName))?.courseName ??
    visibleCourses[0]?.courseName ??
    ''
  )
}

/** Session language declared by a course (coursePlans.json `language` field). */
export function courseLanguage(courseName: string): string | undefined {
  return visibleCourses.find((p) => p.courseName === courseName)?.language
}
