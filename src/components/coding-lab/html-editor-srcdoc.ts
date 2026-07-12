// Self-contained HTML/CSS/JS live editor served via iframe srcDoc.
// Three code panes (HTML, CSS, JS) + live preview with auto-refresh, run,
// reset, download, and console output capture.
export const HTML_EDITOR_SRC_DOC = String.raw`<!doctype html><html><head><meta charset="utf-8"><title>HTML Live Editor</title>
<style>
 :root{color-scheme:dark}
 *{box-sizing:border-box}
 html,body{margin:0;height:100%;font-family:Inter,system-ui,sans-serif;background:#0b1020;color:#e2e8f0;overflow:hidden}
 .app{display:grid;grid-template-rows:auto 1fr;height:100vh}
 header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:linear-gradient(90deg,#0f172a,#1e1b4b,#0f172a);border-bottom:1px solid #1e293b}
 header h1{margin:0;font-size:13px;font-weight:700;letter-spacing:.02em;color:#c7d2fe;display:flex;align-items:center;gap:8px}
 header h1 span{display:inline-block;width:8px;height:8px;border-radius:99px;background:#22d3ee;box-shadow:0 0 10px #22d3ee}
 header .grow{flex:1}
 header button{font:inherit;font-size:12px;font-weight:600;padding:7px 12px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;border-radius:9px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px}
 header button:hover{background:#1e1b4b;border-color:#6366f1;color:#c7d2fe;transform:translateY(-1px)}
 header button.primary{background:linear-gradient(135deg,#4f46e5,#7c3aed);border-color:#6366f1;color:#fff;box-shadow:0 6px 20px -6px rgba(99,102,241,.6)}
 header label{font-size:11px;color:#94a3b8;display:inline-flex;align-items:center;gap:6px;cursor:pointer}
 .workspace{display:grid;grid-template-columns:1fr 1fr;min-height:0}
 .editors{display:grid;grid-template-rows:auto 1fr auto 1fr auto 1fr;background:#0b1020;border-right:1px solid #1e293b;min-height:0}
 .tab{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#0f172a;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}
 .tab .dot{width:8px;height:8px;border-radius:99px;margin-right:6px;display:inline-block;vertical-align:middle}
 .tab.html .dot{background:#f97316}
 .tab.css  .dot{background:#38bdf8}
 .tab.js   .dot{background:#facc15}
 textarea{border:0;outline:0;resize:none;width:100%;height:100%;padding:12px 14px;font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.55;background:#0b1020;color:#e2e8f0;tab-size:2;caret-color:#a5b4fc}
 textarea:focus{background:#0d1330}
 .preview{display:grid;grid-template-rows:1fr auto;min-height:0;background:#020617}
 .frame{position:relative;background:#fff}
 .frame iframe{width:100%;height:100%;border:0;display:block;background:#fff}
 .console{background:#050b1e;border-top:1px solid #1e293b;color:#cbd5e1;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;max-height:180px;overflow:auto}
 .console .row{padding:5px 12px;border-bottom:1px solid #0f172a;white-space:pre-wrap;word-break:break-word}
 .console .row.err{color:#fca5a5;background:rgba(239,68,68,.06)}
 .console .row.warn{color:#fcd34d}
 .console .row.log{color:#a5b4fc}
 .console-head{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#0f172a;border-top:1px solid #1e293b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}
 .console-head button{font:inherit;font-size:11px;padding:4px 8px;border:1px solid #334155;background:transparent;color:#94a3b8;border-radius:6px;cursor:pointer}
 .console-head button:hover{color:#fff;border-color:#6366f1}
 @media (max-width:900px){.workspace{grid-template-columns:1fr;grid-template-rows:1fr 1fr}}
</style></head><body>
<div class="app">
 <header>
  <h1><span></span> HTML · CSS · JS Live Editor</h1>
  <div class="grow"></div>
  <label><input type="checkbox" id="auto" checked> Auto-run</label>
  <button id="run" class="primary">▶ Run</button>
  <button id="reset">↺ Reset</button>
  <button id="download">⤓ Download</button>
 </header>
 <div class="workspace">
  <div class="editors">
   <div class="tab html"><div><span class="dot"></span>index.html</div><span>HTML</span></div>
   <textarea id="html" spellcheck="false"></textarea>
   <div class="tab css"><div><span class="dot"></span>styles.css</div><span>CSS</span></div>
   <textarea id="css" spellcheck="false"></textarea>
   <div class="tab js"><div><span class="dot"></span>script.js</div><span>JS</span></div>
   <textarea id="js" spellcheck="false"></textarea>
  </div>
  <div class="preview">
   <div class="frame"><iframe id="out" sandbox="allow-scripts allow-modals allow-forms allow-popups"></iframe></div>
   <div>
    <div class="console-head"><span>Console</span><button id="clear">Clear</button></div>
    <div id="console" class="console"></div>
   </div>
  </div>
 </div>
</div>
<script>
const DEFAULT_HTML = '<!doctype html>\n<html>\n<body>\n  <h1>Hello, Avartan!</h1>\n  <p>Edit HTML, CSS and JS on the left. Preview updates instantly.</p>\n  <button id="btn">Click me</button>\n</body>\n</html>';
const DEFAULT_CSS  = 'body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;min-height:100vh;margin:0;padding:3rem;display:flex;flex-direction:column;gap:1rem;align-items:flex-start}\nh1{font-size:2.4rem;margin:0}\nbutton{padding:.75rem 1.25rem;border:0;border-radius:12px;background:#fff;color:#4338ca;font-weight:700;cursor:pointer;box-shadow:0 10px 30px -10px rgba(0,0,0,.4)}\nbutton:hover{transform:translateY(-1px)}';
const DEFAULT_JS   = 'document.getElementById("btn").addEventListener("click",()=>{\n  console.log("Button clicked at", new Date().toLocaleTimeString());\n  alert("Hello from your live JavaScript!");\n});';
const KEY='avartan.htmlEditor.v1';
const $=id=>document.getElementById(id);
const html=$('html'),css=$('css'),js=$('js'),out=$('out'),con=$('console'),auto=$('auto');
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){html.value=s.h;css.value=s.c;js.value=s.j;return}}catch(e){}html.value=DEFAULT_HTML;css.value=DEFAULT_CSS;js.value=DEFAULT_JS}
function save(){localStorage.setItem(KEY,JSON.stringify({h:html.value,c:css.value,j:js.value}))}
function log(kind,args){const r=document.createElement('div');r.className='row '+kind;r.textContent=args.map(a=>typeof a==='object'?JSON.stringify(a,null,2):String(a)).join(' ');con.appendChild(r);con.scrollTop=con.scrollHeight}
window.addEventListener('message',e=>{const d=e.data;if(!d||d.__src!=='avartan')return;log(d.kind,d.args)});
function build(){
 const hookedJs='(function(){\nconst _p=(k,a)=>parent.postMessage({__src:"avartan",kind:k,args:Array.from(a).map(v=>{try{return v && v.stack ? String(v)+"\\n"+v.stack : v}catch(e){return String(v)}})} ,"*");\n["log","warn","error","info"].forEach(m=>{const o=console[m];console[m]=function(){_p(m==="error"?"err":m==="warn"?"warn":"log",arguments);o.apply(console,arguments)}});\nwindow.addEventListener("error",e=>_p("err",[e.message+" @ line "+e.lineno]));\nwindow.addEventListener("unhandledrejection",e=>_p("err",["Unhandled: "+(e.reason && e.reason.message || e.reason)]));\ntry{\n'+js.value+'\n}catch(e){_p("err",[e.message])}\n})();';
 const doc='<!doctype html><html><head><meta charset="utf-8"><style>'+css.value+'</style></head><body>'+ (html.value.replace(/^[\s\S]*<body[^>]*>|<\/body>[\s\S]*$/gi,'') || html.value) +'<script>'+hookedJs+'<\/script></body></html>';
 out.srcdoc=doc;save()
}
function debounce(fn,ms){let t;return()=>{clearTimeout(t);t=setTimeout(fn,ms)}}
const auto_build=debounce(()=>{if(auto.checked)build()},350);
[html,css,js].forEach(t=>t.addEventListener('input',auto_build));
[html,css,js].forEach(t=>t.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=t.selectionStart,en=t.selectionEnd;t.value=t.value.slice(0,s)+'  '+t.value.slice(en);t.selectionStart=t.selectionEnd=s+2}}));
$('run').addEventListener('click',()=>{con.innerHTML='';build()});
$('reset').addEventListener('click',()=>{if(!confirm('Reset all code to the starter template?'))return;localStorage.removeItem(KEY);html.value=DEFAULT_HTML;css.value=DEFAULT_CSS;js.value=DEFAULT_JS;con.innerHTML='';build()});
$('clear').addEventListener('click',()=>{con.innerHTML=''});
$('download').addEventListener('click',()=>{const blob=new Blob(['<!doctype html><html><head><meta charset="utf-8"><style>'+css.value+'</style></head><body>'+html.value+'<script>'+js.value+'<\/script></body></html>'],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='avartan-project.html';a.click()});
load();build();
</script>
</body></html>`;
