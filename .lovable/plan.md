## Admin Console — full redesign

Rebuild the Admin area into the true owner console: real data everywhere, no fake charts, premium layout, and full control over every account on the portal.

### 1. Overview page (`/admin`)
- Remove the fake "Engagement trend" bar chart and the hardcoded "Technology mix" percentages entirely.
- New stat band (all cards visible, responsive 2/3/6 grid, no clipping): Schools, Teachers, Students, Sales Reps, Pending approvals, Rejected/Inactive — each with a live count and a click-through to its directory.
- Keep the Pending School Approvals panel (existing approve/reject logic untouched).
- Add compact "Recent activity" and "Recently onboarded schools" cards fed by real rows.
- Quick-action tiles: Onboard school, Add sales rep, User management, Audit trail, Export reports.

### 2. Directory (new `/admin/directory`)
A premium tabbed workspace — **Schools · Teachers · Students · Sales Reps** — with:
- Sticky filter bar: search, **Region**, **State**, **City**, **School**, Status. State→City options are linked (reuse the existing India locations data); School filter narrows Teachers/Students.
- Card-style rows with generous padding, high-contrast hierarchy, glowing status pills.
- **Unmasked contact details for Admin** — full email/phone everywhere (managers keep masking).
- Row expander showing full profile (principal, designation, address, area, sales rep, created date, counts of teachers/students under a school).
- Row actions: Reset password, Change username, Activate/Deactivate, Delete.

### 3. Account control
- Admin can change the password of **any** user (school, teacher, student, sales rep, manager, admin) from the directory and from User Management — reusing the existing `adminResetUserPassword` flow in a premium modal with generate/copy helpers.
- **Cascading school delete**: deleting a school also deletes every teacher and student under it — their table rows *and* their login accounts — inside one server-side routine, with a typed-confirmation modal that states exactly how many teachers/students will be removed. (The database has no FK cascade today, so this is enforced in the delete routine.)
- Deleting a teacher/student/sales rep removes their row and login.

### 4. Reports & export
- Export button on every directory tab and on Overview: downloads the currently filtered rows as **CSV** and **Excel (.xlsx)** (xlsx is already in the project).
- Reports include full unmasked contact fields for Admin, plus a summary sheet (counts by state/region/status).

### 5. Audit trail
- `/admin/audit-logs` and the Manager equivalent become clean, premium **empty-state pages** ("Audit trail — coming soon") as requested. Existing logging keeps writing to the database untouched, so nothing is lost when we build it out later.

### 6. Extra owner-grade features included
- Global command search (⌘K) across schools/teachers/students/reps.
- Impersonation-free "View as school" read-only drill-down from a school row into its teacher/student roster.
- Portal health strip: inactive accounts, accounts pending security setup, schools with zero students.
- Bulk select + bulk deactivate/export in the directory.

### Technical notes
- New `src/lib/directory.server.ts` + `directory.functions.ts`: admin/manager-gated listing of schools, teachers, students and sales reps with region/state/city/school/status filters and audience-based masking (admin = unmasked).
- New `src/lib/admin-delete.server.ts`: cascading delete of a school and all dependent teacher/student rows and auth users, wrapped with existing audit logging.
- New route `src/routes/admin.directory.tsx`; `admin.tsx` rewritten; `admin.audit-logs.tsx` and `manager` audit page reduced to empty states.
- Sidebar nav for admin updated to point at real routes (Overview, Directory, Users, Reports, Audit Trail) instead of the current duplicated `/admin` links.
- No changes to auth, roles, approval logic, RLS or existing state handlers — all new reads go through the existing role-gated server-function pattern.
