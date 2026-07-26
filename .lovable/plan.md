## What I verified

- The database table that stores registrations currently has **0 rows** — nothing submitted has ever been saved.
- The server log shows the exact failure when the form is submitted:
  `Error: Invalid server function ID: src_lib_registrations-functions_ts--submitSchoolRegistration_createServerFn_handler`
  So the button *is* wired to a submit handler, validation *does* run, but the call to the backend never reaches its handler — the registration function isn't resolvable in the server function registry, so submission always throws and the user just sees a failure toast.
- The form-level validation already exists and renders inline messages per field; the missing part is field-level re-validation and correct error surfacing when the backend rejects (duplicate username/school code, etc.).

## Plan

1. **Repair the backend submission path (root cause)**
   - Reproduce the submit against the running app and confirm the "Invalid server function ID" error is the only blocker.
   - Restructure `src/lib/registrations.functions.ts` so the public submit function is registered reliably: keep the file a strict thin wrapper (imports + exported `createServerFn` declarations only) and stop the public submit path from being pulled in through a chain that gets stripped from the client build. If needed, move the public submit into its own dedicated functions module so its ID is stable and always present in the server manifest.
   - Re-verify with a real submission that a row lands in the registrations table with status `pending`.

2. **Server-side validation and error clarity**
   - Keep the existing Zod schema (all fields mandatory, email format).
   - Return field-attributable errors for the known business rejections: username already taken, school code already active, school code already pending. These currently surface only as a generic toast.

3. **Client validation polish (logic only, no layout/UI change)**
   - Re-validate a field on blur, so an error clears/appears as the user fixes it (currently errors only clear on typing after a failed submit).
   - On backend rejection, map the returned field key onto the existing inline error slot under that field (the markup for it already exists) plus keep the toast.
   - Scroll/focus the first invalid field on failed submit instead of only toasting.

4. **Success path**
   - Keep the existing "Submitted for approval — Pending Approval" confirmation screen.
   - Remove the mirror write into the in-memory mock store (`addRegistration`), which duplicates the real record and can make the reviewer list misleading; the real record already flows to the Admin/Manager pending panel.

5. **Verification**
   - Submit a complete valid form in a real browser session, confirm the row exists in the database with `pending` status and that it appears in the Admin/Manager pending approvals list.
   - Submit an incomplete form and confirm submission is blocked with inline messages next to each missing field.
   - Submit a duplicate username/school code and confirm the error appears against the right field.

## Notes

No changes to the visual design, spacing, layout, section order, or field arrangement of the Register School page — only submission wiring, validation behavior, and error placement inside the already-existing error slots.
