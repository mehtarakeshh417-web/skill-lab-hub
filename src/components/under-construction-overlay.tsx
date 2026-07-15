import { useEffect, useState } from "react";

const BYPASS_KEY = "uc_bypass";

export function UnderConstructionOverlay() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const bypassed = sessionStorage.getItem(BYPASS_KEY) === "1";
    setHidden(bypassed);
  }, []);

  if (hidden) return null;

  const bypass = () => {
    sessionStorage.setItem(BYPASS_KEY, "1");
    setHidden(true);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background:
          "radial-gradient(ellipse at top, #1e3a8a 0%, #0f172a 60%, #020617 100%)",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 640 }}>
        <div
          style={{
            fontSize: "3.5rem",
            marginBottom: "1.5rem",
          }}
          aria-hidden
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            marginBottom: "1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Some unknown error occurred
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "#94a3b8",
            margin: 0,
          }}
        >
          We are unable to load this page right now. Please try again later or contact the administrator for assistance.
        </p>
      </div>

      <button
        onClick={bypass}
        style={{
          position: "absolute",
          bottom: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "transparent",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          color: "rgba(148, 163, 184, 0.5)",
          padding: "0.35rem 0.75rem",
          fontSize: "0.7rem",
          borderRadius: "0.375rem",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Developer Bypass
      </button>
    </div>
  );
}