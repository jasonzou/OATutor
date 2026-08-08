#!/usr/bin/env node
/**
 * buildOpenstaxLinks.js — (part a) Parse an OpenStax "osbooks" collection.xml
 * (CNX collxml) into a { section-number -> { title, moduleId, url } } map that
 * the OATutor UI uses for contextual "Open this section in OpenStax" links.
 *
 * Source repo layout (clone https://github.com/openstax/osbooks-calculus-bundle):
 *   collections/<book-slug>.collection.xml   (TOC: chapters -> module ids)
 *   modules/<module-id>/index.cnxml          (per-section content; we read its title)
 *
 * Numbering rules (verified against openstax.org):
 *   - Each <col:subcollection> is a chapter, numbered 1, 2, ... in document order.
 *   - The FIRST module in a chapter is the chapter "Introduction" (class=
 *     "introduction"); it is skipped. Subsequent modules are sections X.1, X.2, ...
 *   - Top-level modules outside any subcollection (preface, index, back-matter)
 *     are skipped.
 *
 * Slug rule (verified): lowercase -> NFD strip diacritics -> drop apostrophes ->
 * runs of non-[a-z0-9] -> single hyphen. Then url = .../pages/<chap>-<sec>-<slug>.
 *
 * Usage:
 *   node buildOpenstaxLinks.js <osbooks-repo-root> [bookSlug...] [--out=FILE] [--verify]
 *
 *   --out=FILE   write JSON to FILE (default: stdout)
 *   --verify     HEAD-check every URL against openstax.org and print mismatches
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const OPENSTAX_BASE = "https://openstax.org/books";

function slugify(title) {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics (ô -> o)
        .replace(/['’`´]/g, "") // remove apostrophes (Newton's -> newtons)
        .replace(/[^a-z0-9]+/g, "-") // non-alphanum runs -> hyphen
        .replace(/^-+|-+$/g, "");
}

function readModuleMeta(modulesDir, moduleId) {
    const file = path.join(modulesDir, moduleId, "index.cnxml");
    if (!fs.existsSync(file)) return { title: moduleId, isIntro: false };
    const src = fs.readFileSync(file, "utf8");
    const titleMatch = src.match(/<title>\s*([\s\S]*?)\s*<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : moduleId;
    const classMatch = src.match(/<document[^>]*\bclass="([^"]*)"/);
    const cls = classMatch ? classMatch[1] : "";
    const isIntro =
        /\bintroduction\b/i.test(cls) || /^introduction$/i.test(title);
    return { title, isIntro };
}

/** Find balanced <col:subcollection>...</col:subcollection> regions within src. */
function eachSubcollection(src, cb) {
    const open = "<col:subcollection>";
    const close = "</col:subcollection>";
    let i = 0;
    while (true) {
        const start = src.indexOf(open, i);
        if (start === -1) break;
        // match nesting
        let depth = 1;
        let pos = start + open.length;
        while (depth > 0) {
            const nextOpen = src.indexOf(open, pos);
            const nextClose = src.indexOf(close, pos);
            if (nextClose === -1) break;
            if (nextOpen !== -1 && nextOpen < nextClose) {
                depth++;
                pos = nextOpen + open.length;
            } else {
                depth--;
                pos = nextClose + close.length;
            }
        }
        cb(src.slice(start, pos));
        i = pos;
    }
}

function moduleIdsIn(src) {
    const ids = [];
    const re = /<col:module\s+document="([^"]+)"\s*\/>/g;
    let m;
    while ((m = re.exec(src))) ids.push(m[1]);
    return ids;
}

function subcollectionTitle(src) {
    const m = src.match(/<md:title>\s*([\s\S]*?)\s*<\/md:title>/);
    return m ? m[1].replace(/\s+/g, " ").trim() : "(untitled chapter)";
}

function contentBlockOf(src) {
    const m = src.match(/<col:content>([\s\S]*?)<\/col:content>/);
    return m ? m[1] : src;
}

function buildBook(repoRoot, bookSlug) {
    const collectionFile = path.join(
        repoRoot,
        "collections",
        `${bookSlug}.collection.xml`
    );
    if (!fs.existsSync(collectionFile))
        throw new Error(`collection not found: ${collectionFile}`);
    const xml = fs.readFileSync(collectionFile, "utf8");
    const modulesDir = path.join(repoRoot, "modules");

    const sections = {};
    let chapterIndex = 0;
    eachSubcollection(xml, (sub) => {
        chapterIndex++;
        const chapterTitle = subcollectionTitle(sub);
        const inner = contentBlockOf(sub);
        // nested subcollections (units -> chapters) are not expected for these
        // books; if present, we'd recurse. Here we take direct modules.
        const moduleIds = moduleIdsIn(inner);
        let sectionNo = 0;
        for (const moduleId of moduleIds) {
            const meta = readModuleMeta(modulesDir, moduleId);
            if (meta.isIntro) continue; // chapter splash page
            sectionNo++;
            const section = `${chapterIndex}.${sectionNo}`;
            const urlSlug = `${chapterIndex}-${sectionNo}-${slugify(meta.title)}`;
            sections[section] = {
                title: meta.title,
                moduleId,
                url: `${OPENSTAX_BASE}/${bookSlug}/pages/${urlSlug}`,
            };
        }
    });

    return { slug: bookSlug, sections };
}

function headStatus(url) {
    return new Promise((resolve) => {
        const req = https.request(
            url,
            { method: "HEAD", timeout: 15000 },
            (res) => resolve(res.statusCode)
        );
        req.on("error", () => resolve(0));
        req.on("timeout", () => {
            req.destroy();
            resolve(0);
        });
        req.end();
    });
}

async function main() {
    const argv = process.argv.slice(2);
    const repoRoot = argv[0];
    if (!repoRoot) {
        console.error(
            "Usage: node buildOpenstaxLinks.js <osbooks-repo-root> [bookSlug...] [--out=FILE] [--verify]"
        );
        process.exit(1);
    }
    const flags = argv.filter((a) => a.startsWith("--"));
    const books = argv
        .slice(1)
        .filter((a) => !a.startsWith("--"));
    const outFlag = flags.find((f) => f.startsWith("--out="));
    const verify = flags.includes("--verify");

    if (books.length === 0) {
        const collDir = path.join(repoRoot, "collections");
        books.push(
            ...fs
                .readdirSync(collDir)
                .filter((f) => f.endsWith(".collection.xml"))
                .map((f) => f.replace(/\.collection\.xml$/, ""))
        );
    }

    const result = {};
    for (const slug of books) {
        const book = buildBook(repoRoot, slug);
        result[slug] = book;
    }

    if (verify) {
        for (const slug of Object.keys(result)) {
            const entries = Object.entries(result[slug].sections);
            process.stderr.write(
                `verifying ${entries.length} URLs for ${slug}...\n`
            );
            for (const [section, info] of entries) {
                const code = await headStatus(info.url);
                if (code !== 200) {
                    process.stderr.write(
                        `  [${code}] ${section} ${info.title} -> ${info.url}\n`
                    );
                }
            }
        }
    }

    const json = JSON.stringify(result, null, 2);
    if (outFlag) {
        const outPath = outFlag.split("=")[1];
        fs.writeFileSync(outPath, json + "\n");
        process.stderr.write(`wrote ${outPath}\n`);
    } else {
        process.stdout.write(json + "\n");
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
