# Auto-generated student logins

Schools stop typing usernames and passwords. The system creates them, stores them safely, and both the school and the student's mapped teacher can look them up any time to read out verbally.

## What changes for the user

**Manual student creation** (`/school/add-student`)
- The Username and Password fields are removed from the form.
- On save, a confirmation card shows the generated credentials (username + password) with a copy button, so they can be noted immediately.

**Bulk upload** (`/school/bulk-students`)
- The downloadable Excel template no longer has Username or Password columns; the required columns become Full Name and Email.
- Files that still contain those columns are accepted, but the values are ignored — a small note in the preview says logins are generated automatically.
- After import, the results panel lists every created student with their generated username and password, plus a "Download credentials (CSV)" button.

**Viewing credentials later**
- School dashboard roster: each student row gets a "Login details" action opening a small panel with username, a masked password, and a Show/Copy control.
- Teacher dashboard: the same action appears for students inside the teacher's own mapped class/section only.

**Username format**: name-based, e.g. `jane.doe3417` — lowercase name slug plus a 4-digit suffix, retried until unique across all portal accounts.
**Password format**: readable 10-character generated string (mixed letters/digits, ambiguous characters excluded).

No regeneration/reset button, per your choice.

## Access rules

Credentials are readable only by:
- the school account that owns the student, and
- the teacher currently mapped to that student's class/section.

Anyone else (other schools, other teachers, students, public) gets nothing. Every reveal is written to the audit trail.

## Technical notes

- Migration: add `initial_password_enc text` to `public.students` (stores the generated password with the existing `encryptSecret`/`decryptSecret` helpers in `registrations.server.ts`, which is what makes later read-back possible). No grant/policy change needed — reads go through server functions using the admin client after an explicit ownership check.
- `src/lib/students.schema.ts`: drop `username`/`password` from `studentCreateSchema`; drop those two entries from `STUDENT_TEMPLATE_COLUMNS`.
- `src/lib/students.server.ts`: new `generateStudentUsername(fullName)` + `generatePassword()` helpers used inside `provisionStudent`, reusing the existing `usernameTaken` check in a retry loop; persist the encrypted password on insert; return the plaintext once in the creation response. `bulkCreateStudentsForSchool` loses its in-file duplicate-username pre-validation (no longer applicable) and returns generated credentials per row.
- `src/lib/students.functions.ts`: add `getStudentCredentials` (auth middleware) that authorises the caller as the owning school or the mapped teacher via the existing section/`student_teacher_assignments` logic in `classes.server.ts`, then decrypts and returns the pair.
- UI: `school.add-student.tsx` (remove two fields, add success card), `school.bulk-students.tsx` (template columns, preview note, credentials result table + CSV), `school.index.tsx` and `teacher.index.tsx` (Login details action).
- Existing students keep their current usernames; their stored password is empty, so their panel shows "Set before auto-generation — not recoverable".

State hooks, routing, allocation logic, and business rules elsewhere stay untouched.
