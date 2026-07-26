## Confirmed diagnosis
- The button and client-side validation are connected: an empty submit produces all inline field errors and focuses the first invalid field.
- A valid submit is failing before database insertion because the runtime cannot resolve `submitSchoolRegistration` and logs: `Invalid server function ID: ...submitSchoolRegistration_createServerFn_handler`.
- The registration table currently has no rows, confirming the failed requests are not being persisted.
- The exact `preview--...` URL supplied redirects automated access to a Lovable login surface, so final app verification will use the running preview plus the deployed app endpoint available to the project.

## Fix plan
1. **Create a stable public registration endpoint**
   - Add a TanStack POST route under `/api/public/school-registrations`.
   - Validate the JSON body with the existing registration schema.
   - Call the existing server-only registration service that checks uniqueness, encrypts the temporary password, inserts the row, and explicitly sets `status = pending`.
   - Return structured field errors for validation/duplicate failures and safe generic errors for unexpected failures.

2. **Reconnect the unchanged form UI**
   - Keep the current page layout and field components exactly as they are.
   - Replace only the broken generated server-function call in the submit handler with the stable endpoint request.
   - Preserve current inline missing-field errors, focus behavior, loading state, success screen, and Pending Approval messaging.
   - Ensure failures always clear the loading state and map backend field errors beside the relevant input.

3. **Remove the unstable public submission declaration**
   - Remove only `submitSchoolRegistration` from `registrations.functions.ts` after the form no longer imports it.
   - Keep authenticated list/approve/reject server functions unchanged.

4. **End-to-end verification**
   - Test empty and malformed submissions: no network insert, inline errors visible, first invalid field focused.
   - Submit a unique complete registration with a real button click.
   - Confirm the POST succeeds, the success confirmation appears, and the database row exists with `pending` status and all fields saved.
   - Confirm the new row appears in the Manager pending-approval section, then remove only the test row.