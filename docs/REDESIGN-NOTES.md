# Redesign notes (September 2026)

What changed, why, and what Karen should confirm.

## Identity kept

Dark surface, one lime accent, Russo One for display type, the KK® mark and the line
"Serious UX. Playful worlds." Long reading text moved to Manrope so case studies read comfortably;
Armenian uses Noto Sans Armenian.

## Structure

1. **Hero**: name, role, headline, and a three-reel slot machine built from Karen's own games.
   The reels spin on load and on **Spin**; the three games on the payline open their case studies.
2. **Selected work**: Games / Sportsbooks tabs, category filters with counts (animated with GSAP Flip),
   22 game cards and 2 sportsbook cards.
3. **Case study** (one dialog for all projects): the whole key art in its own proportions over a blurred
   copy of it, facts (company, category, platform, role),
   play or Figma link, desktop and mobile screens, problem, contribution with highlight lists,
   validation, next project. Prev/next buttons and ← → keys, reading progress, deep links
   (`#work/<slug>`), browser Back closes it.
4. **Manifesto and mission**: a full-height statement that lights up word by word while scrolling.
5. **How I think about game UX**: three full-height principles, each with a live micro demo
   (crash multiplier and cash-out, thumb reach on a phone, one betting dock across three slot skins).
6. **Profile**: bio, story, 5+ / 30+ odometers, skills, tools, technology, languages.
7. **Experience**: timeline bars drawn to scale, durations, a short description per role;
   Sportcore and Tether Bet link to their case studies.
8. **Contact**: a lime card that opens to full width on scroll, copy-email button, phone, LinkedIn, CV.

## Motion system

| Moment | Timing | Source |
|---|---|---|
| Reel spin | 85 ms wind-up (12% of a tile), one travel tween: 10% speed-up, 56% cruise, 34% stop on `S(u)=2u+(p-1)u²-2pu³+pu⁴`, p = 3.4; reels rest 110 ms apart; 5 px column dip and bottom-up squash on impact; second press quick-stops (18 ms stagger, 100 ms) | Shining Pop V2 reel engine |
| Payline win | winners scale 1.06 in 240 ms with 55 ms cascade, others dim, sheen sweep | Shining Pop win presentation |
| Card → case | the card cover flies into the framed case cover (850 ms expo in-out) while the blurred backdrop fades in; closing flies back to the card | Shared-element transition pattern |
| Case → next case | text out in 160 ms, new cover wipes in over a ghost of the old one, no empty frames | |
| Card hover (desktop, WebGL) | the strip spins from the side the pointer entered (5 tiles, 500 ms) and lands on the interface screen on the reel stop curve; blur and RGB split follow its speed. While hovered it leans toward the pointer, a quick vertical flick spins on to the screen again (420 ms), leaving spins back to the key art (400 ms). Screens of cards in view load ahead of time | Research pick 1 |
| Manifesto | pinned on desktop, words go from 36% to 100% opacity with scroll | Research pick 2 |
| Filters / tabs | leaving cards fade 180 ms, Flip reflow 600 ms, entering cards rise | |
| Contact card | scrubbed: the lime card opens from an inset rounded card to full width while its content rises 80 px, from the moment the section enters until its top reaches 35% of the viewport | |

All motion has a `prefers-reduced-motion` path: reels land without spinning, the manifesto is fully lit,
demos show a static frame, dialogs open without flights, the contact card stays a static card.

## Research behind the effects

Checked on 17 Sep 2026 against Awwwards honors: Olha Lazarieva (SOTD Oct 2025, UX/UI designer: odometer
digits, short philosophy chapters), Pacôme Pertant (SOTD Jun 2026: colourful work on near-black, a
~40-word about statement that lights up on scroll), Bruno Simon (CSSDA WOTY 2025: quality levels per
device). Recommended and implemented: WebGL reel-stop hover, pinned light-up manifesto, card-to-case
transition. ATS rules from Jobscan (2026): one column, real text, standard headings, contacts in the body.

## Quality checks run

Run again on 17 Sep 2026 after the update below:

- Lighthouse, mobile and desktop: Accessibility 100, Best Practices 100, SEO 100, no failed audits.
- Console: no errors or warnings in Chrome with a real GPU while using the whole site in English, Armenian
  and Russian (hero spin, full scroll, card hovers, tabs and filters, case open, ← →, next case while
  scrolled down, Esc, deep link and Back, copy email, language switch), on a touch phone and with reduced
  motion.
- No horizontal overflow at 360, 390 and 768 px in English, Armenian and Russian.
- Contact card fully open at the bottom of the page at 1440×900, 2560×1300 and 1080×1800.
- Keyboard: skip link, visible focus on every control, Enter opens a case, ← → switch, the page behind
  the open case stays out of reach, Esc returns focus to the card.
- Real-browser captures of the contact card, the case cover and the card hover, frame by frame.

From the first release: a performance trace at 4x CPU and Fast 4G on a local server without compression
gave LCP 3.1 s and CLS 0.

## Update: contact card, case cover, card hover (17 Sep 2026)

