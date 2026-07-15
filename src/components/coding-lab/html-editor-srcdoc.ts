// Self-contained HTML/CSS/JS live editor served via iframe srcDoc.
// Three code panes (HTML, CSS, JS) + live preview with auto-refresh, run,
// reset, download, and console output capture.
// Minimal, dependable HTML live editor: single HTML pane on the left,
// live iframe preview on the right. Auto-refresh, Run, Reset, Download.
export const HTML_EDITOR_SRC_DOC = String.raw`<!doctype html><html><head><meta charset="utf-8"><title>HTML Live Editor</title>
<style>
 :root{color-scheme:light}
 *{box-sizing:border-box}
 html,body{margin:0;height:100%;font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a;overflow:hidden}
 .app{display:grid;grid-template-rows:auto 1fr;height:100vh}
 header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:#fff;border-bottom:1px solid #e2e8f0}
 header h1{margin:0;font-size:13px;font-weight:700;color:#4338ca;display:flex;align-items:center;gap:8px}
 header h1 span{display:inline-block;width:8px;height:8px;border-radius:99px;background:#4f46e5}
 header .grow{flex:1}
 header button{font:inherit;font-size:12px;font-weight:600;padding:7px 12px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:8px;cursor:pointer}
 header button:hover{background:#eef2ff;border-color:#6366f1;color:#4338ca}
 header button.primary{background:linear-gradient(135deg,#4f46e5,#7c3aed);border:0;color:#fff}
 .work{display:grid;grid-template-columns:1fr 1fr;min-height:0}
 textarea{border:0;outline:0;resize:none;width:100%;height:100%;padding:14px 16px;font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;font-size:13.5px;line-height:1.6;background:#0b1020;color:#e2e8f0;tab-size:2;caret-color:#a5b4fc}
 iframe{width:100%;height:100%;border:0;background:#fff}
 @media (max-width:900px){.work{grid-template-columns:1fr;grid-template-rows:1fr 1fr}}
</style></head><body>
<div class="app">
 <header>
  <h1><span></span> HTML Live Editor</h1>
  <div class="grow"></div>
  <button id="run" class="primary">▶ Run</button>
  <button id="reset">↺ Reset</button>
  <button id="download">⤓ Download</button>
 </header>
 <div class="work">
  <textarea id="src" spellcheck="false"></textarea>
  <iframe id="out" sandbox="allow-scripts allow-modals allow-forms allow-popups"></iframe>
 </div>
</div>
<script>
const DEFAULT = '<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>My page</title>\n<style>\n  body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;min-height:100vh;margin:0;padding:3rem;display:flex;flex-direction:column;gap:1rem;align-items:flex-start}\n  h1{font-size:2.4rem;margin:0}\n  button{padding:.75rem 1.25rem;border:0;border-radius:12px;background:#fff;color:#4338ca;font-weight:700;cursor:pointer}\n</style>\n</head>\n<body>\n  <h1>Hello, Avartan!</h1>\n  <p>Edit the HTML on the left. Preview updates instantly.</p>\n  <button onclick="alert(\'Hi!\')">Click me</button>\n</body>\n</html>';
const KEY='avartan.htmlEditor.simple.v1';
const src=document.getElementById('src'),out=document.getElementById('out');
src.value=localStorage.getItem(KEY)||DEFAULT;
function build(){out.srcdoc=src.value;localStorage.setItem(KEY,src.value)}
let t;src.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(build,300)});
src.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=src.selectionStart,en=src.selectionEnd;src.value=src.value.slice(0,s)+'  '+src.value.slice(en);src.selectionStart=src.selectionEnd=s+2}});
document.getElementById('run').onclick=build;
document.getElementById('reset').onclick=()=>{if(!confirm('Reset code?'))return;localStorage.removeItem(KEY);src.value=DEFAULT;build()};
document.getElementById('download').onclick=()=>{const b=new Blob([src.value],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='page.html';a.click()};
build();
</script>
</body></html>`;
