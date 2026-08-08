import React, { useEffect, useRef, useState } from "react";

/**
 * Renders a LaTeX string with MathJax.
 *
 * MathJax is loaded from `public/mathjax/` via `index.html`; the global
 * `MathJax` object exposes `typesetPromise`, which is used to typeset just the
 * node wrapped in the configured `$$...$$` delimiters.
 *
 * On a typeset failure the error is thrown from render so the surrounding
 * ErrorBoundary can display the raw text and log the error.
 */
export default function MathText({ math, display = false }) {
    const containerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const typeset = async () => {
            const node = containerRef.current;
            const MathJax = typeof window === "undefined" ? null : window.MathJax;
            if (!node || !MathJax?.startup?.promise) {
                return;
            }
            try {
                await MathJax.startup.promise;
                MathJax.typesetClear([node]);
                await MathJax.typesetPromise([node]);
            } catch (e) {
                if (!cancelled) {
                    setError(e);
                }
            }
        };

        typeset();
        return () => {
            cancelled = true;
        };
    }, [math, display]);

    if (error) {
        throw error;
    }

    if (typeof math !== "string" || math.length === 0) {
        return null;
    }

    const [open, close] = display ? ["\\[", "\\]"] : ["$$", "$$"];
    return <span ref={containerRef}>{open + math + close}</span>;
}
