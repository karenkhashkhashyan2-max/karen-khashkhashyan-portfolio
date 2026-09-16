// Builds the web images for one project into assets/img/<slug>/.
//
//   npm i --no-save sharp
//   node tools/images.mjs <slug> <cover> <desktop> [mobile] [--wide]
//
// cover    key art (any size/format); cropped to the card ratio, or padded with a
//          blurred copy of itself when its ratio is far from the card ratio.
// desktop  desktop screen of the interface.
// mobile   mobile screen (optional).
// --wide   16:9 card (sportsbooks) instead of the game card ratio.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const GAME_RATIO = 1280 / 900;
const WIDE_RATIO = 16 / 9;

async function cover(src, outDir, ratio) {
  const meta = await sharp(src).metadata();
  const srcRatio = meta.width / meta.height;
  const W = 1280;
  const H = Math.round(W / ratio);
  let base;
  if (Math.abs(srcRatio - ratio) / ratio < 0.06) {
    base = await sharp(src).resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer();
  } else {
    // Far from the card ratio: keep all of the art, fill the gap with a blurred, dimmed copy.
    const bg = await sharp(src).resize(W, H, { fit: 'cover' }).blur(28).modulate({ brightness: 0.5 }).toBuffer();
    const fg = await sharp(src).resize(W, H, { fit: 'inside' }).toBuffer();
    base = await sharp(bg).composite([{ input: fg, gravity: 'centre' }]).toBuffer();
  }
  for (const w of [320, 640, 1280]) {
    await sharp(base).resize(w).webp({ quality: w === 320 ? 72 : 80, effort: 5 }).toFile(`${outDir}/cover-${w}.webp`);
  }
}

export async function buildProject({ slug, cover: coverSrc, desktop, mobile, wide = false, root = '.' }) {
  const outDir = `${root}/assets/img/${slug}`;
  mkdirSync(outDir, { recursive: true });
  await cover(coverSrc, outDir, wide ? WIDE_RATIO : GAME_RATIO);
  if (desktop) {
    await sharp(desktop).flatten({ background: '#101110' }).resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(`${outDir}/desktop.webp`);
    await sharp(desktop).flatten({ background: '#101110' }).resize({ width: 960 }).webp({ quality: 78, effort: 5 }).toFile(`${outDir}/desktop-960.webp`);
  }
  if (mobile) {
    await sharp(mobile).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(`${outDir}/mobile.webp`);
  }
  const kb = (f) => (statSync(`${outDir}/${f}`).size / 1024).toFixed(0);
  return [
    'cover-320.webp', 'cover-640.webp', 'cover-1280.webp',
    ...(desktop ? ['desktop.webp', 'desktop-960.webp'] : []),
    ...(mobile ? ['mobile.webp'] : []),
  ].map((f) => `${f} ${kb(f)}KB`).join(', ');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const wide = args.includes('--wide');
  const [slug, coverSrc, desktop, mobile] = args.filter((a) => a !== '--wide');
  if (!slug || !coverSrc) {
    console.error('usage: node tools/images.mjs <slug> <cover> <desktop> [mobile] [--wide]');
    process.exit(1);
  }
  console.log(slug, await buildProject({ slug, cover: coverSrc, desktop, mobile, wide }));
}
