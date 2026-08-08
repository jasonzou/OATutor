# AGENTS.md

Guidance for agents working in the OATutor repository. The README documents
content authoring in depth; this file covers operational/build facts that are
not obvious from filenames.

## Essential commands

The frontend is bundled with **Vite** (`vite.config.mjs`). The legacy
`react-scripts`/`react-app-rewired`/`config-overrides.js` remain installed **only
for `npm test`**; dev and build no longer use them.

- `npm run start` (or `npm run dev`) — Vite dev server on **PORT 3001**. Runs
  `prestart` (the content preprocessor) automatically.
- `npm run build` — Vite production build → `build/`. Runs `prebuild`.
- `npm run preview` — serve the built `build/` locally.
- `npm test` — still uses `react-app-rewired test` (Jest). Tests have NOT been
  migrated to Vite/Vitest yet. This is why react-scripts/rewired are still deps.
- `prestart`/`predev`/`prebuild`/`pretest` all run
  `node src/tools/preprocessProblemPool.js`. There is no separate lint script;
  Vite does not run ESLint during build (the `.eslintrc.json` is for IDEs/`npm test`).
- `package.json` still has `"homepage": "place-holder"`; this is **web-deploy
  only** (CI `sed`-rewrites it). Vite ignores it; `index.html` at repo root is
  the real entry. Do not rely on the old `build-localhost` script (removed).

## Node version

- `package.json` declares `engines.node >=12`, but **Vite needs Node >=18** and
  `react-scripts 5` (for `npm test`) needs >=14. CI builds on Node 18. Use
  Node 18+ for everything.
- `src/tools/preprocessProblemPool.js` intentionally uses `fs.rm` when present
  and falls back to `fs.rmdir` — do not "simplify" this. `fs.rm` is absent on
  Node <14.14, while `rmdir` with `{recursive:true}` was removed in Node 16+, so
  the fallback chain is required to stay cross-version.

## Vite migration notes (gotchas an agent will re-trip on)

- **JSX lives in `.js` files.** Vite/esbuild uses the JS loader (no JSX) for
  `.js` by default; CRA tolerated it. `vite.config.mjs` forces the JSX loader
  for `src/**\/*.js` with the **automatic** runtime (some components use JSX
  without importing React, e.g. `BuildTimeIndicator.js`). If you add a JSX file
  outside `src/`, extend the `esbuild.include` regex.
- **No CommonJS in app source.** CRA/webpack tolerated `require()`/`module.exports`
  in ESM; Vite does not synthesize named exports from CJS. All previously-CJS
  source files were converted to ESM: `kas.js`, `calculateSemester.js`,
  `variabilize.js`, `wrongAnswerReasons.js`, `toastIds.js`, `parseJWT.js`, and
  `common/global-config.js`. Do **not** reintroduce `module.exports` in `src/`.
- `common/package.json` sets `"type": "module"`, so `common/global-config.js` is
  ESM. Its only Node CJS consumer (`preprocessProblemPool.js`) loads it via
  dynamic `import()`; if you add another Node-script consumer, use `import()`.
- Module aliases (`@generated`, `@components`, `@common/global-config`) are now in
  `vite.config.mjs` `resolve.alias`, not `config-overrides.js`.
- Runtime env is centralized in `src/util/runtimeEnv.js` (`import.meta.env`).
  `vite.config.mjs` sets `envPrefix` to leak `REACT_APP_*`/`AI_*` (CRA compat).
  `process.env.PUBLIC_URL` is `define`d to `""` (Vite serves `public/` at root);
  do not add new `process.env.*` reads in app code — use `runtimeEnv.js`.
- The generated content pool is loaded via `src/util/contentPool.js`
  (`import.meta.glob`, **non-eager** → Vite emits it as a **separate chunk**,
  not inlined). `src/index.js` calls `loadContentPool()` once at bootstrap and
  only mounts React afterwards; components then read it synchronously via
  `getContentPool()`. Main app bundle ≈ 6.6 MB; the content chunk (~32 MB)
  loads on demand. (Phase 4 will shrink the 6.6 MB by dropping firebase/aws-sdk.)

## Desktop (Tauri)

- The app also builds as a **Tauri v2** desktop binary (`src-tauri/`). Rust is
  compiled via cargo; the webview loads the Vite `build/` output.
- `npm run tauri dev` — run the desktop shell against the Vite dev server
  (`beforeDevCommand` = `npm run dev`, `devUrl` = `http://localhost:3001`).
- `npm run tauri build` — production desktop build. `beforeBuildCommand` runs the
  Vite build. Outputs `src-tauri/target/release/app` plus Linux bundles
  (`deb`/`rpm`). Targets are scoped to `["deb","rpm"]` because **AppImage
  (`linuxdeploy`) fails in headless/CI sandboxes**; re-add `"appimage"` only on a
  machine with FUSE.
- Linux builds require system libs: `webkit2gtk-4.1`, `gtk+-3.0`, `librsvg2`,
  `build-essential` (plus `dpkg`/`rpm` tooling for those bundle types).
