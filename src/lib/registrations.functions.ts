import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  approveRegistrationSchema,
  rejectRegistrationSchema,
  submitRegistrationSchema,
} from "./registrations.schema";
import {
  approveRegistration,
  listRegistrationsForActor,
  rejectRegistration,
  submitPublicRegistration,
} from "./registrations.server";

// PUBLIC — no auth: homepage submits registrations
export const submitSchoolRegistration = createServerFn({ method: "POST" })
  .inputValidator((data) => submitRegistrationSchema.parse(data))
  .handler(async ({ data }) => submitPublicRegistration(data));

export const listSchoolRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listRegistrationsForActor(context.userId));

export const approveSchoolRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => approveRegistrationSchema.parse(data))
  .handler(async ({ data, context }) => approveRegistration(data, context.userId));

export const rejectSchoolRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => rejectRegistrationSchema.parse(data))
  .handler(async ({ data, context }) => rejectRegistration(data, context.userId));