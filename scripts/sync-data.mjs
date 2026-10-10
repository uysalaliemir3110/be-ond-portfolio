// Copies the live admin data (public/data/*.json) into the bundled
// src/data/*.js defaults that generateStaticParams() reads at build time.
//
// This site uses `output: "export"` (a fully static build), so every
// /work/[slug] page must exist at build time — there's no server to render
// new pages on demand. Adding a collection/banner in the admin panel only
// updates public/data/*.json; run this script and rebuild to publish it.
//
// Usage: npm run sync-data && npm run build
// Also imported by src/app/api/save/route.ts so the localhost dev admin
// (which writes through this Next route instead of the production PHP
// backend) stays in sync automatically after every save.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// process.cwd() rather than import.meta.url-based resolution: this module is
// also imported into the /api/save route, where Turbopack bundles it and
// `new URL('.', import.meta.url)` no longer resolves to the real file path.
// Both `npm run sync-data` (run from the project root) and the dev server
// (started from the project root) have the right cwd for this to hold.
const projectRoot = process.cwd();

// An emitted `const x = [];` would be inferred as `any[]` and fail the strict
// type check, so array files carry a JSDoc annotation pointing at src/data/types.ts.
// This keeps the build working when the admin panel has been emptied out.
function syncOne(jsonName, jsFileName, exportName, typeName) {
  const jsonPath = path.join(projectRoot, 'public', 'data', jsonName);
  const jsPath = path.join(projectRoot, 'src', 'data', jsFileName);
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const annotation = typeName ? `/** @type {import('./types').${typeName}[]} */\n` : '';
  const body =
    `// Auto-generated from public/data/${jsonName} by scripts/sync-data.mjs\n` +
    `// Do not edit by hand — run \`npm run sync-data\` after saving in the admin panel.\n` +
    annotation +
    `const ${exportName} = ${JSON.stringify(data, null, 2)};\n\n` +
    `export default ${exportName};\n`;
  writeFileSync(jsPath, body);
  const summary = Array.isArray(data) ? `${data.length} items` : 'settings object';
  console.log(`Synced ${jsonName} -> src/data/${jsFileName} (${summary})`);
}

export function syncAll() {
  syncOne('archive.json', 'archive.js', 'archive', 'ArchiveItem');
  syncOne('carousel.json', 'carousel.js', 'carouselItems', 'CarouselItem');
  syncOne('carouselMobile.json', 'carouselMobile.js', 'carouselMobileItems', 'CarouselItem');
  syncOne('hero.json', 'hero.js', 'hero');
  syncOne('about.json', 'about.js', 'about');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) syncAll();
