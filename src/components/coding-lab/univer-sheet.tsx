import { useEffect, useRef, useState } from "react";

/**
 * UniverSheet — Excel-grade spreadsheet powered by the Univer preset.
 * Univer touches window at import time, so we dynamic-import it inside
 * an effect. Rendered inside a client-only wrapper by the caller.
 */
export function UniverSheet() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    let disposed = false;
    // Keep a reference to the Univer instance so we can dispose on reset/unmount.
    let univerAPI: { dispose?: () => void } | null = null;

    async function boot() {
      try {
        const [{ createUniver, LocaleType, merge }, { UniverSheetsCorePreset }, enUS, presetCss] =
          await Promise.all([
            import("@univerjs/presets"),
            import("@univerjs/preset-sheets-core"),
            import("@univerjs/preset-sheets-core/locales/en-US"),
            import("@univerjs/presets/lib/styles/preset-sheets-core.css?inline"),
          ]);

        if (disposed || !hostRef.current) return;

        // Inject the Univer stylesheets once (they target document-level classes).
        const styleId = "univer-inline-styles";
        if (!document.getElementById(styleId)) {
          const s = document.createElement("style");
          s.id = styleId;
          s.textContent = presetCss.default;
          document.head.appendChild(s);
        }

        const { univerAPI: api } = createUniver({
          locale: LocaleType.EN_US,
          locales: {
            [LocaleType.EN_US]: merge({}, (enUS as { default: unknown }).default),
          },
          presets: [
            UniverSheetsCorePreset({
              container: hostRef.current,
            }),
          ],
        });

        // Seed a workbook so the surface is immediately useful.
        api.createWorkbook({
          id: "avartan-workbook",
          name: "Students Workbook",
          sheets: {
            "sheet-1": {
              id: "sheet-1",
              name: "Students",
              cellData: {
                0: {
                  0: { v: "ID" },
                  1: { v: "Name" },
                  2: { v: "Grade" },
                  3: { v: "Math" },
                  4: { v: "Science" },
                  5: { v: "Average" },
                },
                1: { 0: { v: 1 }, 1: { v: "Aarav" }, 2: { v: 8 }, 3: { v: 88 }, 4: { v: 92 }, 5: { f: "=AVERAGE(D2:E2)" } },
                2: { 0: { v: 2 }, 1: { v: "Diya" }, 2: { v: 9 }, 3: { v: 75 }, 4: { v: 81 }, 5: { f: "=AVERAGE(D3:E3)" } },
                3: { 0: { v: 3 }, 1: { v: "Kabir" }, 2: { v: 8 }, 3: { v: 95 }, 4: { v: 89 }, 5: { f: "=AVERAGE(D4:E4)" } },
                4: { 0: { v: 4 }, 1: { v: "Mira" }, 2: { v: 10 }, 3: { v: 70 }, 4: { v: 85 }, 5: { f: "=AVERAGE(D5:E5)" } },
                5: { 0: { v: 5 }, 1: { v: "Rohan" }, 2: { v: 9 }, 3: { v: 77 }, 4: { v: 90 }, 5: { f: "=AVERAGE(D6:E6)" } },
              },
            },
          },
        });

        univerAPI = api as { dispose?: () => void };
        setReady(true);
      } catch (err) {
        console.error("[UniverSheet] failed to boot", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    boot();
    return () => {
      disposed = true;
      try {
        univerAPI?.dispose?.();
      } catch {
        /* noop */
      }
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [resetKey]);

  return (
    <div className="relative h-full w-full bg-white">
      <button
        type="button"
        onClick={() => setResetKey((k) => k + 1)}
        className="absolute right-3 top-3 z-20 rounded-lg border border-emerald-400/40 bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-emerald-50"
        title="Reset workbook"
      >
        ↺ Reset workbook
      </button>
      <div ref={hostRef} className="h-full w-full" />
      {!ready && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-slate-600">
          Loading spreadsheet engine…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white p-6 text-center text-sm text-rose-600">
          Failed to load spreadsheet: {error}
        </div>
      )}
    </div>
  );
}