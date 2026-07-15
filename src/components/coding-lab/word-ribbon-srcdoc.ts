// Self-contained Word-style editor with a real ribbon (Home / Insert / Layout / Review).
// Uses contentEditable + document.execCommand — works fully offline inside an iframe.

export const WORD_RIBBON_SRC_DOC = `<!doctype html><html><head><meta charset="utf-8">
<title>Word Document</title>
<style>
 :root{color-scheme:light}
 *{box-sizing:border-box}
 html,body{margin:0;height:100%;font-family:'Segoe UI',Inter,system-ui,sans-serif;background:#f3f2f1;color:#201f1e;overflow:hidden}
 .app{display:flex;flex-direction:column;height:100vh}
 .titlebar{background:#2b579a;color:#fff;padding:6px 14px;font-size:12px;display:flex;align-items:center;gap:10px}
 .titlebar .dot{width:8px;height:8px;border-radius:99px;background:#fff}
 .tabs{display:flex;gap:2px;background:#2b579a;padding:0 8px}
 .tabs button{background:transparent;border:0;color:#e6edf7;font:inherit;font-size:12px;padding:8px 16px;cursor:pointer;border-radius:6px 6px 0 0}
 .tabs button.active{background:#f3f2f1;color:#2b579a;font-weight:600}
 .ribbon{background:#f3f2f1;border-bottom:1px solid #d1d1d1;display:flex;flex-wrap:wrap;gap:14px;padding:8px 14px;min-height:78px}
 .group{display:flex;flex-direction:column;gap:4px;padding:2px 10px 0 0;border-right:1px solid #e1dfdd}
 .group:last-child{border-right:0}
 .grow{flex:1 1 auto;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
 .grpname{font-size:10px;color:#605e5c;text-align:center;margin-top:auto}
 .btn{background:transparent;border:1px solid transparent;border-radius:4px;padding:5px 8px;font:inherit;font-size:13px;color:#201f1e;cursor:pointer;min-width:32px}
 .btn:hover{background:#e1efff;border-color:#c7d9ee}
 .btn:active{background:#c7d9ee}
 .btn b,.btn i,.btn u,.btn s{font-size:14px}
 select.sel{border:1px solid #c8c6c4;border-radius:3px;background:#fff;font:inherit;font-size:12px;padding:3px 6px;height:26px}
 input[type=color]{width:26px;height:26px;padding:0;border:1px solid #c8c6c4;border-radius:3px;background:#fff;cursor:pointer}
 .ribbon.hidden{display:none}
 .doc{flex:1;overflow:auto;display:flex;justify-content:center;padding:24px;background:#e6e6e6}
 .page{background:#fff;width:min(816px,100%);min-height:1056px;padding:96px;box-shadow:0 4px 18px rgba(0,0,0,.15);outline:none;line-height:1.6;font-size:14px;color:#000}
 .page:focus{box-shadow:0 4px 24px rgba(43,87,154,.35)}
 .statusbar{background:#2b579a;color:#e6edf7;font-size:11px;padding:4px 14px;display:flex;gap:14px}
 .statusbar b{color:#fff}
</style></head><body>
<div class="app">
 <div class="titlebar"><span class="dot"></span> <b>Document1</b> — Word Workspace <span style="margin-left:auto;opacity:.8">Autosaved locally</span></div>
 <div class="tabs">
  <button data-tab="home" class="active">Home</button>
  <button data-tab="insert">Insert</button>
  <button data-tab="layout">Layout</button>
  <button data-tab="review">Review</button>
 </div>

 <!-- HOME -->
 <div class="ribbon" data-panel="home">
  <div class="group">
   <div class="grow">
    <button class="btn" title="Undo" onclick="cmd('undo')">↶</button>
    <button class="btn" title="Redo" onclick="cmd('redo')">↷</button>
   </div><div class="grpname">Clipboard</div>
  </div>
  <div class="group">
   <div class="grow">
    <select class="sel" onchange="cmd('fontName',this.value)" title="Font">
     <option>Calibri</option><option>Arial</option><option>Georgia</option>
     <option>Times New Roman</option><option>Courier New</option><option>Verdana</option>
    </select>
    <select class="sel" onchange="cmd('fontSize',this.value)" title="Size">
     <option value="1">8</option><option value="2">10</option><option value="3" selected>12</option>
     <option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">36</option>
    </select>
   </div>
   <div class="grow">
    <button class="btn" onclick="cmd('bold')"><b>B</b></button>
    <button class="btn" onclick="cmd('italic')"><i>I</i></button>
    <button class="btn" onclick="cmd('underline')"><u>U</u></button>
    <button class="btn" onclick="cmd('strikeThrough')"><s>S</s></button>
    <button class="btn" onclick="cmd('subscript')">X₂</button>
    <button class="btn" onclick="cmd('superscript')">X²</button>
    <input type="color" title="Font color" oninput="cmd('foreColor',this.value)">
    <input type="color" title="Highlight" oninput="cmd('hiliteColor',this.value)" value="#ffff00">
   </div><div class="grpname">Font</div>
  </div>
  <div class="group">
   <div class="grow">
    <button class="btn" onclick="cmd('insertUnorderedList')">• List</button>
    <button class="btn" onclick="cmd('insertOrderedList')">1. List</button>
    <button class="btn" onclick="cmd('outdent')">⇤</button>
    <button class="btn" onclick="cmd('indent')">⇥</button>
   </div>
   <div class="grow">
    <button class="btn" onclick="cmd('justifyLeft')">⯇</button>
    <button class="btn" onclick="cmd('justifyCenter')">≡</button>
    <button class="btn" onclick="cmd('justifyRight')">⯈</button>
    <button class="btn" onclick="cmd('justifyFull')">☰</button>
   </div><div class="grpname">Paragraph</div>
  </div>
  <div class="group">
   <div class="grow">
    <select class="sel" onchange="cmd('formatBlock',this.value);this.value=''" title="Styles">
     <option value="">Styles</option>
     <option value="P">Normal</option>
     <option value="H1">Heading 1</option>
     <option value="H2">Heading 2</option>
     <option value="H3">Heading 3</option>
     <option value="BLOCKQUOTE">Quote</option>
     <option value="PRE">Code</option>
    </select>
    <button class="btn" onclick="cmd('removeFormat')">Clear</button>
   </div><div class="grpname">Styles</div>
  </div>
 </div>

 <!-- INSERT -->
 <div class="ribbon hidden" data-panel="insert">
  <div class="group">
   <div class="grow">
    <button class="btn" onclick="insertTable()">▦ Table</button>
    <button class="btn" onclick="insertImage()">🖼 Picture</button>
    <button class="btn" onclick="insertLink()">🔗 Link</button>
    <button class="btn" onclick="cmd('insertHorizontalRule')">— Line</button>
    <button class="btn" onclick="insertHTML('&lt;br&gt;&lt;br&gt;')">↵ Break</button>
   </div><div class="grpname">Insert</div>
  </div>
  <div class="group">
   <div class="grow">
    <button class="btn" onclick="insertHTML('© ')">©</button>
    <button class="btn" onclick="insertHTML('® ')">®</button>
    <button class="btn" onclick="insertHTML('™ ')">™</button>
    <button class="btn" onclick="insertHTML('— ')">— em dash</button>
    <button class="btn" onclick="insertHTML(new Date().toLocaleDateString())">📅 Date</button>
   </div><div class="grpname">Symbols</div>
  </div>
 </div>

 <!-- LAYOUT -->
 <div class="ribbon hidden" data-panel="layout">
  <div class="group">
   <div class="grow">
    <button class="btn" onclick="setMargin(48)">Narrow</button>
    <button class="btn" onclick="setMargin(96)">Normal</button>
    <button class="btn" onclick="setMargin(144)">Wide</button>
   </div><div class="grpname">Margins</div>
  </div>
  <div class="group">
   <div class="grow">
    <button class="btn" onclick="setLine(1.2)">Single</button>
    <button class="btn" onclick="setLine(1.5)">1.5</button>
    <button class="btn" onclick="setLine(2)">Double</button>
   </div><div class="grpname">Line spacing</div>
  </div>
 </div>

 <!-- REVIEW -->
 <div class="ribbon hidden" data-panel="review">
  <div class="group">
   <div class="grow">
    <button class="btn" onclick="wordCount()">🔎 Word count</button>
    <button class="btn" onclick="findReplace()">🔁 Find &amp; Replace</button>
    <button class="btn" onclick="printDoc()">🖨 Print</button>
    <button class="btn" onclick="downloadDoc()">⬇ Download .doc</button>
   </div><div class="grpname">Review</div>
  </div>
 </div>

 <div class="doc"><div class="page" id="page" contenteditable="true" spellcheck="true">
  <h1 style="color:#2b579a">Welcome to your Word Workspace</h1>
  <p>Use the ribbon above to format text, insert tables, pictures, links, or change margins and line spacing. Everything runs entirely in your browser — nothing is uploaded.</p>
  <ul><li>Try <b>Bold</b>, <i>Italic</i>, <u>Underline</u>.</li><li>Insert a table or picture from the <b>Insert</b> tab.</li><li>Download your work as a <b>.doc</b> from the <b>Review</b> tab.</li></ul>
 </div></div>

 <div class="statusbar"><span>Page <b>1</b> of 1</span><span id="wc">Words: 0</span><span style="margin-left:auto">100%</span></div>
</div>
<script>
 const page=document.getElementById('page');
 function cmd(c,v){document.execCommand(c,false,v);page.focus()}
 function insertHTML(h){document.execCommand('insertHTML',false,h);page.focus()}
 function insertLink(){const u=prompt('Link URL');if(u)cmd('createLink',u)}
 function insertImage(){const u=prompt('Image URL');if(u)insertHTML('<img src="'+u+'" style="max-width:100%">')}
 function insertTable(){const r=+prompt('Rows',3)||3;const c=+prompt('Columns',3)||3;let h='<table border="1" style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>';for(let i=0;i<r;i++){h+='<tr>';for(let j=0;j<c;j++)h+='<td style="padding:6px;border:1px solid #999">&nbsp;</td>';h+='</tr>'}h+='</tbody></table>';insertHTML(h)}
 function setMargin(px){page.style.padding=px+'px'}
 function setLine(x){page.style.lineHeight=x}
 function wordCount(){const t=(page.innerText||'').trim();alert('Words: '+(t?t.split(/\\s+/).length:0)+'\\nCharacters: '+t.length)}
 function findReplace(){const f=prompt('Find');if(!f)return;const r=prompt('Replace with','');page.innerHTML=page.innerHTML.split(f).join(r??'')}
 function printDoc(){const w=window.open('','_blank');w.document.write('<html><head><title>Document</title></head><body>'+page.innerHTML+'</body></html>');w.document.close();w.print()}
 function downloadDoc(){const html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Document</title></head><body>'+page.innerHTML+'</body></html>';const blob=new Blob(['\\ufeff',html],{type:'application/msword'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='document.doc';a.click()}
 function updateWc(){const t=(page.innerText||'').trim();document.getElementById('wc').textContent='Words: '+(t?t.split(/\\s+/).length:0)}
 page.addEventListener('input',()=>{updateWc();try{localStorage.setItem('wordDoc',page.innerHTML)}catch(_){}});
 try{const s=localStorage.getItem('wordDoc');if(s)page.innerHTML=s}catch(_){}
 updateWc();
 document.querySelectorAll('.tabs button').forEach(b=>{b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.querySelectorAll('.ribbon').forEach(p=>p.classList.add('hidden'));
  document.querySelector('[data-panel="'+b.dataset.tab+'"]').classList.remove('hidden');
 })});
</script>
</body></html>`;