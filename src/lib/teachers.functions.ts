import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { teacherCreateSchema } from "./teachers.schema";
import { createTeacherForSchool, listTeachersForSchoolActor } from "./teachers.server";

export const createTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => teacherCreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    return createTeacherForSchool(data, context.supabase, context.userId);
  });

export const listMySchoolTeachers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTeachersForSchoolActor(context.supabase, context.userId));