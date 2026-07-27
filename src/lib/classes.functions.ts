import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyClassSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listClassSectionsForSchoolActor } = await import("./classes.server");
    return listClassSectionsForSchoolActor(context.supabase, context.userId);
  });

export const saveMyClassSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    sections: z.array(z.object({
      className: z.string().trim().min(1).max(80),
      sectionName: z.string().trim().min(1).max(80),
      teacherUsername: z.string().trim().max(120).nullable().optional().default(null),
    })),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { saveClassSectionsForSchoolActor } = await import("./classes.server");
    return saveClassSectionsForSchoolActor(
      data.sections.map((s) => ({ ...s, teacherUsername: s.teacherUsername ?? null })),
      context.supabase,
      context.userId,
    );
  });

export const assignTeacherToSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ sectionId: z.string().uuid(), teacherId: z.string().uuid().nullable() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assignTeacherToSectionForSchoolActor } = await import("./classes.server");
    return assignTeacherToSectionForSchoolActor(data, context.supabase, context.userId);
  });

export const listMyStudentTeacherAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listStudentTeacherAssignmentsForSchoolActor } = await import("./classes.server");
    return listStudentTeacherAssignmentsForSchoolActor(context.supabase, context.userId);
  });

export const setStudentTeacherAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    teacherId: z.string().uuid(),
    studentId: z.string().uuid(),
    assigned: z.boolean(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { setStudentTeacherAssignmentForSchoolActor } = await import("./classes.server");
    return setStudentTeacherAssignmentForSchoolActor(data, context.supabase, context.userId);
  });

export const getMyTeacherWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTeacherWorkspaceForActor } = await import("./classes.server");
    return getTeacherWorkspaceForActor(context.supabase, context.userId);
  });