# Born Beauté — website

Static marketing site for **Born Beauté**, a full-service beauty studio in
Arlington Heights, IL. No framework, no build step: three files plus artwork,
deployable to any static host (Netlify, Cloudflare Pages, S3, GitHub Pages) by
uploading this folder. Content is server-rendered in the HTML, which matters for
local search.

```
site/
  index.html            all copy and markup (hero, about, services, menu, team,
                        gift cards, contact) — server-rendered for SEO
  assets/css/styles.css design tokens + every component
  assets/js/main.js     nav, scroll spy, hero video, contact form
  assets/video/hero.mp4 full-screen hero background (brand animation)
  assets/img/*.svg      placeholder artwork — see "Photography" below
```

## Run it locally

```bash
python -m http.server 5173 --directory site
```

Then open <http://localhost:5173>.

## Content source

All business content — address, phone, hours, the 8 service categories, the full
itemised price menu, and the 9-person team — comes from the live Square site
(`bornbeautystudio.square.site`).

## Look & feel

The layout skeleton comes from the "Modernist" system in `_ds/`, but the
art-direction has been warmed into an **"atelier" theme** for a beauty audience:
a soft blush-cream ground with a rose accent and gold secondary, **Fraunces**
serif display headings (with italic accents) over Archivo for labels/body, pill
buttons, rounded and arched imagery, circular team avatars, and a warm tone on
the photography. The palette + type live in the token block and the "Atelier
layer" at the bottom of `styles.css` — retune there.

## Gift cards — decorative 3D showcase

The Gift cards section is a **display-only** 3D card stack, not a form. Three
designs (Birthday / Thank You / Holiday), each a brand-gradient card face with an
occasion icon, are fanned in CSS 3D perspective (`perspective` + per-card
`rotateX/rotateY/translateZ/scale`, positioned by a `data-pos` attribute the JS
sets). Prev/next arrows, dot indicators, arrow-key nav (when the slider is
focused), touch swipe, and click-a-card-behind advance one design at a time with
a ~550ms spring easing. Logic is the "gift card 3D showcase" block in `main.js`.

It deliberately collects **no** data — no amount, message, or recipient inputs —
because all of that is entered on Square's own checkout. The section's only job is
visual delight and the single CTA (`Buy a Gift Card →`) to the Square gift URL.

> Note: `index.html` loads `main.js?v=2` — bump that query when you change the JS
> so browsers don't serve a stale cached copy.

## How booking, gift cards & contact work

This site is the shop window; transactions happen on Square:

- **Book appointment / Book now** → Square Appointments
  `book.squareup.com/appointments/xsdtsxnj271orj/...`
- **Buy a gift card** → Square gift page `squareup.com/gift/C527RFA072WWY/order`
- **Contact form** (name / email / message) is handled in `main.js`, which
  validates and then shows a confirmation *without sending anything yet*. To make
  it deliver, point the `<form>` at Formspree / Netlify Forms, or replace the
  block marked `// No backend yet.` with a `fetch()` to your endpoint.

All three links live in one place each — update them here if Square IDs change.

## Sections

Hero (full-screen video) · About (real studio photo) · **Gallery** (salon-space
masonry) · Services (8 cards) · **Nail showcase** · Full price menu · Team
(9 text cards, numbered) · **Reviews** (Google-rated slider) · Book band ·
Gift cards · Contact (form + location + Google map) · Footer. A fixed header goes solid past the hero with scroll-spy underlines; a
floating **Text us** button (SMS to the studio) and back-to-top sit bottom-right.

## Reviews slider

Five 5-star Google reviews in a dependency-free carousel (`#reviewsTrack`,
logic in the "reviews slider" block of `main.js`): prev/next arrows, dots, touch
swipe, and gentle autoplay that pauses on hover/focus, when off-screen, and under
reduced-motion. Quotes are set in Fraunces italic. **Text only, by design** — the
source review photos belong to the individual reviewers (Google flags them as
copyright), so they are not hosted here. To show live reviews with photos and
attribution later, drop in a Google Business Profile / widget embed.

## Beyond a plain page

