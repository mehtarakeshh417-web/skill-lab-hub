import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { schoolOnboardingSchema } from "./schools.schema";
import { createSchoolForActor, listSchoolsForActor } from "./schools.server";

export const createSchoolAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schoolOnboardingSchema.parse(data))
  .handler(async ({ data, context }) => {
    return createSchoolForActor(data, context.supabase, context.userId);
  });

export const getSchoolDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return listSchoolsForActor(context.supabase, context.userId);
  });
