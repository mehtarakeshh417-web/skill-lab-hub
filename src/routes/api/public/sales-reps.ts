import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export const Route = createFileRoute("/api/public/sales-reps")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: { ...CORS_HEADERS } }),
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("sales_reps")
            .select("id, full_name, designation, status")
            .eq("status", "active")
            .order("full_name");
          if (error) throw new Error(error.message);
          const reps = (data ?? []).map((r) => ({
            id: r.id,
            fullName: r.full_name,
            designation: r.designation ?? "",
          }));
          return Response.json(
            { ok: true, reps },
            { headers: { ...CORS_HEADERS, "cache-control": "no-store" } },
          );
        } catch (error) {
          console.error("Failed to list public sales reps", error);
          return Response.json(
            { ok: false, reps: [], error: "Could not load sales representatives." },
            { status: 500, headers: { ...CORS_HEADERS } },
          );
        }
      },
    },
  },
});
