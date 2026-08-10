import { describe, expect, it } from 'vitest'
import {
  courseLanguage,
  courseNames,
  courses,
  defaultCourseName,
  lessonsForCourse,
} from '@/shared/lessons'

describe('lessons', () => {
  it('hides editor-internal courses prefixed with "!!"', () => {
    expect(courseNames().some(n => n.startsWith('!!'))).toBe(false)
  })

  it('returns at least one visible course', () => {
    expect(courses().length).toBeGreaterThan(0)
  })

  it('attaches the course name to each lesson', () => {
    for (const name of courseNames()) {
      for (const lesson of lessonsForCourse(name)) {
        expect(lesson.courseName).toBe(name)
      }
    }
  })

  it('returns an empty list for an unknown course', () => {
    expect(lessonsForCourse('no-such-course')).toEqual([])
  })

  it('prefers a calculus course as the default', () => {
    expect(defaultCourseName()).toMatch(/calculus/i)
  })

  it('resolves a course session language', () => {
    expect(courseLanguage(defaultCourseName())).toBe('en')
    expect(courseLanguage('no-such-course')).toBeUndefined()
  })
})
