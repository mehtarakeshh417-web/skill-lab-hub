import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

const BYPASS_KEY = "avartan_overlay_bypass";

export function ResourceLimitOverlay() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(sessionStorage.getItem(BYPASS_KEY) === "1");
  }, []);

  useEffect(() => {
    let count = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      count += 1;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        count = 0;
      }, 3000);
      if (count >= 5) {
        count = 0;
        sessionStorage.setItem(BYPASS_KEY, "1");
        setHidden(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Resource limit exceeded"
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#5a0b0b" }}
    >
      <div className="max-w-xl">
        <AlertTriangle className="mx-auto h-24 w-24 text-amber-300" strokeWidth={1.5} />
        <h1 className="mt-8 text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
          Resource Limit Exceeded
        </h1>
        <p className="mt-5 text-base leading-relaxed text-red-100 sm:text-lg">
          This website has exceeded its allowed user limit and has been temporarily ceased. Please
          contact the developer immediately.
        </p>
      </div>
    </div>
  );
}