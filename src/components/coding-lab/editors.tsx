import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2, RotateCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { HTML_EDITOR_SRC_DOC } from "./html-editor-srcdoc";

// =============================================================================
// EditorWrapper — premium glassmorphic chrome around every live editor iframe.
// Provides full-screen toggle, reload, open-in-new-tab, fluid shadow, and a
// glowing slate/indigo title bar.
// =============================================================================

type EditorWrapperProps = {
  title: string;
  subtitle?: string;
  caption?: string;
  url?: string;
  children: ReactNode;
  badge?: string;
};

export function EditorWrapper({
  title,
  subtitle,
  caption,
  url,
  children,
  badge,
}: EditorWrapperProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={shellRef}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-[0_30px_80px_-30px_rgba(79,70,229,0.55)] backdrop-blur-2xl transition-all",
        fullscreen
          ? "fixed inset-3 z-[60] flex flex-col rounded-2xl"
          : "flex h-[78vh] flex-col",
      )}
    >
      {/* Glow halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[inherit] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(99,102,241,0.35),rgba(56,189,248,0.2),rgba(99,102,241,0.35))] opacity-40 blur-md"
      />

      {/* Title bar */}
      <header className="relative flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-slate-900/90 via-indigo-950/70 to-slate-900/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-sm font-semibold tracking-tight text-slate-100">
                {title}
              </h3>
              {badge && (
                <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="truncate text-[11px] text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition-all hover:scale-105 hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-indigo-200"
            title="Reload editor"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition-all hover:scale-105 hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-indigo-200"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="rounded-lg border border-indigo-400/30 bg-indigo-500/15 p-1.5 text-indigo-200 transition-all hover:scale-105 hover:border-indigo-300/60 hover:bg-indigo-500/30"
            title={fullscreen ? "Exit full screen" : "Enter full screen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Frame body — re-key on reload to force iframe refresh */}
      <div className="relative flex-1 overflow-hidden bg-slate-950">
        <div key={reloadKey} className="h-full w-full">
          {children}
        </div>
      </div>

      {caption && (
        <footer className="relative border-t border-white/10 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-400 backdrop-blur-xl">
          {caption}
        </footer>
      )}
    </div>
  );
}

// =============================================================================
// LiveFrame — shared iframe element with the strict permission/sandbox matrix.
// =============================================================================

const IFRAME_ALLOW = "fullscreen; clipboard-read; clipboard-write; autoplay";
const IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals";

function LiveFrame({
  src,
  srcDoc,
  title,
}: {
  src?: string;
  srcDoc?: string;
  title: string;
}) {
  return (
    <iframe
      title={title}
      src={src}
      srcDoc={srcDoc}
      allow={IFRAME_ALLOW}
      sandbox={IFRAME_SANDBOX}
      loading="lazy"
      className="h-full w-full border-0 bg-white"
    />
  );
}

// =============================================================================
// Self-contained srcDoc playgrounds for Word / Spreadsheet / Presentation.
// These ship as fully client-side HTML documents so they work cross-origin
// without depending on a third-party host.
// =============================================================================

const WORD_SRC_DOC = `<!doctype html><html><head><meta charset="utf-8"><title>Word Editor</title>
<style>
 :root{color-scheme:light}
 *{box-sizing:border-box}
 body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;flex-direction:column;height:100vh}
 .bar{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px;background:#fff;border-bottom:1px solid #e2e8f0;position:sticky;top:0;z-index:1}
 .bar button,.bar select{font:inherit;font-size:13px;padding:6px 10px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer;transition:.15s}
 .bar button:hover,.bar select:hover{background:#eef2ff;border-color:#6366f1;color:#4338ca}
 .doc{flex:1;overflow:auto;display:flex;justify-content:center;padding:28px}
 .page{background:#fff;width:min(820px,100%);min-height:1000px;padding:64px;box-shadow:0 10px 40px -10px rgba(15,23,42,.18);border-radius:6px;outline:none;line-height:1.6;font-size:15px}
 .page:focus{box-shadow:0 10px 40px -10px rgba(99,102,241,.35)}
</style></head><body>
 <div class="bar">
  <select onchange="document.execCommand('formatBlock',false,this.value)">
   <option value="P">Paragraph</option><option value="H1">Heading 1</option>
   <option value="H2">Heading 2</option><option value="H3">Heading 3</option>
   <option value="BLOCKQUOTE">Quote</option><option value="PRE">Code</option>
  </select>
  <button onclick="document.execCommand('bold')"><b>B</b></button>
  <button onclick="document.execCommand('italic')"><i>I</i></button>
  <button onclick="document.execCommand('underline')"><u>U</u></button>
  <button onclick="document.execCommand('strikeThrough')"><s>S</s></button>
  <button onclick="document.execCommand('justifyLeft')">⯇</button>
  <button onclick="document.execCommand('justifyCenter')">≡</button>
  <button onclick="document.execCommand('justifyRight')">⯈</button>
  <button onclick="document.execCommand('insertUnorderedList')">• List</button>
  <button onclick="document.execCommand('insertOrderedList')">1. List</button>
  <button onclick="var u=prompt('Link URL');if(u)document.execCommand('createLink',false,u)">Link</button>
  <button onclick="document.execCommand('removeFormat')">Clear</button>
 </div>
 <div class="doc"><div class="page" contenteditable="true" spellcheck="true">
  <h1>Welcome to the Word Workspace</h1>
  <p>Start typing to compose your document. Use the toolbar above to apply <b>bold</b>, <i>italic</i>, headings, lists, alignments, and inline links.</p>
  <p>Everything runs entirely in your browser — no account, no upload, no save server.</p>
 </div></div>
</body></html>`;

const SHEET_SRC_DOC = `<!doctype html><html><head><meta charset="utf-8"><title>Spreadsheet</title>
<style>
 :root{color-scheme:light}
 *{box-sizing:border-box}
 body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f1f5f9;color:#0f172a;display:flex;flex-direction:column;height:100vh}
 header{padding:10px 14px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;gap:8px;align-items:center;font-size:13px}
 header b{color:#4338ca}
 .wrap{flex:1;overflow:auto}
 table{border-collapse:collapse;width:max-content;font-size:13px}
 th,td{border:1px solid #e2e8f0;min-width:96px;height:28px;padding:0}
 th{background:#f8fafc;color:#475569;font-weight:600;text-align:center;position:sticky;top:0;z-index:2}
 th.row{left:0;z-index:3;min-width:44px}
 td input{width:100%;height:100%;border:0;outline:none;padding:4px 6px;background:transparent;font:inherit;color:inherit}
 td input:focus{background:#eef2ff;box-shadow:inset 0 0 0 2px #6366f1}
 td.calc{background:#fafafa;color:#0f172a;padding:4px 6px;font-variant-numeric:tabular-nums}
</style></head><body>
 <header>📊 <b>Live Spreadsheet</b> — type values, use <code>=A1+B1</code>, <code>=SUM(A1:A5)</code>, <code>=AVG(B1:B5)</code></header>
 <div class="wrap"><table id="grid"></table></div>
<script>
 const COLS=12,ROWS=24;const tbl=document.getElementById('grid');const data={};
 function colName(i){let s='';i++;while(i){i--;s=String.fromCharCode(65+i%26)+s;i=Math.floor(i/26)}return s}
 function ref(c,r){return colName(c)+(r+1)}
 const head=document.createElement('tr');head.innerHTML='<th class="row"></th>'+Array.from({length:COLS},(_,c)=>'<th>'+colName(c)+'</th>').join('');tbl.appendChild(head);
 for(let r=0;r<ROWS;r++){const tr=document.createElement('tr');tr.innerHTML='<th class="row">'+(r+1)+'</th>';for(let c=0;c<COLS;c++){const td=document.createElement('td');const inp=document.createElement('input');inp.dataset.cell=ref(c,r);inp.addEventListener('focus',e=>{e.target.value=data[e.target.dataset.cell]?.raw||''});inp.addEventListener('blur',e=>{const k=e.target.dataset.cell;data[k]={raw:e.target.value};recalc()});tr.appendChild(td);td.appendChild(inp)}tbl.appendChild(tr)}
 function getVal(k){const d=data[k];if(!d)return 0;const raw=String(d.raw||'').trim();if(!raw)return 0;if(raw.startsWith('=')){return evalExpr(raw.slice(1))}const n=Number(raw);return isNaN(n)?raw:n}
 function expand(r){const m=r.match(/^([A-Z]+)(\\d+):([A-Z]+)(\\d+)$/);if(!m)return [r];const c1=colIdx(m[1]),c2=colIdx(m[3]),r1=+m[2]-1,r2=+m[4]-1;const o=[];for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)o.push(ref(c,r));return o}
 function colIdx(s){let n=0;for(const ch of s)n=n*26+(ch.charCodeAt(0)-64);return n-1}
 function evalExpr(expr){try{let e=expr.replace(/SUM\\(([^)]+)\\)/gi,(_,r)=>'('+expand(r).map(k=>Number(getVal(k))||0).join('+')+')').replace(/AVG\\(([^)]+)\\)/gi,(_,r)=>{const v=expand(r).map(k=>Number(getVal(k))||0);return v.length?'('+v.join('+')+')/'+v.length:'0'});e=e.replace(/[A-Z]+\\d+/g,k=>Number(getVal(k))||0);return Function('"use strict";return ('+e+')')()}catch(err){return '#ERR'}}
 function recalc(){for(const k in data){const inp=document.querySelector('input[data-cell="'+k+'"]');if(!inp)continue;const raw=data[k].raw||'';if(raw.startsWith('=')){inp.value=evalExpr(raw.slice(1))}else{inp.value=raw}}}
</script></body></html>`;

const SLIDES_SRC_DOC = `<!doctype html><html><head><meta charset="utf-8"><title>Presentation</title>
<style>
 :root{color-scheme:light}
 *{box-sizing:border-box}
 body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;flex-direction:column;height:100vh}
 header{padding:10px 14px;background:#1e293b;border-bottom:1px solid #334155;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
 header button{font:inherit;font-size:12px;padding:6px 10px;border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:8px;cursor:pointer}
 header button:hover{background:#312e81;border-color:#6366f1;color:#c7d2fe}
 .stage{flex:1;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at center,#1e293b,#0f172a)}
 .slide{width:min(960px,100%);aspect-ratio:16/9;background:linear-gradient(135deg,#fff,#eef2ff);color:#0f172a;border-radius:18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.6);padding:60px;display:flex;flex-direction:column;gap:18px;outline:none}
 .slide:focus{box-shadow:0 30px 80px -30px rgba(99,102,241,.7)}
 .slide h1{font-size:46px;margin:0;color:#312e81}
 .slide p{font-size:20px;line-height:1.5;margin:0}
 .pager{display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8}
</style></head><body>
 <header>
  <button onclick="prev()">◀ Prev</button>
  <button onclick="next()">Next ▶</button>
  <button onclick="add()">+ Add slide</button>
  <button onclick="del()">🗑 Delete</button>
  <button onclick="present()">▶ Present</button>
  <span class="pager">Slide <b id="idx">1</b> / <b id="total">1</b></span>
 </header>
 <div class="stage"><div id="slide" class="slide" contenteditable="true"></div></div>
<script>
 const seed=[{h:'Avartan Skill Lab',p:'A live presentation playground. Click anywhere on the slide to edit. Use the toolbar to add, navigate, or present.'},{h:'How it works',p:'Slides are fully editable HTML. Bold, italic, lists — all work. Press the Present button to enter focus mode.'},{h:'Your turn',p:'Add a slide and pitch your project to the class.'}];
 const slides=seed.map(s=>'<h1>'+s.h+'</h1><p>'+s.p+'</p>');let i=0;const el=document.getElementById('slide');
 function render(){el.innerHTML=slides[i];document.getElementById('idx').textContent=i+1;document.getElementById('total').textContent=slides.length}
 function save(){slides[i]=el.innerHTML}
 function prev(){save();i=(i-1+slides.length)%slides.length;render()}
 function next(){save();i=(i+1)%slides.length;render()}
 function add(){save();slides.splice(i+1,0,'<h1>New slide</h1><p>Click to edit this text.</p>');i++;render()}
 function del(){if(slides.length===1)return;save();slides.splice(i,1);i=Math.max(0,i-1);render()}
 function present(){const w=document.documentElement;if(w.requestFullscreen)w.requestFullscreen()}
 document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()});
 render();
</script></body></html>`;

// =============================================================================
// Editor registry — slug → live editor configuration. Every entry is wrapped
// inside <EditorWrapper> with the strict allow/sandbox policy.
// =============================================================================

export type EditorSlug =
  | "scratch-jr"
  | "scratch"
  | "python"
  | "java"
  | "mysql"
  | "html"
  | "editor"
  | "spreadsheet"
  | "presentation"
  | "paint";

type EditorConfig = {
  title: string;
  subtitle: string;
  badge: string;
  caption: string;
  src?: string;
  srcDoc?: string;
};

export const EDITOR_REGISTRY: Record<EditorSlug, EditorConfig> = {
  scratch: {
    title: "Scratch",
    subtitle: "Block-based programming · drag, drop, run",
    badge: "Live",
    src: "https://studio.penguinmod.com/editor.html",
    caption:
      "Powered by PenguinMod Studio — a free Scratch 3.0–compatible web editor.",
  },
  "scratch-jr": {
    title: "Scratch Junior",
    subtitle: "Visual coding for early learners",
    badge: "Live",
    src: "https://codejr.org/scratchjr/index.html",
    caption:
      "Powered by CodeJr.org — a free browser version of Scratch Jr.",
  },
  python: {
    title: "Python",
    subtitle: "Write, run, and debug Python in your browser",
    badge: "REPL",
    src: "https://onecompiler.com/embed/python",
    caption:
      "Powered by OneCompiler — full Python 3 runtime with stdin / stdout terminal.",
  },
  java: {
    title: "Java",
    subtitle: "Compile and execute Java with full class support",
    badge: "JDK",
    src: "https://onecompiler.com/embed/java",
    caption:
      "Powered by OneCompiler — OpenJDK compiler with live console output.",
  },
  mysql: {
    title: "MySQL",
    subtitle: "Run SQL queries against a live database sandbox",
    badge: "SQL",
    src: "https://onecompiler.com/embed/mysql",
    caption:
      "Powered by OneCompiler — interactive MySQL playground with sample schema.",
  },
  html: {
    title: "HTML · CSS · JS",
    subtitle: "Side-by-side editor with instant live preview",
    badge: "Web",
    srcDoc: HTML_EDITOR_SRC_DOC,
    caption:
      "Self-contained HTML / CSS / JS editor — live preview, console capture, auto-run, autosave and download.",
  },
  editor: {
    title: "Word Editor",
    subtitle: "Zoho Writer — full online word processor",
    badge: "Doc",
    src: "https://writer.zoho.com/writer/",
    caption:
      "Powered by Zoho Writer — a full-featured online word processor. Use the pop-out button if the embed is blocked by the provider.",
  },
  spreadsheet: {
    title: "Spreadsheet",
    subtitle: "Live grid with formula engine",
    badge: "Grid",
    srcDoc: SHEET_SRC_DOC,
    caption:
      "Self-contained spreadsheet — supports = expressions, SUM() and AVG() ranges.",
  },
  presentation: {
    title: "Presentation",
    subtitle: "Build, edit, and present slide decks",
    badge: "Slides",
    srcDoc: SLIDES_SRC_DOC,
    caption:
      "Self-contained slide builder — editable slides, keyboard nav, full-screen present mode.",
  },
  paint: {
    title: "Paint",
    subtitle: "Classic raster paint canvas",
    badge: "Canvas",
    src: "https://jspaint.app/",
    caption:
      "Powered by JS Paint — a faithful open-source MS Paint clone running in your browser.",
  },
};

// =============================================================================
// LiveEditor — render a single registered editor by slug. Returns null when
// the slug is not a known editor so callers can fall back to legacy UI.
// =============================================================================

export function LiveEditor({ slug }: { slug: string }) {
  const config = EDITOR_REGISTRY[slug as EditorSlug];
  if (!config) return null;
  return (
    <EditorWrapper
      title={config.title}
      subtitle={config.subtitle}
      badge={config.badge}
      caption={config.caption}
      url={config.src}
    >
      <LiveFrame src={config.src} srcDoc={config.srcDoc} title={config.title} />
    </EditorWrapper>
  );
}

export function isLiveEditor(slug: string): slug is EditorSlug {
  return slug in EDITOR_REGISTRY;
}