- `tauri.conf.json`: `identifier` = `io.oatutor.desktop`, window 1280×800,
  `frontendDist` = `../build`. The Rust entry is `src-tauri/src/lib.rs`
  (`main.rs` calls `app_lib::run()`).

### Offline mode (`VITE_DESKTOP`)

- The Tauri build/dev commands set `VITE_DESKTOP=true`, which surfaces as
  `IS_DESKTOP` (`src/util/runtimeEnv.js`). When true the app is **fully offline**:
  `ENABLE_FIREBASE`/`DO_LOG_DATA`/`DO_FOCUS_TRACKING` are false, dynamic hints are
  off, and middleware is unused. `config.js` derives these flags from `IS_DESKTOP`.
- `firebase` and `aws-sdk` are **dynamically imported** (`Firebase.js`,
  `DynamicHintHelper.js`), so they are not in the main JS bundle and never loaded
  on desktop. They remain in `package.json` because the **web** build still uses
  Firebase and the dynamic-hint feature uses aws-sdk.
- Durable desktop persistence is via **`tauri-plugin-store`** (registered in
  `lib.rs`, permitted via `store:default` in `capabilities/default.json`).
  `src/util/desktopStorage.js` hydrates `localStorage` from the Tauri store at
  bootstrap (`index.js`) and mirrors writes back, so existing synchronous
  `localStorage` reads (e.g. `USER_ID_STORAGE_KEY`) need no changes. Currently
  only the userID is mirrored; lesson/BKT progress still uses localforage (which
  also persists in the Tauri webview) — migrate to the store if more durability
  is needed.
- The desktop build has **no network/CDN dependencies**: Titillium Web is bundled
  via `@fontsource/titillium-web` (imported in `src/index.js`, replacing the old
  Google Fonts `<link>`), Roboto via `typeface-roboto`, and math is rendered with
  **MathJax bundled locally** (`public/mathjax/`, loaded in `index.html`). KaTeX
  has been removed entirely. Embedded YouTube videos (`RenderMedia.js`) and the
  Canvas help link are still external and need the Tauri opener plugin to launch
  in the system browser.

### OpenStax contextual linking + offline textbook

- `src/config/openstaxLinks.json` maps `book id -> { section number -> {title,
  moduleId, url} }`. Generated by `src/tools/buildOpenstaxLinks.js` from an
  `osbooks` bundle's `collections/*.collection.xml` (chapter = subcollection
  order; first module per chapter is the `introduction` splash and is skipped;
  slug = lowercase -> strip diacritics -> drop apostrophes -> hyphens).
  Regenerate: `node src/tools/buildOpenstaxLinks.js <osbooks-repo> [bookSlugs] --verify`.
- `src/util/textbookLink.js` resolves a section URL from `problem.courseName` /
  `problem.lesson` or `lesson.name`; `src/util/openExternal.js` opens it (system
  browser via `tauri-plugin-opener` on desktop, new tab on web). Wired into the
  problem footer (`Problem.js`) and lesson cards (`LessonSelection.js`) as
  "Open section X.Y in OpenStax".
- For offline reading, `src/tools/renderOpenstaxSections.js` pre-renders every
  section to `public/textbook/<book>/<section>.html` via `src/tools/cnxToHtml.js`
  (CNX XML -> HTML; MathML -> `$$` LaTeX so the existing MathJax renders it).
  The in-app reader is `src/components/TextbookReader.js` at route
  `/textbook/:bookId/:section` (linked from lesson cards as "Read offline").
- Images in pre-rendered sections point at raw GitHub `media/` (online only);
  bundle `media/` locally for true offline figures. License: CC BY-NC-SA 4.0
  (non-commercial/share-alike) -- verify before redistributing.

## The generated content pool (most likely source of breakage)

- The app reads `@generated/processed-content-pool/${CONTENT_SOURCE}.json`
  through `src/util/contentPool.js` (a Vite `import.meta.glob` of the repo-root
  `generated/` dir). This file is produced only by `preprocessProblemPool.js`,
  and `generated/` is gitignored. **If prestart did not run, dev/build fail with
  a module-not-found / empty pool.**
- `CONTENT_SOURCE` is `"oatutor"` (`common/global-config.js`). The preprocessor
  reads `src/content-sources/oatutor/content-pool/` and also copies figures into
  `public/static/images/figures/oatutor/`.
- The path alias `@generated/*` is wired in `vite.config.mjs` `resolve.alias`
  (also in `jsconfig.paths.json` for editor IntelliSense).

## Submodule (required for any run)

- `src/content-sources/oatutor` is a git submodule (`.gitmodules`; note the
  submodule logical name is `oat` while the path is `oatutor`). It ships empty
  after a plain clone. A fresh checkout fails until you run:
  `git submodule update --init --recursive`
- Cloning should use `git clone --recurse-submodules`.

## Module aliases

- `@generated/*`, `@components/*`, and `@common/global-config` are all resolved
  by `resolve.alias` in `vite.config.mjs` (the first two also appear in
  `jsconfig.paths.json` for editor IntelliSense).
