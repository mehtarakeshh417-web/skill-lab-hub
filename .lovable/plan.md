## Goal

Every admin menu item is its own working page, every overview card actually clicks through, and the Users page gives full control (modify, block, delete, filter) over any account.

## 1. Fix the "nothing is clickable" bug first

The global 3D card style (`.slab-3d:hover`) applies a `rotateX/rotateY/translateZ` transform on hover. In Chromium this moves the painted card away from the pointer's hit-test target — the same bug that previously broke the Register School submit button (which was fixed with a one-off `registration-form-surface` opt-out).

Fix it properly and globally in `src/styles.css`:
- Hover lift becomes a flat `translateY` only — no `rotateX`/`rotateY`/`perspective` on any element that contains links, buttons, inputs, tables, or menus.
- Remove `body { perspective }` so no ancestor re-projects the whole page.
- Keep the depth look through shadows, borders and glow (visually unchanged, hit-testing correct).
- Drop the now-unneeded `registration-form-surface` special case.

Verification: after the change, run an automated pointer hit-test over every link/button on each admin page and confirm each element is the top element at its own centre.

## 2. Overview (`/admin`) — lean dashboard only

Strip everything that isn't a dashboard summary: remove the "Recently onboarded schools" list and the health tiles block from the overview page. What stays:
- Six live stat cards (Schools, Teachers, Students, Sales reps, Pending approvals, Deactivated) — each opens its detailed view.
- One compact row of quick links to the other four menu pages.

Detailed drill-down views stay on the directory page, which is reachable only from a card click (not from the menu).

## 3. Menu structure

Sidebar (`app-shell`): Overview, Approvals, Sales hierarchy, Users, Audit Trail. The Directory entry is already removed from the menu and stays removed.

## 4. Approvals (`/admin/pending-schools`)

Dedicated page listing every school submitted through Register School with status Pending. Each row expands to show full submitted details (contact, state/city/area, sales rep) with Approve and Reject actions, plus tabs for Approved / Rejected history and a search box. Approve provisions the school login exactly as it does today.

## 5. Sales hierarchy (`/admin/sales-hierarchy`)

Full-page premium org tree: expand/collapse parent-child nodes with chevrons, connector lines, per-rep cards showing name, code, region, schools owned and direct reports count, plus Expand-all / Collapse-all and a search that reveals matching branches.

## 6. Users (`/admin/users`) — full control

One page listing every account on the portal with:
- Filters: role (admin, manager, sales rep, school, teacher, student), status (active / blocked), school, state/city, and free-text search on name, username or email.
- Row actions: Edit profile details, Change username, Reset password, Block / Unblock, Reset security setup, Delete (with a clear confirmation dialog explaining consequences).
- Bulk select for block/unblock/delete, and CSV/Excel export of the filtered list.
- Status shown as a coloured badge; every action writes to the audit log as it does today.

## 7. Audit Trail (`/admin/audit-logs`)

Stays an intentionally empty page with a clean "coming soon" placeholder, as requested.

## Technical notes

- No changes to data flow, server functions, RLS, roles or business logic — only the CSS hit-testing fix, page composition, and wiring existing server functions (`adminSetUserActive`, `adminDeleteUser`, `adminChangeUsername`, `adminResetUserPassword`, `adminResetSecurity`, `getDirectory`) into the Users page UI.
- A profile-edit server function will be added only if one doesn't already cover name/email/phone updates.
- Each route keeps its own `head()` metadata.
- Final check runs the automated click test across `/admin`, `/admin/pending-schools`, `/admin/sales-hierarchy`, `/admin/users`, `/admin/audit-logs`.
