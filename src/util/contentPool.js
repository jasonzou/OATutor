import { CONTENT_SOURCE } from "@common/global-config";

// Load the processed content pool on demand as a separate (non-inlined) chunk so
// the main JS bundle stays small. The pool is fetched once at app bootstrap
// (see src/index.js) and cached; components read it synchronously via
// getContentPool() afterwards.
const _poolLoaders = import.meta.glob("../../generated/processed-content-pool/*.json");

let _pool = null;

export async function loadContentPool() {
    if (_pool) return _pool;
    const loader =
        _poolLoaders[`../../generated/processed-content-pool/${CONTENT_SOURCE}.json`];
    if (!loader) {
        console.error(`Content pool for source "${CONTENT_SOURCE}" not found.`);
        _pool = [];
        return _pool;
    }
    const mod = await loader();
    _pool = mod.default ?? [];
    return _pool;
}

export function getContentPool() {
    return _pool ?? [];
}
