import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Maximize2, Minimize2, RotateCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { HTML_EDITOR_SRC_DOC } from "./html-editor-srcdoc";
import { SHEET_LUCKYSHEET_SRC_DOC } from "./sheet-luckysheet-srcdoc";
import { SLIDES_EDITOR_SRC_DOC } from "./slides-editor-srcdoc";
import { WORD_RIBBON_SRC_DOC } from "./word-ribbon-srcdoc";

const UniverSheet = lazy(() =>
  import("./univer-sheet").then((m) => ({ default: m.UniverSheet })),
);
const UniverDoc = lazy(() =>
  import("./univer-doc").then((m) => ({ default: m.UniverDoc })),
);

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
      <header className="relative flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-slate-900/90 via-emerald-950/70 to-slate-900/90 px-4 py-3 backdrop-blur-xl">
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
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
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
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition-all hover:scale-105 hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:text-emerald-200"
            title="Reload editor"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition-all hover:scale-105 hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:text-emerald-200"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 p-1.5 text-emerald-200 transition-all hover:scale-105 hover:border-emerald-300/60 hover:bg-emerald-500/30"
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

const SQL_SRC_DOC = `<!doctype html><html><head><meta charset="utf-8"><title>SQL Editor</title>
<style>
 :root{color-scheme:light}
 *{box-sizing:border-box}
 html,body{margin:0;height:100%;font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a;overflow:hidden}
 .app{display:grid;grid-template-rows:auto 1fr auto;height:100vh}
 header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:#fff;border-bottom:1px solid #e2e8f0}
 header h1{margin:0;font-size:13px;font-weight:700;color:#4338ca;display:flex;align-items:center;gap:8px}
 header h1 span{display:inline-block;width:8px;height:8px;border-radius:99px;background:#4f46e5}
 header .grow{flex:1}
 header button,header select{font:inherit;font-size:12px;font-weight:600;padding:7px 12px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:8px;cursor:pointer}
 header button:hover,header select:hover{background:#eef2ff;border-color:#6366f1;color:#4338ca}
 header button.primary{background:linear-gradient(135deg,#4f46e5,#7c3aed);border:0;color:#fff}
 .work{display:grid;grid-template-rows:1fr 1fr;min-height:0}
 textarea{border:0;outline:0;resize:none;width:100%;height:100%;padding:14px 16px;font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;font-size:13.5px;line-height:1.6;background:#0b1020;color:#e2e8f0;tab-size:2;caret-color:#a5b4fc}
 .results{overflow:auto;background:#fff;border-top:1px solid #e2e8f0;padding:12px 14px}
 .results table{border-collapse:collapse;width:100%;font-size:13px}
 .results th,.results td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left}
 .results th{background:#eef2ff;color:#4338ca;font-weight:700;position:sticky;top:0}
 .results tr:nth-child(even) td{background:#f8fafc}
 .msg{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;color:#475569;white-space:pre-wrap}
 .msg.err{color:#dc2626}
 .msg.ok{color:#059669}
 footer{padding:8px 14px;background:#f1f5f9;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b}
</style></head><body>
<div class="app">
 <header>
  <h1><span></span> SQL Practice Editor</h1>
  <div class="grow"></div>
  <select id="samples">
   <option value="">Sample queries…</option>
   <option value="select">SELECT * FROM students</option>
   <option value="join">JOIN students + grades</option>
   <option value="agg">GROUP BY / AVG</option>
   <option value="create">CREATE TABLE + INSERT</option>
  </select>
  <button id="run" class="primary">▶ Run (Ctrl+Enter)</button>
  <button id="reset">↺ Reset DB</button>
  <button id="clear">✕ Clear</button>
 </header>
 <div class="work">
  <textarea id="src" spellcheck="false"></textarea>
  <div class="results" id="out"><div class="msg">Loading SQL engine…</div></div>
 </div>
 <footer>SQLite (via sql.js) running fully in your browser. Data resets on reload.</footer>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js"></script>
<script>
const KEY='avartan.sqlEditor.v1';
const SEED=\`-- Welcome to the SQL Practice Editor
-- Try: SELECT * FROM students;

SELECT s.name, s.grade, g.subject, g.score
FROM students s
JOIN grades g ON g.student_id = s.id
ORDER BY s.name;\`;
const SAMPLES={
 select:'SELECT * FROM students;',
 join:'SELECT s.name, g.subject, g.score\\nFROM students s JOIN grades g ON g.student_id=s.id;',
 agg:'SELECT subject, AVG(score) AS avg_score, COUNT(*) AS n\\nFROM grades GROUP BY subject;',
 create:'CREATE TABLE books(id INTEGER PRIMARY KEY, title TEXT, author TEXT);\\nINSERT INTO books VALUES (1,"1984","Orwell"),(2,"Dune","Herbert");\\nSELECT * FROM books;'
};
const src=document.getElementById('src'),out=document.getElementById('out');
src.value=localStorage.getItem(KEY)||SEED;
src.addEventListener('input',()=>localStorage.setItem(KEY,src.value));
src.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run()}if(e.key==='Tab'){e.preventDefault();const s=src.selectionStart,en=src.selectionEnd;src.value=src.value.slice(0,s)+'  '+src.value.slice(en);src.selectionStart=src.selectionEnd=s+2}});
let db,SQL;
function seed(){db.run(\`
  CREATE TABLE students(id INTEGER PRIMARY KEY, name TEXT, grade INTEGER);
  INSERT INTO students VALUES (1,'Aarav',8),(2,'Diya',9),(3,'Kabir',8),(4,'Mira',10),(5,'Rohan',9);
  CREATE TABLE grades(id INTEGER PRIMARY KEY, student_id INTEGER, subject TEXT, score INTEGER);
  INSERT INTO grades VALUES (1,1,'Math',88),(2,1,'Science',92),(3,2,'Math',75),(4,2,'English',81),(5,3,'Math',95),(6,3,'Science',89),(7,4,'Math',70),(8,4,'English',85),(9,5,'Science',77),(10,5,'English',90);
\`)}
function renderRes(res){out.innerHTML='';if(!res||!res.length){out.innerHTML='<div class="msg ok">✓ Query executed. No rows returned.</div>';return}res.forEach(r=>{const t=document.createElement('table');const th=document.createElement('tr');r.columns.forEach(c=>{const x=document.createElement('th');x.textContent=c;th.appendChild(x)});t.appendChild(th);r.values.forEach(row=>{const tr=document.createElement('tr');row.forEach(v=>{const td=document.createElement('td');td.textContent=v===null?'NULL':v;tr.appendChild(td)});t.appendChild(tr)});out.appendChild(t);const c=document.createElement('div');c.className='msg ok';c.textContent='✓ '+r.values.length+' row(s)';out.appendChild(c)})}
function run(){if(!db){out.innerHTML='<div class="msg">Engine not ready…</div>';return}try{const res=db.exec(src.value);renderRes(res)}catch(err){out.innerHTML='<div class="msg err">✗ '+err.message+'</div>'}}
document.getElementById('run').onclick=run;
document.getElementById('clear').onclick=()=>{out.innerHTML='<div class="msg">Cleared.</div>'};
document.getElementById('reset').onclick=()=>{if(!confirm('Reset database to seed data?'))return;db=new SQL.Database();seed();out.innerHTML='<div class="msg ok">✓ Database reset.</div>'};
document.getElementById('samples').onchange=e=>{const v=e.target.value;if(v&&SAMPLES[v]){src.value=SAMPLES[v];localStorage.setItem(KEY,src.value);run()}e.target.value=''};
initSqlJs({locateFile:f=>'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/'+f}).then(S=>{SQL=S;db=new SQL.Database();seed();out.innerHTML='<div class="msg ok">✓ SQL engine ready. Press ▶ Run or Ctrl+Enter.</div>'}).catch(err=>{out.innerHTML='<div class="msg err">Failed to load SQL engine: '+err.message+'</div>'});
</script>
</body></html>`;

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
  custom?: "univer-sheet" | "univer-doc";
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
    title: "SQL Editor",
    subtitle: "Practice SQL against a live in-browser database",
    badge: "SQL",
    srcDoc: SQL_SRC_DOC,
    caption:
      "Self-contained SQLite engine (sql.js) — seeded with students + grades tables. Press ▶ Run or Ctrl+Enter.",
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
    title: "Word Document",
    subtitle: "Full Word-style ribbon: Home / Insert / Layout / Review",
    badge: "Doc",
    srcDoc: WORD_RIBBON_SRC_DOC,
    caption:
      "Self-contained Word-style editor — ribbon tabs, font styles, tables, pictures, margins, word count, print & .doc export. Runs 100% in your browser.",
  },
  spreadsheet: {
    title: "Excel Workbook",
    subtitle: "Luckysheet — Excel-style ribbon, formulas, sheet tabs & formatting",
    badge: "Sheets",
    srcDoc: SHEET_LUCKYSHEET_SRC_DOC,
    caption:
      "Powered by Luckysheet — Excel-compatible ribbon, formula bar, cell formatting, multiple sheets, all in-browser.",
  },
  presentation: {
    title: "PowerPoint Editor",
    subtitle: "PowerPoint-style ribbon, slide thumbnails, present mode",
    badge: "Slides",
    srcDoc: SLIDES_EDITOR_SRC_DOC,
    caption:
      "Real ribbon toolbar (Home / Insert / Design / Slide Show), editable text boxes, image & shape insert, full-screen present mode with keyboard nav.",
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
      {config.custom === "univer-sheet" || config.custom === "univer-doc" ? (
        <ClientOnly
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-white text-sm text-slate-500">
              Loading editor engine…
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-white text-sm text-slate-500">
                Loading editor engine…
              </div>
            }
          >
            {config.custom === "univer-sheet" ? <UniverSheet /> : <UniverDoc />}
          </Suspense>
        </ClientOnly>
      ) : (
        <LiveFrame src={config.src} srcDoc={config.srcDoc} title={config.title} />
      )}
    </EditorWrapper>
  );
}

export function isLiveEditor(slug: string): slug is EditorSlug {
  return slug in EDITOR_REGISTRY;
}