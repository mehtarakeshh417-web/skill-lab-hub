# Premium UI/UX Redesign — Emerald Prestige

Purely visual. No changes to state, server functions, RLS, routing logic, permissions, or data flow. Only class names, tokens, and presentational wrappers change.

## Design direction (locked)

- **Palette:** Emerald Prestige — deep emerald `#064e3b`, emerald `#0d7a5f`, champagne gold `#c9a84c`, warm ivory `#f5f0e0`. Replaces the current indigo/violet brand across light and dark themes.
- **Typography:** Sora for headings/display, Manrope for body and UI. Loaded via `<link>` tags in the root route head, wired into `@theme` as `--font-display` / `--font-sans`.
- **Feel:** dark-first enterprise console with ivory light mode, generous whitespace, `rounded-2xl` surfaces, layered soft shadows, restrained gold used only for accents and highlights (never large fills).

## Step 1 — Token foundation (`src/styles.css`)

The whole platform already reads semantic tokens, so this single file changes the look everywhere.

- Recolor `:root` and `.dark` with the emerald/gold OKLCH scale: background, card, popover, primary, primary-glow, accent, sidebar, ring, chart 1–5, borders, inputs.
- Refresh the gradient tokens (`--gradient-hero`, `--gradient-brand`, `--gradient-accent`, `--gradient-surface`) to emerald→teal with a gold sweep.
- Add a shared motion + elevation scale: `--shadow-xs/sm/md/lg/glow`, `--ease-spring`, `--dur-fast/base/slow`, glass surface tokens.
- Add utilities: `glass-panel`, `surface-card`, `hover-lift`, `shimmer`, `focus-ring`, `press`, `page-enter`, `stagger-in`, animated gradient border.
- Keep the existing 3D/flat-lift fixes intact so nothing becomes unclickable again.

## Step 2 — Shared UI primitives (`src/components/ui/*`)

Restyle variants only; props, refs, and Radix behaviour untouched.

- **Button** — refined size scale, gradient `default`, subtle `press` scale, glow-on-hover, built-in spinner slot styling for loading states.
- **Card** — softer border, layered shadow, optional hover elevation.
- **Input / Textarea / Select** — taller comfortable fields, clear focus ring, error/success ring states, helper-text spacing.
- **Table** — sticky header, zebra-free hover highlight, roomier cells, rounded container.
- **Dialog / Sheet / Drawer / Alert-Dialog** — blurred scrim, spring entrance, tighter header/footer rhythm.
- **Dropdown / Select / Popover / Tabs / Badge / Progress / Skeleton / Sonner toasts** — matching radius, motion, and status colours; skeletons gain shimmer.

## Step 3 — App chrome

- `src/components/app-shell.tsx`: floating glass sidebar with animated active pill, smooth collapse, refined header, role chip, polished notifications bell, mobile drawer polish.
- `src/routes/__root.tsx`: font `<link>` tags, page-transition wrapper, restyled 404 and error screens.
- `src/components/stat-card.tsx`: count-up animation on mount plus hover elevation (display only — values unchanged).

## Step 4 — Public and auth surfaces

`index.tsx`, `auth.tsx`, `forgot-password.tsx`, `setup-security.tsx`, `register-school.tsx`, `settings.change-password.tsx` — hero and form layouts recomposed with the new palette, floating labels, and animated validation states. Submit handlers unchanged.

## Step 5 — Role dashboards and workspaces

Spot-polish after the shared layer lands, since most gains come free: Admin, Manager, School, Sales Rep, Teacher, Student dashboards plus `user-management-panel`, `audit-trail-workspace`, `directory-workspace`, `sales-hierarchy`, `pending-schools-panel`, `projects-widget`, `assignments-widget`, quizzes, projects, and assignments pages. Focus on empty states, filter bars, list/table density, and status badges.

## Responsiveness and accessibility

Every touched surface uses the `grid-cols-[minmax(0,1fr)_auto]` → `sm:flex` header pattern, `min-w-0` on text containers, `shrink-0` on icons. Contrast checked in both themes; focus rings visible on all interactive elements; motion respects `prefers-reduced-motion`.

## Technical notes

- Tailwind v4: all tokens in `src/styles.css` under `@theme inline`; custom utilities via `@utility`; no `tailwind.config.js`, no remote `@import`.
- No component signatures, hooks, handlers, queries, or server functions are modified — edits are limited to `className`, token values, and presentational markup.
- Typecheck runs after each step; Playwright screenshot pass on key routes at the end.

## Order of delivery

Steps 1–3 in this pass (that is the visible transformation across all pages), then steps 4–5 immediately after in the same session.
