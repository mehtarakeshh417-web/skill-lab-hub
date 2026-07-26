import { createFileRoute } from "@tanstack/react-router";
import { submitRegistrationSchema } from "@/lib/registrations.schema";

type ErrorPayload = {
  ok: false;
  error: string;
  field?: string;
};

function errorResponse(error: string, status: number, field?: string) {
  const payload: ErrorPayload = { ok: false, error, ...(field ? { field } : {}) };
  return Response.json(payload, { status });
}

export const Route = createFileRoute("/api/public/school-registrations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return errorResponse("The registration request must be JSON.", 415);
        }

        const origin = request.headers.get("origin");
        if (origin) {
          const requestOrigin = new URL(request.url).origin;
          if (origin !== requestOrigin) {
            return errorResponse("This registration request came from an invalid origin.", 403);
          }
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
          await submitPublicRegistration(parsed.data);
          return Response.json({ ok: true, status: "pending" }, { status: 201 });
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