#!/usr/bin/env node
/**
 * renderOpenstaxSections.js — (part of "pre-render") Batch-convert every section
 * of an OpenStax book (listed in src/config/openstaxLinks.json) to a standalone
 * HTML file under public/textbook/<book>/<section>.html, so the app can read the
 * textbook offline. Also writes an index.json manifest.
 *
 * Images point at the raw GitHub media URL (load when online); to bundle them
 * offline, mirror osbooks repo `media/` into public/textbook/<book>/media/ and
 * pass --media-base=media/.
 *
 * Usage:
 *   node renderOpenstaxSections.js <osbooks-repo-root> [bookSlug] [outDir] [--media-base=URL]
 */
const fs = require("fs");
const path = require("path");
const { cnxToHtml } = require("./cnxToHtml.js");

const DEFAULT_MEDIA_BASE =
    "https://raw.githubusercontent.com/openstax/osbooks-calculus-bundle/main/media/";

function main() {
    const argv = process.argv.slice(2);
    const flags = argv.filter((a) => a.startsWith("--"));
    const positional = argv.filter((a) => !a.startsWith("--"));
    const repoRoot = positional[0];
    const bookSlug = positional[1] || "calculus-volume-1";
    const outDir = positional[2] || "public/textbook";
    const mediaFlag = flags.find((f) => f.startsWith("--media-base="));
    const mediaBase = mediaFlag ? mediaFlag.split("=")[1] : DEFAULT_MEDIA_BASE;

    if (!repoRoot) {
        console.error(
            "Usage: node renderOpenstaxSections.js <osbooks-repo-root> [bookSlug] [outDir] [--media-base=URL]"
        );
        process.exit(1);
    }

    const linksFile = path.join(__dirname, "..", "config", "openstaxLinks.json");
    const links = JSON.parse(fs.readFileSync(linksFile, "utf8"));
    const book = links[bookSlug];
    if (!book)
        throw new Error(`book "${bookSlug}" not found in ${linksFile}`);

    const sections = book.sections;
    const bookOut = path.join(outDir, bookSlug);
    fs.rmSync(bookOut, { recursive: true, force: true });
    fs.mkdirSync(bookOut, { recursive: true });

    const manifest = {};
    let count = 0;
    for (const [section, info] of Object.entries(sections)) {
        const cnxml = path.join(repoRoot, "modules", info.moduleId, "index.cnxml");
        if (!fs.existsSync(cnxml)) {
            console.warn(`  skip ${section}: missing ${cnxml}`);
            continue;
        }
        const html = cnxToHtml(fs.readFileSync(cnxml, "utf8"), {
            mediaBase,
            mathFormat: "latex",
            title: `${section} ${info.title}`,
        });
        fs.writeFileSync(path.join(bookOut, `${section}.html`), html);
        manifest[section] = {
            title: info.title,
            moduleId: info.moduleId,
            file: `${section}.html`,
            url: info.url,
        };
        count++;
    }

    fs.writeFileSync(
        path.join(bookOut, "index.json"),
        JSON.stringify(manifest, null, 2)
    );
    console.log(
        `rendered ${count}/${Object.keys(sections).length} sections -> ${bookOut} (media: ${mediaBase})`
    );
}

main();
