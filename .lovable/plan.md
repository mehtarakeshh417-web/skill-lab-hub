## What's wrong

1. **"Invalid origin" rejection** — `src/routes/api/public/school-registrations.ts` compares the browser's `Origin` header against the origin of `request.url`. In the Lovable preview the page is served from `...lovableproject.com` while the server sees a different internal host, so every real submission is rejected with HTTP 403 before validation or the database is ever reached. The network log confirms: `403 {"ok":false,"error":"This registration request came from an invalid origin."}`.

2. **Error not visible** — the failure is only reported through a Sonner toast pinned to the top of the viewport. The user is at the bottom of a long form when they submit, and (with the 3D-transformed page shell) the toast renders far from the button, so the message appears "off-screen" until scrolling up.

## Plan

### 1. Allow any origin
- Delete the origin comparison in the POST handler. Keep the JSON content-type check, Zod validation, tagged field errors, and server-side uniqueness checks — those are the real protections.
- Add `Access-Control-Allow-Origin: *` plus an `OPTIONS` 204 handler so the endpoint works from any host/preview/published domain.

### 2. Make the error impossible to miss
In `src/routes/register-school.tsx`, without changing the layout or field structure:
- Add a submission-error banner rendered directly above the Submit Registration button, showing the returned message (and the field name when the error is field-tagged). It clears on the next submit attempt.
- On failure, scroll the offending field (or the banner) into view with `scrollIntoView({ behavior: "smooth", block: "center" })` and focus it — the same focus mechanism already used for missing-field validation.
- Keep the existing toast as a secondary signal.

### 3. Verify
- Post malformed and valid JSON straight to `/api/public/school-registrations` to confirm no 403 and a 201 with `status: "pending"`.
- Run a real browser submission on `/register-school`: confirm the row lands in `school_registrations` as **Pending Approval**, the success screen shows, and a forced failure (duplicate school code) surfaces the inline banner next to the button without scrolling. Clean up test rows afterwards.

## Technical notes
Files touched: `src/routes/api/public/school-registrations.ts` (drop origin gate, add CORS + OPTIONS) and `src/routes/register-school.tsx` (inline error banner + scroll-to-error). No schema, business-logic, or approval-workflow changes.
