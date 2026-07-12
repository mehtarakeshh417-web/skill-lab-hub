import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { salesRepCreateSchema } from "./sales-reps.schema";
import {
  createSalesRepForActor,
  getSalesRepDashboardData,
  listActiveSalesRepsBrief,
  listSalesRepsForActor,
} from "./sales-reps.server";

export const createSalesRep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => salesRepCreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    return createSalesRepForActor(data, context.supabase, context.userId);
  });

export const listSalesReps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listSalesRepsForActor(context.supabase, context.userId));

export const listActiveSalesReps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listActiveSalesRepsBrief(context.supabase, context.userId));

export const getSalesRepDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getSalesRepDashboardData(context.supabase, context.userId));