# Karen Khashkhashyan · Portfolio

Static portfolio of Karen Khashkhashyan, Product Designer in iGaming.
Live: https://karenkhashkhashyan2-max.github.io/karen-khashkhashyan-portfolio/

No build step, no npm install, no backend. GitHub Pages serves the repository root.

## Files

| File | What it holds |
|---|---|
| `index.html` | Page structure and the English text of every section |
| `i18n.js` | Interface text in English, Armenian and Russian (`data-t="key"` in the HTML) |
| `projects.js` | Every project: order, category, links and case-study text |
| `app.js` | Behaviour: languages, work grid, reels, case study, timeline, motion |
| `style.css` | Design tokens, layout, components, responsive rules |
| `assets/img/<slug>/` | Web images per project (see below) |
| `assets/vendor/` | GSAP 3.15 (ScrollTrigger, Flip) and Lenis 1.3, copied from npm |
| `assets/Karen-Khashkhashyan-CV-ATS.pdf` | One-column, text-based CV linked from the site |
| `tools/images.mjs` | Builds the web images for a project |
| `docs/REDESIGN-NOTES.md` | What changed in the 2026 redesign and open content questions |

## Edit text

- Interface and section text: `i18n.js`. Keep the same key in `en`, `hy` and `ru`.
- Project text: `projects.js`. A plain string shows in every language; `{ en, hy, ru }` is translated.
- Experience rows: `index.html` (`data-start` / `data-end` drive the timeline bars and durations).

## Add a project

1. Copy an entry in `projects.js` and change `slug`, `name`, `category`, `platform`, `link` and the text.
2. Build its images (needs Node 18+):
   ```bash
   npm i --no-save sharp
   node tools/images.mjs my-game path/to/key-art.png path/to/desktop.png path/to/mobile.png
   ```
   Sportsbook projects use 16:9 cards: add `--wide`. Without a mobile screen, set `mobile: false`.
   Key art with dark rounded corners baked in (like Hi Lo's) needs `--corners=<radius at 1280 px>`,
   or the corners show as dark wedges inside the rounded frames.
3. The grid, filters, counts, reels and case study pick the project up automatically.

## Motion

- Hero reels follow the Shining Pop V2 reel timing (wind-up, one stop tween with overshoot, 110 ms stagger).
- Case studies open with a shared-element flight from the clicked card; arrows and ← → keys move between projects; links like `#work/rockbet` open a case directly.
- The manifesto, principles and contact card are scroll-driven; the WebGL reel-stop hover (spin from the pointer's side, lean, flick) runs only on desktop pointers with WebGL.
- Pinned sections carry `refreshPriority: 1` so ScrollTrigger measures them before the triggers below them; keep it on any new pin, or those triggers fire early.
- Everything respects `prefers-reduced-motion`; without JavaScript the page still shows its text, and the CV lists all work.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Ownership

Personal portfolio content belongs to Karen Khashkhashyan. Game artwork and third-party brands retain
their respective ownership. GSAP is used under its standard no-charge license; Lenis and Russo One ship
with their own licenses.
