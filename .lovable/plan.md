## Verified diagnosis

- The database currently contains **zero persisted teacher allocations**: every `class_sections.teacher_id` is `NULL`, so the teacher dashboard correctly receives no assigned sections.
- The school UI updates browser state and immediately shows “Teacher allocated,” but the backend save runs later without awaiting success or surfacing failure.
- Saving currently deletes and reinserts the school’s entire section structure. Multiple background saves can race and overwrite a newer teacher assignment with an older snapshot.
- The 35 uploaded students are stored under **Class 3 / Lily**, while the persisted school structure contains only Classes 6–8, so none match an allocated section.
- There is no durable direct student-to-teacher relationship today; teacher students are only inferred from assigned class/section names.
- Teacher stat cards are wired to detail dialogs in source, but they still need authenticated runtime verification and hardening so every card reliably opens populated details.

## Implementation plan

### 1. Replace fragile background allocation saves
- Add focused authenticated server mutations for assigning/unassigning one teacher to one section rather than replacing the whole section table.
- Validate that the signed-in school owns both the section and teacher before writing.
- Await the real database response before updating the UI or showing success.
- Add loading/disabled states, visible failure messages, and query invalidation so the school screen re-renders from confirmed backend data.
- Keep class/section structure changes durable while serializing or atomically applying them to prevent stale saves from winning.

### 2. Persist direct student allocations
- Add a dedicated `student_teacher_assignments` table with explicit grants, RLS, school ownership policies, teacher read access, and uniqueness protection.
- Extend the full-width allocation workspace with a searchable student roster grouped by actual class/section, including the existing Class 3 / Lily students.
- Allow a school to assign/unassign individual students to the selected teacher and show confirmed assignment counts.
- Do not guess or fabricate historical mappings; allocations absent from the database will need to be selected once after the repair.

### 3. Correct teacher workspace aggregation
- Resolve the signed-in teacher from verified auth identity.
- Return assigned sections plus the union of:
  - students belonging to those assigned sections, and
  - students explicitly assigned to that teacher.
- Normalize class/section matching, deduplicate students, and expose per-section counts and direct-assignment context.
- Use a teacher-specific query key and refresh on login/navigation so stale zero-count data is not reused.

### 4. Make every teacher dashboard card reliably actionable
- Keep all teacher summary cards clickable with keyboard/focus support.
- Open a premium detail dialog for tasks, pending reviews, evaluated work, sections, students, overdue items, and submissions.
- Populate section dialogs with class, section, and student count; populate student dialogs with name, login, roll number, class, section, and allocation source.
- Keep “Open full workspace” navigation from each dialog to the matching teacher tab.

### 5. End-to-end verification
- Sign in as a school, assign a section and selected students to a teacher, and inspect the stored teacher/student mappings.
- Reload the school screen to confirm allocations survive refresh.
- Sign in as that teacher and verify non-zero cards, section details, student details, and full-workspace navigation.
- Confirm another teacher cannot see those allocations and a different school cannot modify them.
- Run the backend security linter and relevant application checks.