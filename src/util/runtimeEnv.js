// Single source of truth for build/runtime environment in the browser bundle.
// Vite only exposes vars matching `envPrefix` (see vite.config.js) via import.meta.env.
const env = import.meta.env;

// Set to "true" by the Tauri build/dev commands (beforeBuildCommand/beforeDevCommand).
// When true, the app runs fully offline: no Firebase logging, no dynamic hints,
// no middleware, and state is persisted via the Tauri store.
export const IS_DESKTOP = env.VITE_DESKTOP === "true";

export const COMMIT_HASH = env.REACT_APP_COMMIT_HASH ?? "";
export const BUILD_TIMESTAMP = env.REACT_APP_BUILD_TIMESTAMP ?? "";
export const BUILD_TYPE = env.REACT_APP_BUILD_TYPE ?? "development";
export const FIREBASE_CONFIG = env.REACT_APP_FIREBASE_CONFIG ?? "";
export const STUDY_ID = env.REACT_APP_STUDY_ID;
export const AI_HINT_GENERATION_AWS_ENDPOINT = env.AI_HINT_GENERATION_AWS_ENDPOINT;
// Dynamic hints are AWS-signed and will be removed in the offline desktop build.
export const AWS_ACCESS_KEY = env.AWS_ACCESS_KEY;
export const AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY;
