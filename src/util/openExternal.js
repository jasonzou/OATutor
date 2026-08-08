import { isTauri } from "@tauri-apps/api/core";

// Open a URL externally: in the Tauri desktop shell this launches the system
// browser via the opener plugin; in the web build it opens a new tab.
export async function openExternal(url) {
    if (isTauri()) {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        return openUrl(url);
    }
    window.open(url, "_blank", "noopener,noreferrer");
}

// onClick handler factory for <a> elements pointing off-app.
export function openExternalOnClick(url) {
    return (e) => {
        e.preventDefault();
        openExternal(url);
    };
}
