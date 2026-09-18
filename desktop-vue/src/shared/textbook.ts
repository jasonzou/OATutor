// Reading-mode content index: groups openstaxLinks.json sections by chapter
// ("5.6" -> chapter 5). Section fragments live in
// public/textbook/<book>/<section>.html — the same pre-rendered content the
// in-question section panel (SectionContent.vue) renders.
import linksJson from '@core/config/openstaxLinks.json'

export interface SectionMeta { title: string; moduleId: string; url: string }
export interface Chapter { num: number; sections: { section: string; meta: SectionMeta }[] }

const links = linksJson as Record<string, { sections: Record<string, SectionMeta> }>

export function availableBooks(): { id: string }[] {
  return Object.keys(links).map(id => ({ id }))
}

/** Flat ordered list of section numbers across all chapters. */
export function flatSections(bookId: string): string[] {
  return chapters(bookId).flatMap(c => c.sections.map(s => s.section))
}

export function chapters(bookId: string): Chapter[] {
  const sections = links[bookId]?.sections ?? {}
  const byChapter = new Map<number, Chapter>()
  for (const [section, meta] of Object.entries(sections)) {
    const num = Number(section.split('.')[0])
    if (!byChapter.has(num)) byChapter.set(num, { num, sections: [] })
    byChapter.get(num)!.sections.push({ section, meta })
  }
  return [...byChapter.values()].sort((a, b) => a.num - b.num)
}

export function sectionMeta(bookId: string, section: string): SectionMeta | null {
  return links[bookId]?.sections?.[section] ?? null
}