Mobile menu under 900px, reduced-motion handling (hero video pauses to its poster
frame), inline form validation with an `aria-live` status, skip link,
focus-visible rings, print styles, Open Graph tags, and `BeautySalon` JSON-LD
with the real address and opening hours.

## Photography

The SVGs in `assets/img/` are drawn placeholders sized to the real slots. Drop in
real files with the same names to replace them:

| File | Slot | Ratio |
|---|---|---|
| `assets/video/hero.mp4` | full-screen hero | landscape, dark; text sits lower-left |
| `hero.svg` | hero poster / fallback | ~16:10 |
| `studio.jpg` | About (arched top) | portrait |
| `salon-*.webp`, `team-portrait.webp`, `salon-candid.webp` | Gallery masonry | mixed (full colour) |
| `nail-*.webp` | Nail showcase | portrait (full colour) |

Hero and about imagery are wrapped in `.grayscale`, which now applies a warm
rose/sepia tone (not flat grey) to match the atelier theme — adjust that one
filter to taste. Team members use initials avatars (no image files); swap
`.avatar` for `<img>` if you add real headshots.

> **Note:** `hero.mp4` is ~19 MB, which is heavy to load immediately. Compressing
> it (and adding a WebM) with `ffmpeg` would speed up first paint, especially on
> mobile.

## Audit round — performance, SEO, FAQ, privacy (Sept 2026)

- **Hero video compressed**: 18.7 MB → ~4 MB (H.264 MP4 + VP9 WebM, 1152w,
  audio stripped). WebM is listed first so modern browsers get it, MP4 is the
  Safari fallback. Re-encode from the master at
  `Downloads/gmaps-video-1788890038.mp4` if you ever need to.
- **studio.jpg**: 1.7 MB → 170 KB (900px wide).
- **Real OG share image**: `assets/img/og.jpg` (1200×630) + og/twitter meta, so
  links show a proper preview card. Regenerate via the PowerShell/GDI+ script if
  branding changes.
- **FAQ / policies** section (`#faq`, native `<details>` accordion) + `FAQPage`
  JSON-LD for rich search results.
- **Privacy policy** at `privacy.html`, linked from the footer and the contact
  form fine-print.
- **robots.txt** + **sitemap.xml** added.
- **Instagram** now points to the real handle (`bornbeautechicago_salon`);
  added to footer, FAQ, and JSON-LD `sameAs`.
- **AggregateRating** (4.9 / 227) added to the BeautySalon JSON-LD.
- **"My bookings"** link added to the footer (Square).
- Removed the dead `.price-note` CSS rule.

### Needs the client to finish

- **Google Analytics**: the GA4 snippet is wired in `index.html` head but inert
  (makes zero requests) until you replace `G-XXXXXXXXXX` with the real
  Measurement ID.
- **Favicon**: still the placeholder mark — swap once the real logo file is
  provided (see the brand-logo section).
- **Domain**: `canonical`, OG `url`s and the sitemap point at the square.site
  address — update them when a custom domain is live.
- **New-client / seasonal offer** and a **live Google-reviews widget** are still
  open ideas — both need the client's input (offer terms / a widget account).

## Cache-busting — the rule going forward

`styles.css` and `main.js` are loaded with a `?v=N` query (`styles.css?v=2`,
`main.js?v=3` — bump on any edit, in **both** `index.html` and `privacy.html`).
Without it, browsers can keep serving the old file indefinitely after a normal
reload — this bit us twice already (the hero badge glass effect not showing up,
and `privacy.html` being missed the first time the CSS was versioned).

The same applies to `hero.mp4` / `hero.webm` (already versioned) and, going
forward, to **any photo that gets replaced in place** — a new headshot saved
over `assets/team/halyna.jpg`, for example. When that happens, either rename
the file or bump a `?v=` on its `src`, or visitors who loaded the page before
will keep seeing the old photo.

Two related caches this trick can't reach:
- **Favicons** are cached separately and stubbornly by browsers; a query
  string is not reliable. Ship a new filename instead when it's replaced.
- **`og.jpg`** gets cached server-side by social platforms once a link is
  scraped (Facebook, LinkedIn, etc.), independent of the browser entirely. A
  design change there needs the platform's own "scrape again" tool, not a
  version query.