- `@common/global-config` is additionally a real npm dependency
  (`"file:./common"` → symlinked into `node_modules/@common/global-config`).
  The Vite alias takes precedence; if `@common/...` imports break after a
  reinstall, run `npm install` to restore the symlink.

## Build types & environment

- Build behavior is driven by `REACT_APP_BUILD_TYPE` (see
  `src/util/getBuildType.js`): `development` (default in `.env`),
  `production`, `platform-staging`, `content-staging`.
- All build/runtime env is read via `src/util/runtimeEnv.js` (`import.meta.env`).
  Vars consumed: `REACT_APP_FIREBASE_CONFIG` (JSON string; parsed by
  `src/util/loadFirebaseEnvConfig.js`), `REACT_APP_COMMIT_HASH`,
  `REACT_APP_BUILD_TIMESTAMP`, `REACT_APP_STUDY_ID`,
  `REACT_APP_MIDDLEWARE_URL`, `AI_HINT_GENERATION_AWS_ENDPOINT`.
- Local runtime config lives in `src/config/config.js` and
  `src/config/firebaseConfig.js` (the latter is gitignored as a secret).

## Deployment / branches

- These workflows deploy the **web build** (`npm run build` = Vite). The
  `place-holder` homepage in `package.json` is CI-rewritten via `sed`; Vite
  itself ignores `homepage`.
- Push `main` -> production CI -> `gh-pages` branch (homepage rewritten to
  `OATutor`). Push `staging` -> staging CI -> `CAHLR/OATutor-Staging` repo
  (homepage rewritten to `OATutor-Staging`).
- `content-staging` branch runs scheduled content-update workflows that pull
  external `CAHLR/OATutor-Tooling` Python scripts to regenerate
  `content-pool/` then run the preprocessor. Don't hand-edit that generated
  content on `content-staging`.
- **`vue` branch** hosts a parallel **Vue 3 rewrite** of the frontend in
  `desktop-vue/` (clean rewrite; the React app in `src/` is kept as the live
  reference during migration). See "Vue rewrite (desktop-vue/)" below.

## Vue rewrite (`desktop-vue/`)

- A standalone **pnpm** project (own `package.json`, `pnpm-lock.yaml`,
  `node_modules`). UI stack mirrors `showy-naive-starter`: **Vue 3 + TypeScript
  + Vite + UnoCSS + Naive UI** with `unplugin-auto-import` (vue/vue-router/
  naive composables) + `unplugin-vue-components` (`NaiveUiResolver`, so
  `NCard`/`NButton`/etc. need no import). Hash history (`createWebHashHistory`)
  for Tauri compatibility.
- It **reuses the framework-agnostic OATutor core** from the React app via the
  `@core` alias (`@core/util/textbookLink`, `@core/util/openExternal`,
  `@core/content-sources/...`). Do not duplicate that logic — import it. Also
  aliased: `@` -> `desktop-vue/src`, `@generated` -> repo `generated/`.
- Commands (run from `desktop-vue/`, needs Node >=18 / pnpm 11):
  `pnpm install` · `pnpm dev` (port 3002) · `pnpm build` (vue-tsc + vite) ·
  `pnpm typecheck`.
- pnpm 11 gates build scripts; `pnpm-workspace.yaml` sets
  `dangerouslyAllowAllBuilds: true` (esbuild/@parcel/watcher/vue-demi) so
  `pnpm install` doesn't fail on ignored builds.
- Status (Phase 0): scaffolded; `src/views/LessonSelection.vue` ported as the
  first screen (Naive UI cards/select + UnoCSS grid + the contextual textbook
  link via the shared core). Remaining components (ProblemCard, Problem,
  Platform, inputs, mathlive) port per the conversion plan.

## Where things live (entrypoints)

- `src/index.js` -> `src/App.js` (app context, firebase, userID, A/B hooks).
- `src/platform-logic/Platform.js` — top-level tutor UI; loads the processed
  pool and runs problem selection.
- `src/models/BKT/` — Bayesian Knowledge Tracing update + pluggable problem
  selection heuristics in `problem-select-heuristics/`.
- `src/components/Firebase.js` — all Firebase read/write.
- `src/platform-logic/checkAnswer.js` — answer validation (`arithmetic` /
  `numeric` / `string`).
- `src/tools/` — standalone Node scripts (Firebase CSV import/export, Google
  Sheets sync, content preprocessing). These have their **own**
  `package.json`/`node_modules`; run them from `src/tools/` after
  `cd src/tools && npm install`.

## Gotchas

- `src/config/bktParams/*.js`, `src/config/skillModel.js`,
  `src/config/coursePlans.js`, and `src/kas.js` have ESLint rules relaxed in
  `.eslintrc.json` for a reason (generated/vendored content) — don't "fix" the
  lint warnings there.
- Content JSON uses a custom markdown dialect: escape `\` as `\\`, newlines as
  `\\n`, inline LaTeX wrapped in `$$`, images as `##<figure>##`. See the README
  "Content Sources" section before editing problem JSON.
