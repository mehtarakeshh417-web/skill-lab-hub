import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getTeacherWorkspaceForActor,
  listClassSectionsForSchoolActor,
  saveClassSectionsForSchoolActor,
} from "./classes.server";

const sectionsSchema = z.object({
  sections: z.array(
    z.object({
      className: z.string().trim().min(1).max(80),
      sectionName: z.string().trim().min(1).max(80),
      teacherUsername: z.string().trim().max(120).nullable().optional().default(null),
    }),
  ),
});

export const listMyClassSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listClassSectionsForSchoolActor(context.supabase, context.userId));

export const saveMyClassSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => sectionsSchema.parse(data))
  .handler(async ({ data, context }) =>
    saveClassSectionsForSchoolActor(
      data.sections.map((s) => ({ ...s, teacherUsername: s.teacherUsername ?? null })),
      context.supabase,
      context.userId,
    ),
  );

export const getMyTeacherWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getTeacherWorkspaceForActor(context.supabase, context.userId));