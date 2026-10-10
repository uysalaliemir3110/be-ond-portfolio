// Generates the stand-in imagery the site ships with.
//
// BE/OND has no photography yet, so every cover, banner, gallery frame and
// about portrait is a generated SVG: a tonal ground, a woven line texture and
// a faint wordmark. They are deliberately abstract — drop real photos over
// them from the admin panel and nothing else has to change.
//
// Usage: npm run placeholders

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const publicDir = path.join(root, 'public');

// Muted, dyed-cloth tones. Each pair is (ground, light) — the gradient runs
// from the darker ground up into the lit fold.
const TONES = [
  ['#B9AE9D', '#E4DCCE'],
  ['#8E8C84', '#CFCCC3'],
  ['#C4A88C', '#EDE0CF'],
  ['#6F6E69', '#B4B2AB'],
  ['#A8998F', '#DED3C9'],
  ['#7C8279', '#C2C5B8'],
  ['#C2A6A0', '#EBD9D3'],
  ['#9A9AA2', '#D5D5DA'],
  ['#AD8F7B', '#DCC6B3'],
  ['#5E5B57', '#A3A09A'],
  ['#D0C3AD', '#F2EAD9'],
  ['#87796B', '#C6BAAB'],
];

// Deterministic PRNG so re-running the script never reshuffles the art.
function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function svg({ w, h, seed, index, label, code }) {
  const rand = rng(seed);
  // Stepping the palette by index keeps neighbouring covers in a grid from
  // landing on the same tone, which a purely random pick kept doing.
  const [ground, light] = TONES[(index * 5 + Math.floor(rand() * 3)) % TONES.length];
  const angle = Math.round(rand() * 46 - 23);
  const lx = (20 + rand() * 60).toFixed(1);
  const ly = (12 + rand() * 46).toFixed(1);
  const weave = 5 + Math.floor(rand() * 5);
  const id = seed.replace(/[^a-z0-9]/gi, '');
  const fs = Math.round(Math.min(w, h) * 0.036);
  const diag = Math.hypot(w, h);

  // Each fold is a long soft-edged band laid across the frame: a vertical
  // gradient gives it feathered edges, so it reads as light bending over
  // cloth rather than a rectangle pasted on top.
  const folds = Array.from({ length: 3 + Math.floor(rand() * 2) }, () => {
    const fy = h * (0.08 + rand() * 0.82);
    const fh = h * (0.06 + rand() * 0.18);
    const fa = angle / 3 + (rand() * 16 - 8);
    const dark = rand() > 0.55;
    return `<rect x="${(-diag / 2).toFixed(0)}" y="${fy.toFixed(0)}" width="${(diag * 1.6).toFixed(0)}" height="${fh.toFixed(0)}" fill="url(#${dark ? 'd' : 'f'}${id})" transform="rotate(${fa.toFixed(2)} ${w / 2} ${h / 2})"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="1" stop-color="${ground}"/>
    </linearGradient>
    <linearGradient id="f${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="d${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2A2622" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#2A2622" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#2A2622" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="l${id}" cx="${lx}%" cy="${ly}%" r="70%">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <pattern id="w${id}" width="${weave}" height="${weave}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
      <path d="M0 0 H${weave}" stroke="#000000" stroke-opacity="0.07" stroke-width="1"/>
      <path d="M0 0 V${weave}" stroke="#FFFFFF" stroke-opacity="0.09" stroke-width="1"/>
    </pattern>
    <radialGradient id="v${id}" cx="50%" cy="44%" r="74%">
      <stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.26"/>
    </radialGradient>
    <filter id="s${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${(Math.min(w, h) * 0.02).toFixed(1)}"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g${id})"/>
  <g filter="url(#s${id})">
    ${folds}
  </g>
  <rect width="${w}" height="${h}" fill="url(#w${id})"/>
  <rect width="${w}" height="${h}" fill="url(#l${id})"/>
  <rect width="${w}" height="${h}" fill="url(#v${id})"/>
  <g font-family="Helvetica, Arial, sans-serif" fill="#FFFFFF" text-anchor="middle">
    <text x="${w / 2}" y="${h / 2}" font-size="${fs}" letter-spacing="${fs * 0.18}" fill-opacity="0.34">BE/OND</text>
    <text x="${w / 2}" y="${h / 2 + fs * 1.9}" font-size="${fs * 0.46}" letter-spacing="${fs * 0.16}" fill-opacity="0.28">${code}</text>
  </g>
</svg>
`;
}

// Written out as .webp at the same sizes the admin upload pipeline produces, so
// a placeholder and a real uploaded photo are indistinguishable to the site and
// to the panel's delete/replace handlers.
let written = 0;
const jobs = [];
function write(rel, opts) {
  const full = path.join(publicDir, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  const markup = svg({ ...opts, seed: rel, index: written++ });
  const isCover = /cover\.webp$/.test(rel);
  jobs.push(
    sharp(Buffer.from(markup))
      .resize({ width: isCover ? 960 : 1920, withoutEnlargement: true })
      .webp({ quality: isCover ? 75 : 80 })
      .toFile(full),
  );
}

const COLLECTIONS = [
  { slug: 'terrain-ss26', shots: 7 },
  { slug: 'nightfold-fw2526', shots: 6 },
  { slug: 'raw-edge-ss25', shots: 6 },
  { slug: 'atlas-weave-fw2425', shots: 6 },
  { slug: 'salt-light-ss24', shots: 5 },
  { slug: 'graft-fw2324', shots: 5 },
  { slug: 'undertone-ss23', shots: 5 },
  { slug: 'first-cut-fw2223', shots: 5 },
];

let n = 0;
for (const { slug, shots } of COLLECTIONS) {
  write(`images/archive/${slug}/cover.webp`, { w: 900, h: 1200, label: slug, code: `C${String(++n).padStart(2, '0')}` });
  for (let i = 1; i <= shots; i++) {
    // Every third frame is a full-width plate in the detail layout.
    const wide = i % 3 === 0;
    write(`images/archive/${slug}/${String(i).padStart(2, '0')}.webp`, {
      w: wide ? 1800 : 1200,
      h: wide ? 1050 : 1600,
      label: `${slug} ${i}`,
      code: `${slug.slice(0, 3).toUpperCase()} ${String(i).padStart(2, '0')}`,
    });
  }
}

for (let i = 1; i <= 4; i++) {
  write(`carousel/banner-0${i}.webp`, { w: 2000, h: 1250, label: `banner ${i}`, code: `BANNER 0${i}` });
}

for (let i = 1; i <= 3; i++) {
  write(`about/atelier-0${i}.webp`, { w: 900, h: 1200, label: `atelier ${i}`, code: `ATELIER 0${i}` });
}

await Promise.all(jobs);
console.log(`Wrote ${jobs.length} placeholders: ${COLLECTIONS.length} collections, 4 banners, 3 atelier frames.`);
