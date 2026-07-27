## What the data shows right now

I checked the live database before planning:

- 35 students exist, all in the same school, all recorded as **Class 3 / Section Lily**.
- The school's section list contains only **Class 6 A/B, Class 7 A, Class 8 Blue/Red** — none of them is Class 3 / Lily.
- **Zero sections have a teacher assigned** (`teacher_id` is empty on all 5 rows).
- **Zero direct student-to-teacher assignments** exist.
- Teacher "Meena" belongs to the same school as the 35 students.

So the teacher dashboard is correct to show 0 today: nothing has actually been allocated in the database yet, and the section list the allocation wizard offers cannot reach the 35 students because their class/section was never registered as a section.

## What to build

### 1. Derive sections from the real student roster
The allocation wizard should stop relying solely on manually created sections. On load, read the distinct `class_name` / `section` pairs actually present in the school's student records and merge them into the section grid (marked as "from roster"). This makes **Class 3 · Lily** appear immediately, with its 35 students, so it can be mapped to a teacher.

### 2. Auto-register roster-derived sections on save
When a teacher is mapped to a roster-derived section that has no `class_sections` row yet, create that row first, then set its `teacher_id`. No orphan mappings.

### 3. Make section mapping actually pull students
Confirm the teacher workspace query matches students by class + section case-insensitively and trimmed, so "Class 3"/"3" and "Lily"/"Section Lily" variants still resolve. Normalise on both the write and read side.

### 4. Roster visibility even before allocation (school-side)
Show the school admin a clear banner when students exist in classes that have no teacher mapped, with a one-click jump into the allocation board for that class/section.

### 5. Verification pass
After the changes, allocate Class 3 · Lily to Meena from the school portal, then confirm via database read that `class_sections.teacher_id` is set, and sign in as the teacher to confirm the dashboard shows 35 students, 1 section, and that the stat cards open populated detail dialogs.

## Technical notes

- `src/lib/classes.server.ts`: add a roster-derived section reader; make `assignTeacherToSectionForSchoolActor` upsert the `class_sections` row when missing; normalise class/section comparison in `getTeacherWorkspaceForActor`.
- `src/lib/classes.functions.ts`: expose the roster-sections reader as a server function.
- `src/routes/school.index.tsx`: merge roster-derived sections into the allocation board, add the unmapped-class banner.
- `src/routes/teacher.index.tsx`: no logic change expected beyond consuming the corrected workspace payload.

No changes to auth, roles, state hooks, event handlers, or existing business logic.

## Note on "old students"

Existing students will not appear retroactively on their own — there is no allocation record in the database to derive from. This plan makes them *allocatable and visible in one click*; the school user still performs the mapping once. If you would prefer, I can additionally auto-map every unassigned roster section to a chosen teacher as a one-time backfill — tell me which teacher should receive Class 3 · Lily and I will include it.
