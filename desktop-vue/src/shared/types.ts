// Shared types for the processed OATutor content pool and BKT state. These
// describe the JSON produced by src/tools/preprocessProblemPool.js (see the repo
// AGENTS.md "generated content pool" section) plus the lesson rows in
// coursePlans.json. Field optionality mirrors the source data — content is
// authored loosely, so most fields are optional.

/** Per-skill Bayesian Knowledge Tracing parameters (bkt-params/*.json). */
export interface BKTParams {
  probMastery: number
  probTransit: number
  probSlip: number
  probGuess: number
}

/** A hint (or sub-hint) inside a step's hints pathway. */
export interface Hint {
  id: string
  title?: string
  text?: string
  type?: string // 'scaffold' hints carry hintAnswer; 'bottomOut' is injected
  dependencies?: number[]
  variabilization?: Record<string, unknown>
  subHints?: Hint[]
  hintAnswer?: string[]
  answerType?: string
  precision?: number
  answerValidator?: string
  problemType?: string
  choices?: string[]
  numRows?: number
  numCols?: number
}

/** One question step inside a problem. */
export interface Step {
  id: string
  stepTitle?: string
  stepBody?: string
  stepAnswer?: string[]
  answerType?: string
  problemType?: string
  precision?: number
  answerValidator?: string
  variabilization?: Record<string, unknown>
  knowledgeComponents?: string[]
  hints?: Record<string, Hint[]>
  choices?: string[]
  numRows?: number
  numCols?: number
  units?: string
}

/** A problem from the processed content pool. `probMastery` is computed at
 * runtime by the platform's problem-selection pass, not shipped in the pool. */
export interface PoolProblem {
  id: string
  title?: string
  body?: string
  lesson?: string
  lessonId?: string
  courseName?: string
  variabilization?: Record<string, unknown>
  steps: Step[]
  probMastery?: number | null
}

/** A lesson row from coursePlans.json (plus courseName/language added when the
 * lesson is looked up through its parent course). */
export interface LessonPlan {
  id?: string
  name?: string
  topics?: string
  courseName?: string
  language?: string
  learningObjectives?: Record<string, number>
  giveStuFeedback?: boolean | null
  giveStuHints?: boolean | null
  keepMCOrder?: boolean | null
  giveHintOnIncorrect?: boolean | null
  keyboardType?: string | null
  doMasteryUpdate?: boolean | null
  unlockFirstHint?: boolean | null
  giveStuBottomHint?: boolean | null
  allowDynamicHint?: boolean
  allowRecycle?: boolean
}

/** The subset of answer-bearing fields ProblemInput needs. Both Step and Hint
 * structurally satisfy this, so scaffold hints can reuse the same input. */
export interface AnswerTarget {
  problemType?: string
  answerType?: string
  stepAnswer?: string[]
  hintAnswer?: string[]
  choices?: string[]
  units?: string
  numRows?: number
  numCols?: number
}
