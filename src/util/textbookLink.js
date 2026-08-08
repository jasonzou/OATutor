import openstaxLinks from "../config/openstaxLinks.json";

// Maps an OATutor course name to the OpenStax book id used as the key in
// openstaxLinks.json. Add a row here when wiring up another OpenStax book.
const COURSE_TO_BOOK = {
    "OpenStax: Calculus Volume 1": "calculus-volume-1",
};

const SECTION_RE = /(\d+\.\d+)/;

export function bookIdForCourse(courseName) {
    return COURSE_TO_BOOK[courseName] || null;
}

/** "Lesson 5.6" -> "5.6" */
export function sectionNumberOfLesson(lesson) {
    const m = (lesson?.name || "").match(SECTION_RE);
    return m ? m[1] : null;
}

/** problem.lesson like "5.6 Integrals ..." -> "5.6" */
export function sectionNumberOfProblem(problem) {
    const m = (problem?.lesson || "").match(SECTION_RE);
    return m ? m[1] : null;
}

export function textbookSectionByBook(bookId, section) {
    if (!bookId || !section) return null;
    const meta = openstaxLinks[bookId]?.sections?.[section];
    return meta ? { ...meta, bookId } : null;
}

export function textbookSectionMeta(courseName, section) {
    return textbookSectionByBook(bookIdForCourse(courseName), section);
}

export function textbookSectionUrl(courseName, section) {
    return textbookSectionMeta(courseName, section)?.url || null;
}
