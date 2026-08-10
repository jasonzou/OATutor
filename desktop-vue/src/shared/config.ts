// Framework-agnostic config for the Vue app, reusing the shared core in ../src
// and ../common. Grows as more screens are ported.
import { SITE_NAME } from '@common/global-config'
import { BUILD_TIMESTAMP, IS_DESKTOP } from '@core/util/runtimeEnv'

export const AVAILABLE_LANGUAGES = ['en', 'es', 'se'] as const
export type Language = (typeof AVAILABLE_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: Language = 'en'

export { SITE_NAME, IS_DESKTOP, BUILD_TIMESTAMP }

// BKT mastery cutoff (from config.js).
export const MASTERY_THRESHOLD = 0.95

// Display names for OpenStax book ids, keyed by the ids used in
// @core/config/openstaxLinks.json (see bookIdForCourse in @core/util/textbookLink).
export const BOOK_TITLES: Record<string, string> = {
  'calculus-volume-1': 'Calculus Volume 1',
}

// Dynamic-text expansions (ported from config.js). Keys are replaced verbatim.
export const dynamicText: Record<string, string> = {
  '%CAR%': 'Tesla car',
}
