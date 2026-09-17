#!/usr/bin/env node
/**
 * cnxToHtml.js — (part c) Convert an OpenStax CNX module (modules/<id>/index.cnxml)
 * into clean HTML for in-app rendering. MathML is preserved (standard <math>...,
 * no namespace prefix) so MathJax can typeset it; figures point at a configurable
 * media base.
 *
 * Usage:
 *   node cnxToHtml.js <index.cnxml> [--media-base=URL] [--title-as=h1] [--out=FILE]
 *   cat index.cnxml | node cnxToHtml.js > out.html
 *
 * MathJax note: the app currently typesets LaTeX ($$...$$). To render the MathML
 * this emits, load the MathML input jax:
 *   window.MathJax = { loader: { load: ['input/mml'] }, ... };
 * (or convert MathML -> LaTeX here instead).
 */
const fs = require("fs");
const path = require("path");

/* ---------- minimal XML tokenizer -> tree ---------- */

// Decode the XML predefined + numeric entities so attribute values and text
// nodes hold real characters; esc() re-encodes them on output. `&amp;` must be
// decoded last so e.g. source "&amp;lt;" stays the literal text "&lt;".
function decodeEntities(s) {
    return s
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
            String.fromCodePoint(parseInt(h, 16))
        )
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
}

// Index of the '>' closing the tag that starts at src[start] === '<',
// honoring quoted attribute values (a raw '>' is legal inside them —
// OpenStax alt text contains e.g. "x=1 for x>2").
function tagEnd(src, start) {
    let quote = null;
    for (let i = start + 1; i < src.length; i++) {
        const ch = src[i];
        if (quote) {
            if (ch === quote) quote = null;
        } else if (ch === '"' || ch === "'") {
            quote = ch;
        } else if (ch === ">") {
            return i;
        }
    }
    return -1;
}

function parseXml(src) {
    // drop declarations, comments, and the cnx-specific processing noise
    src = src
        .replace(/<\?[\s\S]*?\?>/g, "")
        .replace(/<!--[\s\S]*?-->/g, "");
    const root = { tag: "#root", attrs: {}, children: [] };
    const stack = [root];
    const pushText = (text) => {
        if (text.trim())
            stack[stack.length - 1].children.push({
                tag: "#text",
                text: decodeEntities(text),
            });
    };
    let last = 0;
    let i = 0;
    while ((i = src.indexOf("<", i)) !== -1) {
        const next = src[i + 1];
        // stray declarations/comments the pre-strip missed: skip, not text
        if (next === "!" || next === "?") {
            const end = src.indexOf(">", i);
            if (end === -1) break;
            last = i = end + 1;
            continue;
        }
        const end = tagEnd(src, i);
        if (end === -1) break;
        if (i > last) pushText(src.slice(last, i));
        const raw = src.slice(i + 1, end);
        const selfClose = raw.endsWith("/");
        const body = selfClose ? raw.slice(0, -1).trim() : raw.trim();
        const isClose = body.startsWith("/");
        if (isClose) {
            const name = body.slice(1).trim();
            // pop to the matching open (tolerant)
            for (let j = stack.length - 1; j > 0; j--) {
                if (stack[j].tag === name) {
                    stack.length = j;
                    break;
                }
            }
        } else {
            const sp = body.search(/\s/);
            const tag = sp === -1 ? body : body.slice(0, sp);
            const attrStr = sp === -1 ? "" : body.slice(sp + 1);
            const attrs = parseAttrs(attrStr);
            const node = { tag, attrs, children: [] };
            stack[stack.length - 1].children.push(node);
            if (!selfClose) stack.push(node);
        }
        last = i = end + 1;
    }
    if (last < src.length) pushText(src.slice(last));
    return root;
}

