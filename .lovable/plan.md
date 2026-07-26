## What's actually happening

The Admin sidebar already has **Users** and **Audit Trail**, and they point to `/admin/users` and `/admin/audit-logs`, which use the exact same components as the Manager pages (`UserManagementPanel`, `AuditTrailWorkspace`). The backend already allows admins everywhere (audit read policy covers admin; the user-management functions treat admin as a superset of manager).

The pages are blank because of a routing structure problem, not permissions:

- `src/routes/manager.tsx` is a thin layout that renders `<Outlet />`, and the Manager dashboard lives separately in `manager.index.tsx`. So `/manager/users` renders correctly.
- `src/routes/admin.tsx` is the full Admin dashboard **and** the parent of every `/admin/*` route, but it never renders `<Outlet />`. TanStack mounts it as the parent for `/admin/users`, `/admin/audit-logs`, `/admin/directory`, `/admin/pending-schools`, `/admin/sales-hierarchy`, `/admin/create-sales-rep` — and since there is no `<Outlet />`, the child page never mounts.

The same defect exists on `src/routes/teacher.tsx` (children: assignments, quizzes) and `src/routes/student.tsx` (children: assignments, quizzes).

## Plan

1. **Split the Admin route**
   - Create `src/routes/admin.index.tsx` containing the current Admin dashboard component, stat cards, quick actions, exports, and its page metadata — code moved as-is, no logic changes.
   - Reduce `src/routes/admin.tsx` to a layout: `createFileRoute("/admin")` with `component: () => <Outlet />` and a generic Admin console title, mirroring `manager.tsx` exactly.

2. **Apply the same split to Teacher and Student**
   - `src/routes/teacher.index.tsx` + `teacher.tsx` as an `<Outlet />` layout.
   - `src/routes/student.index.tsx` + `student.tsx` as an `<Outlet />` layout.
   - This makes `/teacher/assignments`, `/teacher/quizzes`, `/student/assignments`, `/student/quizzes` render instead of falling back to the dashboard.

3. **Verify**
   - Typecheck, then load each admin sub-route in a headless browser signed in as the admin account and confirm the Users table and Audit Trail workspace render with data — identical to the Manager views.

## Technical notes

- No changes to state, server functions, RLS, role checks, or business logic — this is purely route composition.
- Each new `*.index.tsx` keeps its own `head()` metadata (title/description/og), and the parent layouts keep only a generic title so leaf metadata wins.
- Admin's Users page intentionally keeps its extra capabilities (all role filters, admin/manager account management) since it passes `actor="admin"`; the layout, filters, and audit workspace are otherwise identical to the Manager pages.
