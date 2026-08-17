#!/usr/bin/env node
/**
 * stageTextbook.js — Stage the official cnx-transforms fragments for a book
 * into the app's public/ dir so the textbook can be read fully OFFLINE:
 *
 *   public/textbook/calc1/<section>.html      fragment, `../../media/` -> `media/`
 *   public/textbook/calc1/media/<file>        every image referenced by a fragment
 *
 * Inputs:
 *   - html dir produced by cnxml/scripts/build_html.py (<moduleId>.fragment.html)
 *   - osbooks repo media/ dir (the actual image files)
 *   - src/config/openstaxLinks.json (section -> moduleId map)
 *
 * Usage:
 *   node src/tools/stageTextbook.js <html-out-dir> <osbooks-repo> [dest]
 *     html-out-dir  where build_html.py wrote *.fragment.html
 *     osbooks-repo  cloned openstax/osbooks-* repo (needs media/)
 *     dest          default: public/textbook/calc1
 */
const fs = require("fs");
const path = require("path");

function main() {
    const [htmlDir, repoRoot, destArg] = process.argv.slice(2);
    if (!htmlDir || !repoRoot) {
        console.error(
            "Usage: node stageTextbook.js <html-out-dir> <osbooks-repo> [dest]"
        );
        process.exit(1);
    }
    const dest = destArg || path.join(__dirname, "..", "..", "public", "textbook", "calc1");

    const linksFile = path.join(__dirname, "..", "config", "openstaxLinks.json");
    const sections = JSON.parse(fs.readFileSync(linksFile, "utf8"))[
        "calculus-volume-1"
    ].sections;

    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(path.join(dest, "media"), { recursive: true });

    const MEDIA_RE = /\.\.\/\.\.\/media\//g;
    const needed = new Set();
    let staged = 0;

    for (const [section, info] of Object.entries(sections)) {
        const src = path.join(htmlDir, `${info.moduleId}.fragment.html`);
        if (!fs.existsSync(src)) {
            console.warn(`  !! missing fragment for ${section} (${info.moduleId})`);
            continue;
        }
        let html = fs.readFileSync(src, "utf8");
        for (const m of html.matchAll(/src="(\.\.\/\.\.\/media\/[^"]+)"/g)) {
            needed.add(path.basename(m[1]));
        }
        html = html.replace(MEDIA_RE, "media/");
        fs.writeFileSync(path.join(dest, `${section}.html`), html);
        staged++;
    }

    let copied = 0, missing = 0;
    for (const file of [...needed].sort()) {
        const from = path.join(repoRoot, "media", file);
        const to = path.join(dest, "media", file);
        if (fs.existsSync(from)) {
            fs.copyFileSync(from, to);
            copied++;
        } else {
            console.warn(`  !! media not found in repo: ${file}`);
            missing++;
        }
    }

    console.log(
        `staged ${staged} sections + ${copied} media files -> ${dest}` +
        (missing ? ` (${missing} media MISSING)` : "")
    );
}

main();
