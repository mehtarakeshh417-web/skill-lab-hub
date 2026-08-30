import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { studentBulkSchema, studentCreateSchema } from "./students.schema";
import {
  bulkCreateStudentsForSchool,
  createStudentForSchool,
  getStudentCredentialsForActor,
  listStudentsForSchoolActor,
} from "./students.server";

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => studentCreateSchema.parse(data))
  .handler(async ({ data, context }) => createStudentForSchool(data, context.supabase, context.userId));

export const bulkCreateStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => studentBulkSchema.parse(data))
  .handler(async ({ data, context }) =>
    bulkCreateStudentsForSchool(data.students, context.supabase, context.userId),
  );

export const listMySchoolStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listStudentsForSchoolActor(context.supabase, context.userId));