function parseAttrs(s) {
    const attrs = {};
    const re = /([\w:.-]+)\s*=\s*(["'])(.*?)\2/g;
    let m;
    while ((m = re.exec(s))) attrs[m[1]] = decodeEntities(m[3]);
    return attrs;
}

// OpenStax puts the accessible description on <media alt="…"> around the
// <image>; hoist it onto the image so it becomes the <img alt>.
function hoistMediaAlt(node) {
    for (const child of node.children || []) {
        if (localName(child.tag) === "media" && child.attrs.alt) {
            for (const img of child.children || []) {
                if (localName(img.tag) === "image" && !img.attrs.alt)
                    img.attrs.alt = child.attrs.alt;
            }
        }
        hoistMediaAlt(child);
    }
}

/* ---------- MathML -> LaTeX (for the reader; rendered by existing MathJax) ---------- */

function texText(s) {
    // text inside mi/mn/mo/mtext
    return s
        .replace(/\s+/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function texOperator(s) {
    const t = texText(s);
    return (
        {
            "→": "\\to ",
            "≤": "\\le ",
            "≥": "\\ge ",
            "≠": "\\ne ",
            "±": "\\pm ",
            "⋯": "\\cdots ",
            "…": "\\dots ",
            "∈": "\\in ",
            "∞": "\\infty ",
            "∂": "\\partial ",
            "·": "\\cdot ",
        }[t] || t
    );
}

function mathToLatex(node) {
    if (node.tag === "#text") return texText(node.text);
    const name = localName(node.tag);
    const kids = () => node.children.map(mathToLatex).join("");
    const group = (n) => {
        const nn = localName(n.tag);
        return ["mi", "mn", "mo", "mtext"].includes(nn)
            ? mathToLatex(n)
            : `{${mathToLatex(n)}}`;
    };
    const pair = () => {
        const c = node.children;
        return [c[0], c[1]];
    };
    switch (name) {
        case "math":
        case "mrow":
        case "mstyle":
        case "mphantom":
        case "mpadded":
            return kids();
        case "mi":
            return texText(textOf(node));
        case "mn":
            return texText(textOf(node));
        case "mo":
            return texOperator(textOf(node));
        case "mtext":
            return `\\text{${texText(textOf(node))}}`;
        case "mfrac": {
            const [a, b] = pair();
            return `\\frac{${mathToLatex(a)}}{${mathToLatex(b)}}`;
        }
        case "msub": {
            const [a, b] = pair();
            return `${group(a)}_{${mathToLatex(b)}}`;
        }
        case "msup": {
            const [a, b] = pair();
            return `${group(a)}^{${mathToLatex(b)}}`;
        }
        case "msubsup": {
            const [a, b, c] = node.children;
            return `${group(a)}_{${mathToLatex(b)}}^{${mathToLatex(c)}}`;
        }
        case "msqrt":
            return `\\sqrt{${kids()}}`;
        case "mroot": {
            const [a, b] = pair();
            return `\\sqrt[${mathToLatex(b)}]{${mathToLatex(a)}}`;
        }
        case "mspace":
            return "\\,";
        case "mfenced": {
            const o = node.attrs.open || "(";
            const c = node.attrs.close || ")";
            return `\\left${o} ${kids()} \\right${c}`;
        }
        case "munderover": {
            const [a, b, c] = node.children;
            return `${group(a)}_{${mathToLatex(b)}}^{${mathToLatex(c)}}`;
        }
        case "munder": {
            const [a, b] = pair();
            return `${group(a)}_{${mathToLatex(b)}}`;
        }
        case "mover": {
            const [a, b] = pair();
            return `${group(a)}^{${mathToLatex(b)}}`;
        }
        case "mtable": {
            const rows = node.children.filter(
                (c) => localName(c.tag) === "mtr"
            );
            return `\\begin{matrix}${rows
                .map((tr) =>
                    tr.children
                        .filter((c) => localName(c.tag) === "mtd")
                        .map(mathToLatex)
                        .join(" & ")
                )
                .join(" \\\\ ")}\\end{matrix}`;
        }
        default:
            return kids();
    }
}

/* ---------- CNX -> HTML serialization ---------- */

const VOID = new Set(["image", "br", "hr", "img"]);

function localName(tag) {
    return tag.includes(":") ? tag.slice(tag.indexOf(":") + 1) : tag;
}

// MathML element local names (rendered verbatim, prefix stripped)
const MATHML = new Set(
    [
        "math", "mrow", "mi", "mn", "mo", "mfrac", "msub", "msup", "msubsup",
        "msqrt", "mroot", "mtext", "mspace", "mtable", "mtr", "mtd", "mfenced",
        "mstyle", "munderover", "munder", "mover", "mphantom", "mpadded",
    ]
);

function esc(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function textOf(node) {
    if (node.tag === "#text") return node.text;
    return (node.children || []).map(textOf).join("");
}

function attrStr(attrs) {
    return Object.entries(attrs)
        .filter(([k]) => !["id", "document", "target-id", "for"].includes(k))
        .map(([k, v]) => ` ${k}="${esc(v).replace(/"/g, "&quot;")}"`)
        .join("");
}

function serialize(node, ctx) {
    if (node.tag === "#text") return esc(node.text.replace(/\s+/g, " "));
    const name = localName(node.tag);
    const kids = () => node.children.map((c) => serialize(c, ctx)).join("");

    switch (name) {
        case "metadata":
            return "";
        case "document":
            return `<section class="cnx-section">${kids()}</section>`;
        case "title":
            // Inside a CALS table, <title> is the table's title -> caption.
            if (ctx.inTable)
                return `<caption><strong class="cnx_label">${ctx.inTable}: </strong>${kids()}</caption>`;
            if (ctx.inExample) {
                return `<h${ctx.h}><span class="cnx_label">${ctx.inExample}: </span>${kids()}</h${ctx.h}>`;
            }
            return `<h${ctx.h}>${kids()}</h${ctx.h}>`;
        case "content":
            return kids();
        case "para":
            return `<p>${kids()}</p>`;
        case "emphasis": {
            const eff = node.attrs["effect"] || "";
            if (eff.includes("bold")) return `<strong>${kids()}</strong>`;
            return `<em>${kids()}</em>`;
        }
        case "term":
            return `<em class="term">${kids()}</em>`;
        case "equation": {
            const id = node.attrs.id || "";
            const t = id ? ctx.targets[id] : null;
            const anchor = id ? ` id="${id}"` : "";
            if (ctx.mathFormat === "latex") {
                const tex = node.children.map((c) => mathToLatex(c)).join("");
                const num = t ? `<span class="equation-number">(${t.n})</span>` : "";
                return `<div class="equation"${anchor}>$$${tex}$$${num}</div>`;
            }
            return `<div class="equation"${anchor}>${kids()}</div>`;
        }
        case "figure": {
            const id = node.attrs.id || "";
            const t = id ? ctx.targets[id] : null;
            ctx.inFigure = t ? `${t.label} ${t.n}` : null;
            const out = `<figure${id ? ` id="${id}"` : ""}>${kids()}</figure>`;
            ctx.inFigure = null;
            return out;
        }
        case "caption":
            if (ctx.inFigure) {
                return `<figcaption><strong class="cnx_label">${ctx.inFigure}: </strong>${kids()}</figcaption>`;
            }
            return `<figcaption>${kids()}</figcaption>`;
        case "media":
            return kids();
        case "image": {
            const src = (node.attrs.src || "").replace(/^(\.\.\/)+media\//, "");
            const alt = node.attrs.alt
                ? ` alt="${esc(node.attrs.alt).replace(/"/g, "&quot;")}"`
                : "";
            return `<img src="${ctx.mediaBase}${src}"${alt} />`;
        }
        case "list": {
            const ordered = /enumerated|numbered/.test(
                node.attrs["list-type"] || ""
            );
            return `<${ordered ? "ol" : "ul"}>${kids()}</${ordered ? "ol" : "ul"}>`;
        }
        case "item":
            return `<li>${kids()}</li>`;
        case "note": {
            const id = node.attrs.id || "";
            return `<aside class="cnx-note"${id ? ` id="${id}"` : ""}>${kids()}</aside>`;
        }
        case "example": {
            const id = node.attrs.id || "";
            const t = id ? ctx.targets[id] : null;
            ctx.inExample = t ? `${t.label} ${t.n}` : null;
            const out = `<div class="cnx-example"${id ? ` id="${id}"` : ""}>${kids()}</div>`;
            ctx.inExample = null;
            return out;
        }
        case "exercise":
        case "problem":
        case "statement":
            return `<div class="cnx-${name}">${kids()}</div>`;
        // Solutions are hidden by default and toggled open (XSL does this with
        // display:none + toggleSolution() in /js/exercise.js; <details> gives
        // the same behavior without inline JS, so it works via v-html/innerHTML
        // and under strict CSP in the Tauri webview).
        case "solution":
            return `<details class="cnx-solution"><summary>Solution</summary><div class="solution-contents">${kids()}</div></details>`;
        case "section":
            ctx.h = Math.min(ctx.h + 1, 6);
            return `<section>${kids()}</section>`;
        case "link": {
            // In-module cross-reference: resolve to "Figure 3"-style links
            // (behavior of the official cnxml_render.xsl).
            const text = kids();
            const doc = node.attrs.document;
            const targetId = node.attrs["target-id"];
            const target = targetId ? ctx.targets[targetId] : null;
            if (target) {
                const label = text || `${target.label} ${target.n}`;
                return `<a class="cnx-link" href="#${targetId}">${label}</a>`;
            }
            return doc
                ? `<a class="cnx-link" data-module="${doc}">${text || "(see reference)"}</a>`
                : text || "(see reference)";
        }
        /* --- CNX (CALS) tables -> HTML tables --- */
        case "table": {
            const prev = ctx.inTable;
            const id = node.attrs.id || "";
            const t = id ? ctx.targets[id] : null;
            ctx.inTable = t ? `${t.label} ${t.n}` : true;
            const out = `<table class="cnx-table"${id ? ` id="${id}"` : ""}>${kids()}</table>`;
            ctx.inTable = prev;
            return out;
        }
        case "name":
            // <name> is the table title in CALS; render it as a caption.
            if (ctx.inTable)
                return `<caption><strong class="cnx_label">${ctx.inTable}: </strong>${kids()}</caption>`;
            return kids();
        case "tgroup":
            return kids();
        case "colspec":
            return ""; // column widths/names not needed for rendering
        case "thead": {
            const prev = ctx.inThead;
            ctx.inThead = true;
            const out = `<thead>${kids()}</thead>`;
            ctx.inThead = prev;
            return out;
        }
        case "tbody":
            return `<tbody>${kids()}</tbody>`;
        case "tfoot":
            return `<tfoot>${kids()}</tfoot>`;
        case "row":
            return `<tr>${kids()}</tr>`;
        case "entry": {
            const tag = ctx.inThead ? "th" : "td";
            const span = node.attrs.morerows
                ? ` rowspan="${Number(node.attrs.morerows) + 1}"`
                : "";
            return `<${tag}${span}>${kids()}</${tag}>`;
        }
        default:
            // MathML and anything else: pass through with prefix stripped,
            // or (in latex mode) serialize MathML to LaTeX.
            if (ctx.mathFormat === "latex" && MATHML.has(name)) {
                const tex = mathToLatex(node);
                return `$$${tex}$$`;
            }
            if (MATHML.has(name) || VOID.has(name)) {
                return VOID.has(name)
                    ? `<${name}${attrStr(node.attrs)} />`
                    : `<${name}${attrStr(node.attrs)}>${kids()}</${name}>`;
            }
            // unknown container: unwrap (keep children)
            return kids();
    }
}

// Number figures/notes/examples/exercises in document order and map their ids,
// so <link target-id="…"> can resolve to "Figure 3"-style references (mirrors
// cnxml_render.xsl behavior).
const NUMBERED = {
    figure: "Figure",
    note: "Note",
    example: "Example",
    exercise: "Exercise",
    table: "Table",
    equation: "Equation",
};

function collectReferencedIds(node, set) {
    if (node.tag === "link" && node.attrs["target-id"])
        set.add(node.attrs["target-id"]);
    for (const child of node.children || []) collectReferencedIds(child, set);
    return set;
}

function numberTargets(node, counters, targets, referenced) {
    const name = localName(node.tag);
    if (NUMBERED[name]) {
        // Equations: only number the ones a <link> actually points at, so
        // unreferenced display math carries no "(N)" chrome.
        const wantNumber =
            name !== "equation" || (node.attrs.id && referenced.has(node.attrs.id));
        if (wantNumber) {
            counters[name] = (counters[name] || 0) + 1;
            if (node.attrs.id)
                targets[node.attrs.id] = { label: NUMBERED[name], n: counters[name] };
        }
    }
    for (const child of node.children || [])
        numberTargets(child, counters, targets, referenced);
    return targets;
}

function cnxToHtml(src, opts = {}) {
    const ctx = {
        h: 2,
        mediaBase: opts.mediaBase || "",
        mathFormat: opts.mathFormat === "latex" ? "latex" : "mathml",
        inTable: false,
        inThead: false,
        inFigure: null,
        inExample: null,
        targets: null,
    };
    const tree = parseXml(src);
    hoistMediaAlt(tree);
    ctx.targets = numberTargets(tree, {}, {}, collectReferencedIds(tree, new Set()));
    const body = tree.children.map((c) => serialize(c, ctx)).join("\n").trim();
    const h1 =
        opts.title ||
        (() => {
            const m = src.match(/<title>\s*([\s\S]*?)\s*<\/title>/);
            return m ? decodeEntities(m[1].trim()) : "";
        })();
    return `<section class="cnx-module">\n<h1>${esc(h1)}</h1>\n${body}\n</section>\n`;
}

/* ---------- CLI ---------- */

function main() {
    const argv = process.argv.slice(2);
    const flags = argv.filter((a) => a.startsWith("--"));
    const positional = argv.filter((a) => !a.startsWith("--"));
    const mediaFlag = flags.find((f) => f.startsWith("--media-base="));
    const titleFlag = flags.find((f) => f.startsWith("--title="));
    const outFlag = flags.find((f) => f.startsWith("--out="));

    let src;
    if (positional[0] && positional[0] !== "-") {
        src = fs.readFileSync(positional[0], "utf8");
    } else {
        src = fs.readFileSync(0, "utf8"); // stdin
    }
    const html = cnxToHtml(src, {
        mediaBase: mediaFlag ? mediaFlag.split("=")[1] : "",
        title: titleFlag ? titleFlag.split("=")[1] : undefined,
    });
    if (outFlag) {
        fs.writeFileSync(outFlag.split("=")[1], html);
        process.stderr.write(`wrote ${outFlag.split("=")[1]}\n`);
    } else {
        process.stdout.write(html);
    }
}

if (require.main === module) main();

module.exports = { cnxToHtml, parseXml };
