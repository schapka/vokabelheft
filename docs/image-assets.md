# Image assets

All files live in `public/` and are referenced from `index.html` and
`public/manifest.webmanifest`. Until they exist, browsers fall back silently
(no icon, no link preview).

| File | Size | Used for |
|---|---|---|
| `favicon.svg` | vector, square | browser tab (modern browsers, both themes) |
| `favicon.ico` | 48×48 | browser tab, legacy |
| `apple-touch-icon.png` | 180×180, opaque, square corners | iOS/iPadOS home screen |
| `icon-192.png` | 192×192 | Android home screen, install prompt |
| `icon-512.png` | 512×512 | splash screen, app lists |
| `icon-maskable-512.png` | 512×512, content inside the central 80% circle | Android adaptive icon |
| `og-image.png` | 1200×630 | link previews (Open Graph, Twitter/X, iMessage, WhatsApp). Mark only, centred on `#fafafa` — title and description come from the meta tags. |

Design tokens the assets should match (`src/styles/tokens.css`):
accent `#2563eb` (blue-600), foreground `#18181b` (zinc-900), background
`#fafafa` (zinc-50), dark background `#09090b`. Typeface: IBM Plex Sans.

## Prompt for generating the assets

Give this to an agent that can generate images and run code (to export exact
sizes), together with the tokens above.

````text
Create the icon and link-preview images for "Vokabelheft", a small web app a
German 11-year-old uses to practise English vocabulary for school. The UI is
deliberately plain and modern: one typeface (IBM Plex Sans), Tailwind's zinc
palette, one accent colour. The images must feel like the same product —
calm, clear, not playful, no gradients, no 3D, no clip-art, no mascots.

Colours (use these exact values):
- accent blue #2563eb
- foreground #18181b (near-black)
- background #fafafa (near-white)
- dark background #09090b

Motif: one simple mark that works from 16 px to 512 px. Pick ONE and use it
consistently across all files: (a) a bold geometric "V" in white on an accent
blue rounded square, or (b) a minimal open-notebook glyph (two pages, one
ruled line each) in white on accent blue. Flat, single colour on the tile,
generous padding (mark occupies ~60% of the tile), corner radius ~22% of the
tile width. The mark must read at 16 px.

Deliver exactly these files, all PNG unless stated, sRGB, no metadata:

1. favicon.svg — the mark as clean vector, square viewBox, tile + mark, no
   raster, no text. Must look right on both light and dark browser chrome
   (the blue tile takes care of that).
2. favicon.ico — 48×48, same mark, opaque.
3. apple-touch-icon.png — 180×180, opaque (no alpha), square corners (iOS
   rounds them), tile fills the whole canvas.
4. icon-192.png — 192×192, tile with rounded corners on transparent
   background.
5. icon-512.png — 512×512, same as 4.
6. icon-maskable-512.png — 512×512, tile fills the whole canvas edge to edge
   (no rounded corners, no transparency), the mark kept inside the central
   circle of 80% diameter so Android can crop any shape.
7. og-image.png — 1200×630, the link preview. Flat #fafafa background, the
   tile with the mark centred at 320 px, nothing else — no text (messengers
   show the title and description next to the image), no gradients, no
   decoration. Must survive a square centre-crop.

Quality checks before delivering: every PNG at its exact pixel size; the
maskable icon's mark fully inside the 80% safe circle; the OG image legible
when scaled to 600×315; all files together under 400 KB; file names exactly
as listed. Put them in a folder named public/.
````
