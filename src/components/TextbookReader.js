import React, { useEffect, useRef, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import BrandLogoNav from "@components/BrandLogoNav";
import { openExternalOnClick } from "../util/openExternal";
import { textbookSectionByBook } from "../util/textbookLink";

// Loads a pre-rendered OpenStax section (public/textbook/<book>/<section>.html,
// produced by src/tools/renderOpenstaxSections.js) and typesets its $$ LaTeX
// math with the app's existing MathJax instance.
export default function TextbookReader() {
    const { bookId, section } = useParams();
    const history = useHistory();
    const ref = useRef(null);
    const [state, setState] = useState({ html: null, error: null });

    useEffect(() => {
        let cancelled = false;
        setState({ html: null, error: null });
        fetch(`${import.meta.env.BASE_URL}textbook/${bookId}/${section}.html`)
            .then((r) =>
                r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status))
            )
            .then((t) => !cancelled && setState({ html: t, error: null }))
            .catch((e) =>
                !cancelled && setState({ html: null, error: e.message })
            );
        return () => {
            cancelled = true;
        };
    }, [bookId, section]);

    useEffect(() => {
        if (!state.html || !ref.current) return;
        const el = ref.current;
        const run = () => {
            if (window.MathJax?.typesetPromise)
                window.MathJax.typesetPromise([el]).catch(() => {});
        };
        if (window.MathJax?.startup?.promise)
            window.MathJax.startup.promise.then(run);
        else run();
    }, [state.html]);

    const meta = textbookSectionByBook(bookId, section);
    const title = meta ? `${section} ${meta.title}` : `Section ${section}`;

    return (
        <>
            <BrandLogoNav />
            <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
                <Button
                    onClick={() => history.goBack()}
                    style={{ marginBottom: 12 }}
                >
                    ← Back
                </Button>
                {meta?.url && (
                    <div style={{ float: "right", fontSize: 13 }}>
                        <a
                            href={meta.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={openExternalOnClick(meta.url)}
                        >
                            Open in OpenStax ↗
                        </a>
                    </div>
                )}
                <h1>{title}</h1>
                <div style={{ borderBottom: "1px solid #ddd", marginBottom: 16 }} />
                {state.error && (
                    <p>Failed to load this section ({state.error}).</p>
                )}
                {!state.html && !state.error && <p>Loading…</p>}
                <div
                    ref={ref}
                    className="cnx-content"
                    dangerouslySetInnerHTML={
                        state.html ? { __html: state.html } : undefined
                    }
                />
            </div>
        </>
    );
}
