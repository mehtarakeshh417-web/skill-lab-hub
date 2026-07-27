## Goal

Stop allocating students to teachers by hand. A student picks a **Class · Section** when created (manual or bulk), and the teacher who owns that section automatically sees them.

## How allocation will work

```text
School sets up sections once:   Class 3 · Lily  ->  Teacher Meena
Student created with            Class 3 · Lily
Teacher Meena's dashboard       student appears instantly
```

No per-student allocation step exists anywhere.

## 1. Student creation gets real Class / Section pickers

`school/add-student`: the free-text "Class" and "Section" inputs become linked dropdowns fed by the school's registered sections. Selecting a class filters the section list. Each option shows the teacher who currently owns it (or "no teacher yet") so the school sees who the student is going to. A short helper line under the pickers states plainly: "The teacher mapped to this section will see this student automatically."

If the school has no sections yet, the pickers show an inline prompt with a link to the section setup board.

## 2. Bulk upload validates against the same section list

The Excel template keeps its Class/Section columns. During the preview step, each row's class/section is matched against the school's registered sections (case/prefix tolerant, same normalisation already used). Rows are annotated with the resolved teacher name; rows whose section does not exist are flagged in the preview as "section not registered" with an option to create those sections in one click before importing. Nothing silently lands unallocated.

## 3. Manual allocation UI is removed

From the school dashboard:
- Remove the "Direct Student Allocation" searchable student list and its Map buttons.
- Remove the per-teacher "Map students" entry point.

What stays (renamed to reflect its new job) is the **Classes & Sections** board: the grid where each Class · Section card assigns exactly one teacher. This is the only allocation control left, and it is per-section, not per-student.

## 4. Existing students keep working

Roster-derived sections already auto-register, so every current class/section pair is present in the dropdowns. Students already in Class 3 · Lily continue to resolve through that section's teacher — no data change needed.

## 5. Verification

After the change: create one student through the form, confirm the database row carries the chosen class/section, then load the mapped teacher's dashboard and confirm the count went up by one without any allocation action.

## Technical notes

- `src/lib/classes.functions.ts`: expose a light section list (class, section, teacher name) callable by the student-creation routes.
- `src/routes/school.add-student.tsx`: replace the two `Input` fields with selects bound to that list; `className`/`section` state keys and the existing submit mutation stay unchanged.
- `src/routes/school.bulk-students.tsx`: add section resolution to the preview table and a "register missing sections" action.
- `src/routes/school.index.tsx`: delete the direct-allocation panel and Map buttons; keep the section→teacher board.
- `src/lib/classes.server.ts`: no change to `getTeacherWorkspaceForActor` — section-key matching already delivers the auto-allocation. The direct-assignment server functions stay in place but become unused by the UI.

No changes to auth, roles, state hooks, event handlers, or student creation business logic.
