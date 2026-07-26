import { supabase } from "@/integrations/supabase/client";
import type { ProjectFile } from "./projects.schema";

export async function uploadProjectFiles(assignmentId: string, files: File[]): Promise<ProjectFile[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Your session expired. Please sign in again.");
  const out: ProjectFile[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${uid}/${assignmentId}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    out.push({ name: file.name, path });
  }
  return out;
}