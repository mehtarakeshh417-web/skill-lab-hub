import { useEffect, useRef, useState } from "react";

/**
 * UniverDoc — Word-grade document editor powered by the Univer docs preset.
 * Runs fully in-browser, no external service. Rendered inside a client-only
 * wrapper by the caller since Univer touches window at import time.
 */
export function UniverDoc() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    let disposed = false;
    let univerAPI: { dispose?: () => void } | null = null;

    async function boot() {
      try {
        const [{ createUniver, LocaleType, merge }, { UniverDocsCorePreset }, enUS, presetCss] =
          await Promise.all([
            import("@univerjs/presets"),
            import("@univerjs/preset-docs-core"),
            import("@univerjs/preset-docs-core/locales/en-US"),
            import("@univerjs/presets/lib/styles/preset-docs-core.css?inline"),
          ]);

        if (disposed || !hostRef.current) return;

        const styleId = "univer-docs-inline-styles";
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
            UniverDocsCorePreset({
              container: hostRef.current,
            }),
          ],
        });

        // Seed a starter document so the surface is immediately useful.
        api.createUniverDoc({
          id: "avartan-doc",
          body: {
            dataStream:
              "Avartan Skill Lab — Word Editor\n\nStart typing your document here. Use the ribbon above for headings, bold, lists, tables, images and more. Your work stays inside this browser session.\n\n",
          },
          documentStyle: {},
        });

        univerAPI = api as { dispose?: () => void };
        setReady(true);
      } catch (err) {
        console.error("[UniverDoc] failed to boot", err);
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
        title="Reset document"
      >
        ↺ Reset document
      </button>
      <div ref={hostRef} className="h-full w-full" />
      {!ready && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-slate-600">
          Loading document engine…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white p-6 text-center text-sm text-rose-600">
          Failed to load document: {error}
        </div>
      )}
    </div>
  );
}