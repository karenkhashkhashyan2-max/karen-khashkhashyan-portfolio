// Builds the web images for one project into assets/img/<slug>/.
//
//   npm i --no-save sharp
//   node tools/images.mjs <slug> <cover> <desktop> [mobile] [--wide] [--corners=<px>]
//
// cover    key art (any size/format); cropped to the card ratio, or padded with a
//          blurred copy of itself when its ratio is far from the card ratio.
// desktop  desktop screen of the interface.
// mobile   mobile screen (optional).
// --wide   16:9 card (sportsbooks) instead of the game card ratio.
// --corners=<px>  the key art has dark rounded corners baked in (radius in px at 1280 wide, Hi Lo: 72);
//          they are filled with the art's own colours so the rounded frames never show dark wedges.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const GAME_RATIO = 1280 / 900;
const WIDE_RATIO = 16 / 9;

// The art through a rounded mask over a blurred, slightly enlarged copy of itself.
async function fillCorners(base, W, H, radius) {
  const [bw, bh] = [Math.round(W * 1.12), Math.round(H * 1.12)];
  const fill = await sharp(base).resize(bw, bh).extract({ left: Math.round((bw - W) / 2), top: Math.round((bh - H) / 2), width: W, height: H }).blur(16).toBuffer();
  const mask = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${radius}"/></svg>`)).blur(1.5).png().toBuffer();
  const art = await sharp(base).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return sharp(fill).composite([{ input: art }]).removeAlpha().toBuffer();
}

async function cover(src, outDir, ratio, corners) {
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
  if (corners) base = await fillCorners(base, W, H, corners);
  for (const w of [320, 640, 1280]) {
    await sharp(base).resize(w).webp({ quality: w === 320 ? 72 : 80, effort: 5 }).toFile(`${outDir}/cover-${w}.webp`);
  }
}

export async function buildProject({ slug, cover: coverSrc, desktop, mobile, wide = false, corners = 0, root = '.' }) {
  const outDir = `${root}/assets/img/${slug}`;
  mkdirSync(outDir, { recursive: true });
  await cover(coverSrc, outDir, wide ? WIDE_RATIO : GAME_RATIO, corners);
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
  const corners = Number(args.find((a) => a.startsWith('--corners='))?.slice('--corners='.length)) || 0;
  const [slug, coverSrc, desktop, mobile] = args.filter((a) => !a.startsWith('--'));
  if (!slug || !coverSrc) {
    console.error('usage: node tools/images.mjs <slug> <cover> <desktop> [mobile] [--wide] [--corners=<px>]');
    process.exit(1);
  }
  console.log(slug, await buildProject({ slug, cover: coverSrc, desktop, mobile, wide, corners }));
}
