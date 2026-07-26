import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    search?: string;
    state?: string;
    city?: string;
    region?: string;
    schoolId?: string;
    status?: string;
  }) => d ?? {})
  .handler(async ({ data, context }) => {
    const { loadDirectory } = await import("./directory.server");
    return loadDirectory(context.supabase, context.userId, data);
  });

export const deleteSchoolWithDependents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { schoolId: string }) => d)
  .handler(async ({ data, context }) => {
    const { deleteSchoolCascade } = await import("./directory.server");
    return deleteSchoolCascade(context.supabase, context.userId, data.schoolId);
  });

export const deleteDirectoryPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "teacher" | "student" | "sales_rep"; id: string }) => d)
  .handler(async ({ data, context }) => {
    const { deletePersonRecord } = await import("./directory.server");
    return deletePersonRecord(context.supabase, context.userId, data.kind, data.id);
  });