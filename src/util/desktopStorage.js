import { isTauri } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";

// Rust-backed durable persistence for the desktop (Tauri) build, layered behind
// the app's existing synchronous localStorage usage so call sites don't change.
//
// Strategy: on bootstrap we hydrate localStorage from the Tauri store (so
// existing sync reads see persisted values); on write we mirror back to the
// store. Web/dev (non-Tauri) builds are no-ops.

const STORE_FILE = "oatutor-state.json";
let _store = null;

function store() {
    if (!_store) _store = new LazyStore(STORE_FILE);
    return _store;
}

/** Copy selected keys from the Tauri store into localStorage (desktop only). */
export async function hydrateFromDesktop(keys) {
    if (!isTauri()) return;
    try {
        for (const key of keys) {
            const value = await store().get(key);
            if (value != null && localStorage.getItem(key) == null) {
                localStorage.setItem(
                    key,
                    typeof value === "string" ? value : JSON.stringify(value)
                );
            }
        }
    } catch (e) {
        console.warn("desktop hydrate failed:", e);
    }
}

/** Mirror a write into the Tauri store (desktop only). Best-effort / fire-and-forget. */
export async function persistToDesktop(key, value) {
    if (!isTauri()) return;
    try {
        await store().set(key, value);
        await store().save();
    } catch (e) {
        console.warn("desktop persist failed:", e);
    }
}
