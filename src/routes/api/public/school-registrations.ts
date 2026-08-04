import { createFileRoute } from "@tanstack/react-router";
import { submitRegistrationSchema } from "@/lib/registrations.schema";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

type ErrorPayload = {
  ok: false;
  error: string;
  field?: string;
};

function errorResponse(error: string, status: number, field?: string) {
  const payload: ErrorPayload = { ok: false, error, ...(field ? { field } : {}) };
  return Response.json(payload, { status, headers: { ...CORS_HEADERS } });
}

export const Route = createFileRoute("/api/public/school-registrations")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: { ...CORS_HEADERS } }),
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return errorResponse("The registration request must be JSON.", 415);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("The registration request is not valid JSON.", 400);
        }

        const parsed = submitRegistrationSchema.safeParse(body);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          const field = typeof issue?.path[0] === "string" ? issue.path[0] : undefined;
          return errorResponse(issue?.message ?? "Please correct the highlighted fields.", 400, field);
        }

        try {
          const { submitPublicRegistration } = await import("@/lib/registrations.server");
          const record = await submitPublicRegistration(parsed.data);
          return Response.json(
            { ok: true, status: "pending", requestRef: record.requestRef },
            { status: 201, headers: { ...CORS_HEADERS } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Registration could not be submitted.";
          const tagged = /^\[([a-zA-Z]+)\]\s*(.*)$/.exec(message.trim());
          if (tagged) {
            return errorResponse(tagged[2] || "Please correct this field.", 409, tagged[1]);
          }
          console.error("School registration submission failed", error);
          return errorResponse("Registration could not be submitted. Please try again.", 500);
        }
      },
    },
  },
});