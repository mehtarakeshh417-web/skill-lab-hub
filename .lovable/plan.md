## Plan: Functional School Onboarding + Role-Based Dashboards

### Goal
Replace the current local/mock-only onboarding behavior with a real persistent backend flow where a Manager can create a school account, that school can immediately sign in, and Admin/Manager dashboards reflect the new school count with proper sensitive-data visibility.

### What I will build
1. **Backend-backed school creation**
   - Add a secure server function for Manager/Admin school onboarding.
   - Validate required fields: school name, username, password, phone, email, and address/region details.
   - Prevent duplicate usernames/emails/school codes.
   - Create the school auth user using the backend auth admin API so passwords are handled securely by the auth system, not stored in app tables.
   - Assign the new user the `school` role in `user_roles`.
   - Create/update the persistent school record in the `schools` table.

2. **Database schema support**
   - Extend `schools` with missing fields required by the form: username, email, phone, address, principal/designation/notes where needed.
   - Add uniqueness constraints for school code and username/email where appropriate.
   - Add/adjust Row Level Security policies so:
     - Admin and Manager can manage/read school records.
     - School users can read and manage only their own school record.
   - Include all required table grants in the migration.

3. **Create School page functionality**
   - Update `/manager/onboard-school` to call the secure backend server function instead of local mock storage.
   - Show loading, success, and actionable error messages.
   - Keep the premium 3D UI styling, but make the form functional.
   - Redirect back to the Manager dashboard after successful creation.

4. **Real login for created schools**
   - Ensure the auth page can sign in created school users with username or email.
   - For username login, resolve the username to the backend user email through a safe public/auth-aware lookup without exposing sensitive data.
   - Redirect the authenticated school user to `/school` based on their stored role.

5. **Dynamic Admin and Manager dashboards**
   - Replace hardcoded `0` school counts with live backend counts.
   - Show a school roster/summary section where applicable.
   - Admin sees full email and phone.
   - Manager sees masked email and phone, e.g. `sc******@domain.com`, `98******10`.
   - Counts refresh automatically after onboarding using query invalidation.

6. **School dashboard ownership**
   - Update the School dashboard to resolve the signed-in school from the backend record, not only from mock local storage.
   - Ensure each school only sees its own institution details.
   - Preserve existing class/section UI state and interactions unless backend persistence is explicitly required later.

### Technical approach
- Use TanStack `createServerFn` for app-internal backend operations.
- Use authenticated middleware for Manager/Admin reads and school self reads.
- Use backend admin auth only inside authorized server handlers.
- Use Zod validation for form/server inputs.
- Use the existing `user_roles` role system instead of storing roles on profiles or schools.
- Keep seed/mock demo accounts working for existing demo login, but real created schools will use backend auth.

### Validation
- Verify Manager can open Create School, submit valid details, and see success.
- Verify duplicate username/email/school code errors are shown.
- Verify Admin and Manager school counts increment.
- Verify Manager sees masked contact data while Admin sees complete data.
- Verify the newly created school can log in and lands on the School Dashboard.