- **Contact card**: its scroll animation never played. The pinned manifesto and principles are created
  after the other scroll triggers, so the triggers below them were measured without the pinned scroll
  length and fired about 4,000 px early. The pins now carry `refreshPriority: 1`, and the page measures
  again when the web fonts finish loading. The card now opens to full width as it scrolls in. On screens
  too tall for the card's top to reach 35% of the viewport, the animation now ends at the bottom of the page
  instead of stopping short.
- **Case cover**: the key art was cropped to a wide strip. It now shows whole, in its own proportions
  (1280×900 for games, 16:9 for sportsbooks), over a blurred copy of itself. Stepping from a game to a
  sportsbook on tablets and phones no longer leaves the old cover hanging below the shorter new one.
- **Hi Lo images**: the key art has black rounded corners baked in, which showed as dark wedges inside the
  rounded card and cover frames. Its covers were rebuilt with `tools/images.mjs --corners=72`, which fills
  those corners with the art's own colours.
- **Card hover**: quicker and interactive: spins from the side the pointer entered, leans toward the
  pointer, spins again on a flick, spins back out on leave; screens load before the first hover.
- **Console**: two GSAP warnings are gone: choosing "All" after another filter (a `set` on an empty list),
  and moving to the next case while scrolled down in the current one (a tween on a missing ghost image).

## Images

The original PNG/WebP files (53 MB) stay in `assets/` untouched. The site now loads optimized WebP from
`assets/img/<slug>/` (about 10 MB in total, cards 13–80 KB each). Not used by the site:
`gates-of-power-*` (a project not on the site), `win.png`, and `sportcore-thumbnail.png`
(byte-identical to `sportcore-2e569dd0.png`). They can be deleted to slim the repository.

## Content fixed during the move

Mechanical fixes only; no claims were added.

- Joined paragraphs the PDF export had split: "Themed" + "Buy Bonus Access & Modals" (Fortune Master
  Goat, Don Tiger, Capinho, Tao Panda, Calico, The Golden Egg, Book of the Sun), "Jackpot & Pot" +
  "Feature HUD" (Fortune Pots), "(such as" + "Double Chance")" (Juicy Storm).
- Fortune Pots: "designed the complete framework" → "I designed the complete framework".
- The Golden Egg intro: `The Golden Egg" countryside-themed…` → `"The Golden Egg" is a countryside-themed…`.
- "Key highlights include:" was removed where no list followed it (Pixel Road, Crash, Tornado Roulette,
  Bet On Poker) in all three languages.
- "Title: text" paragraphs became highlight lists; straight quotes became typographic quotes.
- Phone number shown as in the CV: +374 77 93 92 33.

## Awards research (17 Sep 2026)

Checked SBC, SiGMA, EGR, IGA, European iGaming, Asia Gaming, CasinoBeats, AskGamblers and BAFTA pages.
**None of the 22 games on this site, Sportcore or tether.bet appears on a shortlist or winners page**, so
the site claims no awards. Pascal Gaming itself has studio-level results Karen could mention, clearly
labelled as the studio's, if he wants to:

| Year | Award | Result | Source |
|---|---|---|---|
| 2024 | SBC Awards, Casino / Slots Developer of the Year (Small) | Winner | https://casinobeats.com/2024/09/27/sbc-awards-2024-winners-revealed/ |
| 2024 | Asia Gaming Awards, Fantasy/Virtuals Solution | Winner | https://asiagamingawards.com/the-awards-2024/ |
| 2023 | iGaming Sword Awards, Casino Supplier of the Year | Winner | https://igamingexpress.com/igaming-sword-awards-winners-2023/ |
| 2026 | IGA, Best Crash Game Developer / RNG Casino Supplier / Slot Provider | Finalist | https://gaming-awards.com/iga/iga-finalists/ |
| 2026 | EGR B2B, Crash games supplier / Slot supplier under 5 years | Shortlisted | https://awards.egr.global/EGRB2BAwards/en/page/2026-shortlist |

Game-level wins found (Blast, The Time, Franken Alive finalist, Avinho R10 shortlist) are not Karen's projects.

## Please confirm (Karen)

1. **Highlight lists missing** for Pixel Road, Crash, Tornado Roulette and Bet On Poker. The source text
   promised them; if the PDFs have them, add them to `projects.js` as `<ul><li><strong>Title</strong> text</li></ul>`.
2. **Greyhound Racing validation** repeats Golden Keno's text ("central reveal ring", "gold grid
   highlights"), which describes Keno, not the racing screen.
3. **Links**: Juicy Storm points to a pre-live host (`pascal-pre-live-…springbuilder.site`); Pixel Road
   points to an operator site (`ichancy.com`); Fortune Don Tiger, Golden Keno, Spin To Win Lightning and
   Greyhound Racing point to the general `pascalgaming.com/game-portfolio` page.
4. **About, mission, principles and role descriptions** are new copy written from the CV and the case
   studies, in English, Armenian and Russian. Karen should read them in his own voice and adjust
   `i18n.js` where needed.
5. **CV**: the site now links `assets/Karen-Khashkhashyan-CV-ATS.pdf` (one column, text-based). The
   designed two-column CV (`assets/Karen Khashkhashyan-CV.pdf`) is kept; ATS parsers read its columns
   out of order, which is why it is no longer the linked file.
