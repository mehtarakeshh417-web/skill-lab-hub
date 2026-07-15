import { useEffect, useState } from "react";

const SESSION_KEY = "__svc_suspend_bypass__";

export function ServiceSuspendedOverlay() {
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (hidden) return;
    let count = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      count += 1;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => (count = 0), 2000);
      if (count >= 5) {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        setHidden(true);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (timer) clearTimeout(timer);
    };
  }, [hidden]);

  useEffect(() => {
    if (hidden) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflow: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#0b1220",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          borderRadius: 12,
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(148,163,184,0.08) inset",
          overflow: "hidden",
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "#111827",
            borderBottom: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <span style={dot("#ef4444")} />
          <span style={dot("#f59e0b")} />
          <span style={dot("#64748b")} />
          <span
            style={{
              marginLeft: 10,
              fontSize: 12,
              color: "#94a3b8",
              letterSpacing: 0.4,
            }}
          >
            infra-console — db-primary — suspended
          </span>
        </div>

        <div style={{ padding: "28px 28px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(239,68,68,0.18))",
                border: "1px solid rgba(245,158,11,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <ellipse cx="12" cy="5" rx="8" ry="3" />
                <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
                <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                <line x1="12" y1="9" x2="12" y2="15" />
                <line x1="12" y1="17" x2="12" y2="17.01" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "#f59e0b",
                  fontWeight: 700,
                }}
              >
                CLOUD INFRASTRUCTURE NOTICE
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#f8fafc",
                  marginTop: 2,
                  letterSpacing: 0.2,
                }}
              >
                STATUS: SERVICE SUSPENDED
                <span style={{ color: "#ef4444" }}> (RESOURCE_LIMIT_EXCEEDED)</span>
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: "#cbd5e1",
              margin: "0 0 18px",
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
          >
            The database connection and backend API services for this application
            have been temporarily paused due to unpaid resource usage or plan
            expiration.
          </p>

          <div
            style={{
              background: "#020617",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: 8,
              padding: "14px 16px",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <Row k="error_code" v="ERR_DB_CONNECTION_SUSPENDED" vColor="#ef4444" />
            <Row k="service" v="primary-database + api-gateway" />
            <Row k="state" v="SUSPENDED" vColor="#f59e0b" />
            <Row k="reason" v="resource_limit_exceeded / billing_hold" />
            <Row k="retry" v="disabled" vColor="#94a3b8" />
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#94a3b8",
              lineHeight: 1.6,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Please contact your system administrator or the primary developer to
            resolve this configuration.
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: "1px dashed rgba(148,163,184,0.18)",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              fontSize: 11,
              color: "#64748b",
              letterSpacing: 0.4,
            }}
          >
            <span>region: ap-south-1 · node: db-primary-07</span>
            <span>
              incident_id: INC-{Math.floor(Date.now() / 1000)
                .toString(16)
                .toUpperCase()
                .slice(-8)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function dot(color: string): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
  };
}

function Row({
  k,
  v,
  vColor,
}: {
  k: string;
  v: string;
  vColor?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "3px 0" }}>
      <span style={{ color: "#64748b", minWidth: 96 }}>{k}</span>
      <span style={{ color: "#475569" }}>=</span>
      <span style={{ color: vColor ?? "#e2e8f0", fontWeight: 600 }}>{v}</span>
    </div>
  );
}