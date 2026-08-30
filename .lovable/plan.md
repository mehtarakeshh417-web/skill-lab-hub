# Avartan Skill Lab Portal — Customer User Manual (PDF)

Produce a polished, branded PDF manual covering every role and workflow in the portal, delivered as a downloadable file.

## What the manual will contain

1. Cover page — portal name, "User Manual", version, date, Avartan contact (+91 11 43158350).
2. Table of contents.
3. Introduction — what the portal is, who uses it, the six roles (Admin, Portal Manager, Sales Representative, School, Teacher, Student).
4. Getting started — sign-in with username / email / phone, forgot password, change password, security setup, theme switcher.
5. School registration & approval
   - Public self-registration form (fields incl. District/City, sales representative name validation, request ID AVR-XXXXXX, 2-working-day message).
   - Admin/Manager approval: "Edit details as per MCM", assigning school code, username and password at approval.
6. Admin guide — dashboard, pending schools, users management & password resets, directory, sales hierarchy, create sales rep, audit logs.
7. Portal Manager guide — same modules plus direct school onboarding.
8. Sales Representative guide — hierarchy view and assigned schools.
9. School guide — dashboard counters, create teacher, add student manually, bulk student upload (CSV template columns; logins auto-generated), automatic class/section allocation.
10. Teacher guide — dashboard stats, student roster with clickable student detail dialog (username/password), download credentials CSV, class & section view, assignments (MCQ / True-False / Fill-in-the-blanks, AI question generation by technology, count, difficulty), projects (Scratch, Python, HTML templates), performance analytics.
11. Student guide — dashboard, assignments and attempts with auto-scoring, quizzes, projects, in-browser coding labs (Scratch Jr, HTML, Python, Word/Sheet/Slides editors).
12. Credentials policy — auto-generated usernames and passwords, who can view them, secure sharing guidance.
13. Audit trail — what is logged, how to filter and export.
14. FAQ & troubleshooting, plus support contact.

## Technical approach

- Generate the PDF with a Python ReportLab (Platypus) script run in the sandbox.
- Style to match the portal: crimson/accent headings, Slate neutrals, clean sans typography (DejaVu Sans registered for full Unicode), section headers, callout boxes for tips and warnings, tables for field references and CSV template columns.
- Include the Avartan logo from `src/assets` on the cover if usable.
- QA every page by rendering to images and inspecting for clipping, overflow, spacing, and ordering; fix and re-render until clean.
- Output to `/mnt/documents/avartan-skill-lab-user-manual.pdf` and attach it in chat.

No application source files are changed.
