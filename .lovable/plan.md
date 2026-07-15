# Realistic Office-Look-Alike Editors for the Coding Lab

## Reality check (confirmed)

Real Microsoft Office editors **cannot** be embedded in this app:

- **Office for the Web** (Word/Excel/PowerPoint online) requires the WOPI protocol + a Microsoft 365 tenant + per-user Microsoft sign-in. Microsoft sends `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'`, so any `<iframe src="office.com/...">` is refused by the browser.
- **Microsoft Paint** has no web version — Win32 desktop only.
- Google Docs/Sheets/Slides editors are also iframe-blocked; only read-only "published" views embed.

So the goal is the closest-looking free alternative for each slot.

## What changes

Only `src/components/coding-lab/editors.tsx` (and a tiny helper file for Univer). No business logic, no route or state changes.

| Slot | Action |
|---|---|
| **Paint** | Keep JS Paint (`https://jspaint.app/`) — already a pixel-perfect MS Paint clone. |
| **Word** | Keep Zoho Writer iframe — the only real Word-like editor that permits embedding without per-user auth. |
| **Excel** | Replace current slot with **Univer Sheets** — self-hosted npm package, Excel-grade ribbon, formulas, multi-sheet tabs, no iframe. |
| **PowerPoint** | Replace with **OnlyOffice Presentation demo** iframe (`https://onlinedocs.onlyoffice.com/`) — closest visual match to real PowerPoint ribbon. Show a small note that it's powered by OnlyOffice demo. |

## Implementation details (technical)

1. **Install Univer**:
   - `bun add @univerjs/presets @univerjs/preset-sheets-core`
   - Import the preset's CSS in the editor component only (dynamic import to avoid SSR issues — Univer is browser-only, wrap in `useEffect` + a `client-only` guard).
   - Mount into a `<div ref>` sized to fill the editor container. Pre-seed one workbook with a "Students" sheet and sample rows so it feels usable immediately.
   - Add a "Reset workbook" button that disposes the Univer instance and re-creates it.

2. **OnlyOffice PowerPoint slot**:
   - Simple `<iframe src="https://onlinedocs.onlyoffice.com/" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />` at 100% width/height inside the same premium 3D card frame the other editors use.
   - Add a small caption: "Powered by OnlyOffice — public demo. Files are not saved to your account."
   - Include a graceful fallback message if the iframe fails to load (detect via `onerror` / a timeout ping).

3. **Preserve existing shell**: All four editors keep the same wrapping card, header, and toolbar affordances already in `editors.tsx`. Only the inner editor bodies change.

4. **SSR safety**: Univer touches `window` at import time — load it via `React.lazy` + a client-only wrapper so TanStack Start's SSR/prerender doesn't crash.

## Out of scope

- No changes to Word, Paint, SQL, or HTML editors.
- No auth, no file persistence to backend (both Univer edits and OnlyOffice sessions stay ephemeral, same as current editors).
- No UI redesign beyond fitting the new editors into the existing 3D card frame.
