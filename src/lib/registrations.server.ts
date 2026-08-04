import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  ApproveRegistrationInput,
  RejectRegistrationInput,
  SubmitRegistrationInput,
} from "./registrations.schema";

type AuthedClient = SupabaseClient<Database>;

function encryptionKey(): Buffer {
  const src = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_URL || "avartan-fallback-key";
  return createHash("sha256").update(`avartan::school-reg::${src}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted payload");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

function normUsername(u: string) { return u.trim().toLowerCase(); }
function normCode(c: string) { return c.trim().toUpperCase().replace(/\s+/g, "-"); }

export type RegistrationRecord = {
  id: string;
  schoolName: string;
  schoolCode: string;
  principalName: string;
  region: string;
  state: string;
  city: string;
  area: string;
  designation: string;
  notes: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  salesRepId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdSchoolId: string | null;
};

function toRecord(row: Database["public"]["Tables"]["school_registrations"]["Row"]): RegistrationRecord {
  return {
    id: row.id,
    schoolName: row.school_name,
    schoolCode: row.school_code,
    principalName: row.principal_name ?? "",
    region: row.region ?? "",
    state: (row as { state?: string | null }).state ?? "",
    city: (row as { city?: string | null }).city ?? "",
    area: (row as { area?: string | null }).area ?? "",
    designation: row.designation ?? "",
    notes: row.notes ?? "",
    username: row.username,
    email: row.email,
    phone: row.phone ?? "",
    address: row.address ?? "",
    status: (row.status as "pending" | "approved" | "rejected") ?? "pending",
    rejectionReason: row.rejection_reason ?? "",
    salesRepId: (row as { sales_rep_id?: string | null }).sales_rep_id ?? null,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    createdSchoolId: row.created_school_id,
  };
}

async function assertReviewer(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = new Set((data ?? []).map((r) => r.role as string));
  const isAdmin = roles.has("admin");
  const isManager = roles.has("portal_manager");
  if (!isAdmin && !isManager) throw new Error("Only admins and portal managers can review registrations.");
  return { isAdmin, isManager };
}

async function assertUsernameAvailable(username: string, excludingRegistrationId?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [profile, school, salesRep, reg] = await Promise.all([
    supabaseAdmin.from("profiles").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("schools").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("sales_reps").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin
      .from("school_registrations")
      .select("id, status")
      .ilike("username", username)
      .neq("status", "rejected"),
  ]);
  if (profile.data || school.data || salesRep.data) throw new Error("[username] This username is already taken. Choose another.");
  const conflictingReg = (reg.data ?? []).find((r) => r.id !== excludingRegistrationId);
  if (conflictingReg) throw new Error("[username] A pending or approved registration already uses this username.");
}

export async function submitPublicRegistration(input: SubmitRegistrationInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const username = normUsername(input.username);
  // The school code is assigned by an admin / portal manager at approval time.
  const schoolCode = `PENDING-${randomBytes(4).toString("hex").toUpperCase()}`;
  const email = input.email.trim().toLowerCase();

  await assertUsernameAvailable(username);

  // Resolve the typed sales representative name to an active rep record.
  const repName = input.salesRepName.trim();
  const repLookup = await supabaseAdmin
    .from("sales_reps")
    .select("id, full_name, status")
    .ilike("full_name", repName)
    .eq("status", "active");
  if (repLookup.error) throw new Error(repLookup.error.message);
  const matches = repLookup.data ?? [];
  if (matches.length === 0) {
    throw new Error("[salesRepName] This sales representative does not exist. Please check the name with your representative.");
  }
  if (matches.length > 1) {
    throw new Error("[salesRepName] Multiple representatives share this name. Please contact Avartan support to continue.");
  }
  const salesRepId = matches[0].id;

  const encrypted = encryptSecret(input.password);
  const insert = await supabaseAdmin
    .from("school_registrations")
    .insert({
      school_name: input.schoolName.trim(),
      school_code: schoolCode,
      principal_name: input.principalName?.trim() || null,
      region: input.region?.trim() || null,
      state: input.state?.trim() || null,
      city: input.city?.trim() || null,
      area: input.area?.trim() || null,
      designation: input.designation?.trim() || null,
      notes: input.notes?.trim() || null,
      username,
      email,
      phone: input.phone.trim(),
      address: input.address?.trim() || null,
      encrypted_password: encrypted,
      status: "pending",
      sales_rep_id: salesRepId,
    })
    .select("*")
    .single();
  if (insert.error) throw new Error(insert.error.message);
  const requestRef = `AVR-${insert.data.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const { writeAudit } = await import("./security.server");
  await writeAudit({
    actorUserId: null,
    actorUsername: username,
    actorRole: "public",
    action: "registration.submit",
    module: "School Registrations",
    entityType: "school_registration",
    entityId: insert.data.id,
    entityLabel: input.schoolName.trim(),
    newValue: { requestRef, schoolCode, username, email, city: input.city, state: input.state, salesRepId },
    remarks: "Public school registration submitted for approval",
  });
  return { ...toRecord(insert.data), requestRef };
}

export async function listRegistrationsForActor(actorUserId: string) {
  await assertReviewer(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("school_registrations")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  const records = (data ?? []).map(toRecord);
  return {
    records,
    counts: {
      total: records.length,
      pending: records.filter((r) => r.status === "pending").length,
      approved: records.filter((r) => r.status === "approved").length,
      rejected: records.filter((r) => r.status === "rejected").length,
    },
  };
}

export async function approveRegistration(input: ApproveRegistrationInput, actorUserId: string) {
  await assertReviewer(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: reg, error: regErr } = await supabaseAdmin
    .from("school_registrations")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (regErr) throw new Error(regErr.message);
  if (!reg) throw new Error("Registration not found.");
  if (reg.status !== "pending") throw new Error(`Registration is already ${reg.status}.`);

  // Merge edits (fall back to original values)
  const schoolName = (input.schoolName ?? reg.school_name).trim();
  const schoolCode = normCode(input.schoolCode);
  const principalName = (input.principalName ?? reg.principal_name ?? "").trim();
  const region = (input.region ?? reg.region ?? "").trim();
  const state = (input.state ?? (reg as { state?: string | null }).state ?? "").trim();
  const city = (input.city ?? (reg as { city?: string | null }).city ?? "").trim();
  const area = (input.area ?? (reg as { area?: string | null }).area ?? "").trim();
  const designation = (input.designation ?? reg.designation ?? "Principal").trim();
  const notes = (input.notes ?? reg.notes ?? "").trim();
  const email = (input.email ?? reg.email).trim().toLowerCase();
  const phone = (input.phone ?? reg.phone ?? "").trim();
  const address = (input.address ?? reg.address ?? "").trim();
  const username = normUsername(reg.username);

  await assertUsernameAvailable(username, reg.id);

  // Ensure school code still free
  const codeCheck = await supabaseAdmin
    .from("schools")
    .select("id")
    .ilike("school_code", schoolCode)
    .maybeSingle();
  if (codeCheck.data) throw new Error("[schoolCode] That school code is already active. Enter a different code.");

  const pendingCode = await supabaseAdmin
    .from("school_registrations")
    .select("id")
    .ilike("school_code", schoolCode)
    .neq("id", reg.id)
    .maybeSingle();
  if (pendingCode.data) throw new Error("[schoolCode] Another registration already uses this school code.");

  const password = decryptSecret(reg.encrypted_password);
  const loginEmail = `${username}@avartan.app`;

  const created = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: schoolName,
      school_code: schoolCode,
      contact_email: email,
    },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Could not create school login.");
  }
  const userId = created.data.user.id;

  try {
    const roleInsert = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "school" });
    if (roleInsert.error) throw new Error(roleInsert.error.message);

    const schoolInsert = await supabaseAdmin
      .from("schools")
      .insert({
        user_id: userId,
        school_code: schoolCode,
        name: schoolName,
        username,
        email,
        phone,
        address: address || null,
        area: area || region || null,
        city: city || null,
        state: state || null,
        principal_name: principalName || null,
        designation: designation || "Principal",
        notes: notes || null,
        status: "active",
        sales_rep_id: input.salesRepId,
      })
      .select("*")
      .single();
    if (schoolInsert.error) throw new Error(schoolInsert.error.message);

    // Mark registration approved and clear encrypted password (Auth already stores bcrypt hash)
    const update = await supabaseAdmin
      .from("school_registrations")
      .update({
        status: "approved",
        reviewed_by: actorUserId,
        reviewed_at: new Date().toISOString(),
        created_school_id: schoolInsert.data.id,
        encrypted_password: "v1::purged::",
        // sync any edits back into the registration for auditability
        school_name: schoolName,
        school_code: schoolCode,
        principal_name: principalName || null,
        region: region || null,
        state: state || null,
        city: city || null,
        area: area || null,
        designation: designation || null,
        notes: notes || null,
        email,
        phone,
        address: address || null,
      })
      .eq("id", reg.id);
    if (update.error) throw new Error(update.error.message);

    const { writeAudit } = await import("./security.server");
    await writeAudit({
      actorUserId,
      action: "registration.approve",
      module: "School Registrations",
      entityType: "school_registration",
      entityId: input.id,
      entityLabel: schoolName,
      targetUserId: userId,
      targetRole: "school",
      previousValue: { status: "pending" },
      newValue: { status: "approved", schoolId: schoolInsert.data.id, schoolCode, username },
      remarks: "Registration approved — school account provisioned and can sign in immediately",
    });
    return { ok: true, schoolId: schoolInsert.data.id };
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    const { writeAudit } = await import("./security.server");
    await writeAudit({
      actorUserId,
      action: "registration.approve",
      module: "School Registrations",
      entityType: "school_registration",
      entityId: input.id,
      entityLabel: schoolName,
      status: "failure",
      remarks: err instanceof Error ? err.message : "Approval failed",
    });
    throw err;
  }
}

export async function rejectRegistration(input: RejectRegistrationInput, actorUserId: string) {
  await assertReviewer(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const update = await supabaseAdmin
    .from("school_registrations")
    .update({
      status: "rejected",
      rejection_reason: input.reason?.trim() || null,
      reviewed_by: actorUserId,
      reviewed_at: new Date().toISOString(),
      encrypted_password: "v1::purged::",
    })
    .eq("id", input.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (update.error) throw new Error(update.error.message);
  if (!update.data) throw new Error("Registration could not be rejected (not pending or not found).");
  const { writeAudit } = await import("./security.server");
  await writeAudit({
    actorUserId,
    action: "registration.reject",
    module: "School Registrations",
    entityType: "school_registration",
    entityId: input.id,
    previousValue: { status: "pending" },
    newValue: { status: "rejected", reason: input.reason?.trim() || null },
    remarks: input.reason?.trim() || "Registration rejected",
  });
  return { ok: true };
}