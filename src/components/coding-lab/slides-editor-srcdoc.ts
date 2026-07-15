// Self-contained PowerPoint-style slide editor. Real ribbon toolbar,
// slide thumbnails on the left, editable canvas with contenteditable
// text boxes, and a full-screen present mode. Everything ships inside
// one iframe srcdoc — no external services, no third-party embeds.

export const SLIDES_EDITOR_SRC_DOC = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>PowerPoint Editor</title>
<style>
  :root{
    --ppt-orange:#b7472a; --ppt-red:#c43e1c;
    --chrome:#f3f2f1; --chrome-dark:#e1dfdd; --ink:#242424; --muted:#605e5c;
    --ribbon:#faf9f8; --accent:#c43e1c; --border:#d1d1d1;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;font-family:'Segoe UI',-apple-system,Roboto,Arial,sans-serif;background:#edebe9;color:var(--ink);overflow:hidden}
  .titlebar{height:32px;background:var(--ppt-red);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;letter-spacing:.3px}
  .titlebar .brand{display:flex;align-items:center;gap:8px}
  .titlebar .brand::before{content:'P';display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#fff;color:var(--ppt-red);border-radius:2px;font-weight:800}
  .menubar{display:flex;gap:0;background:var(--ribbon);border-bottom:1px solid var(--border);padding:0 12px;height:30px;align-items:center;font-size:13px}
  .menubar .mi{padding:6px 12px;cursor:default;color:var(--ink);border-bottom:2px solid transparent}
  .menubar .mi.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}
  .menubar .mi:hover:not(.active){background:#efedeb}
  .ribbon{background:var(--ribbon);border-bottom:1px solid var(--border);padding:6px 10px;display:flex;gap:14px;align-items:stretch;overflow-x:auto}
  .group{display:flex;flex-direction:column;align-items:center;padding:0 10px;border-right:1px solid #e6e4e2;min-width:70px}
  .group .row{display:flex;gap:4px;align-items:center;flex:1}
  .group .lbl{font-size:11px;color:var(--muted);margin-top:2px}
  .btn{background:transparent;border:1px solid transparent;border-radius:4px;padding:5px 8px;cursor:pointer;font-size:13px;color:var(--ink);display:inline-flex;align-items:center;gap:4px;min-height:28px}
  .btn:hover{background:#e8e6e4;border-color:#d1d1d1}
  .btn:active{background:#dcdad8}
  .btn.primary{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600;padding:6px 14px}
  .btn.primary:hover{background:#a03216}
  .btn.big{flex-direction:column;padding:4px 10px;min-height:56px;font-size:11px;gap:2px}
  .btn.big .ico{font-size:20px}
  select.btn{padding:4px 6px}
  input[type=color]{width:28px;height:24px;border:1px solid #d1d1d1;border-radius:4px;background:#fff;cursor:pointer;padding:0}
  .main{display:flex;height:calc(100% - 32px - 30px - 96px - 24px)}
  .sidebar{width:180px;background:#fafafa;border-right:1px solid var(--border);overflow-y:auto;padding:8px}
  .thumb{background:#fff;border:2px solid transparent;border-radius:4px;margin-bottom:8px;padding:6px;cursor:pointer;position:relative;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  .thumb.active{border-color:var(--accent);box-shadow:0 0 0 2px rgba(196,62,28,.2)}
  .thumb .num{position:absolute;left:-4px;top:2px;font-size:11px;color:var(--muted);width:16px;text-align:right}
  .thumb .mini{margin-left:14px;aspect-ratio:16/9;background:#fff;border:1px solid #e1dfdd;border-radius:2px;padding:6px;font-size:9px;overflow:hidden;color:#333;line-height:1.2}
  .thumb .mini h4{margin:0 0 3px 0;font-size:10px;color:#111;font-weight:700}
  .stage{flex:1;background:#605e5c;display:flex;align-items:center;justify-content:center;overflow:auto;padding:20px}
  .slide{background:#fff;width:min(960px,calc(100% - 40px));aspect-ratio:16/9;box-shadow:0 8px 30px rgba(0,0,0,.35);position:relative;overflow:hidden}
  .slide [contenteditable]{outline:none;padding:6px;border-radius:4px}
  .slide [contenteditable]:focus{outline:2px solid var(--accent);outline-offset:2px;background:rgba(196,62,28,.03)}
  .slide h1{margin:0;padding:6px}
  .slide h2{margin:0;padding:6px}
  .slide .box{position:absolute;padding:20px}
  .statusbar{height:24px;background:var(--ribbon);border-top:1px solid var(--border);display:flex;align-items:center;padding:0 12px;font-size:12px;color:var(--muted);gap:16px}
  .statusbar .spacer{flex:1}
  /* Present mode */
  body.presenting{background:#000}
  body.presenting .titlebar,body.presenting .menubar,body.presenting .ribbon,body.presenting .sidebar,body.presenting .statusbar{display:none!important}
  body.presenting .main{height:100vh}
  body.presenting .stage{padding:0;background:#000}
  body.presenting .slide{width:100vw;height:100vh;aspect-ratio:auto;box-shadow:none}
</style>
</head>
<body>
  <div class="titlebar"><span class="brand">Presentation — Avartan PowerPoint</span></div>
  <div class="menubar">
    <div class="mi">File</div>
    <div class="mi active">Home</div>
    <div class="mi">Insert</div>
    <div class="mi">Design</div>
    <div class="mi">Transitions</div>
    <div class="mi">Animations</div>
    <div class="mi">Slide Show</div>
    <div class="mi">Review</div>
    <div class="mi">View</div>
  </div>
  <div class="ribbon">
    <div class="group">
      <div class="row">
        <button class="btn big" data-act="new"><span class="ico">➕</span>New Slide</button>
        <button class="btn big" data-act="dup"><span class="ico">📑</span>Duplicate</button>
        <button class="btn big" data-act="del"><span class="ico">🗑</span>Delete</button>
      </div>
      <div class="lbl">Slides</div>
    </div>
    <div class="group">
      <div class="row">
        <select class="btn" id="font">
          <option>Calibri</option><option>Segoe UI</option><option>Arial</option>
          <option>Georgia</option><option>Times New Roman</option><option>Courier New</option>
        </select>
        <select class="btn" id="size">
          <option>12</option><option>14</option><option>18</option><option>24</option>
          <option selected>32</option><option>44</option><option>60</option><option>80</option>
        </select>
      </div>
      <div class="row" style="margin-top:4px">
        <button class="btn" data-cmd="bold" title="Bold"><b>B</b></button>
        <button class="btn" data-cmd="italic" title="Italic"><i>I</i></button>
        <button class="btn" data-cmd="underline" title="Underline"><u>U</u></button>
        <input type="color" id="fc" title="Font color" value="#242424" />
      </div>
      <div class="lbl">Font</div>
    </div>
    <div class="group">
      <div class="row">
        <button class="btn" data-cmd="justifyLeft" title="Align left">⬅</button>
        <button class="btn" data-cmd="justifyCenter" title="Center">↔</button>
        <button class="btn" data-cmd="justifyRight" title="Align right">➡</button>
        <button class="btn" data-cmd="insertUnorderedList" title="Bullets">• ≡</button>
      </div>
      <div class="lbl">Paragraph</div>
    </div>
    <div class="group">
      <div class="row">
        <button class="btn big" data-act="text"><span class="ico">🅣</span>Text Box</button>
        <button class="btn big" data-act="image"><span class="ico">🖼</span>Picture</button>
        <button class="btn big" data-act="shape"><span class="ico">⬛</span>Shape</button>
      </div>
      <div class="lbl">Insert</div>
    </div>
    <div class="group" style="border-right:none;margin-left:auto">
      <div class="row">
        <button class="btn primary" data-act="present">▶ Start Slide Show</button>
      </div>
      <div class="lbl">Present</div>
    </div>
  </div>
  <div class="main">
    <div class="sidebar" id="thumbs"></div>
    <div class="stage"><div class="slide" id="slide"></div></div>
  </div>
  <div class="statusbar"><span id="pos">Slide 1 of 1</span><span class="spacer"></span><span>English (US)</span><span>100%</span></div>
<script>
(function(){
  const uid = () => Math.random().toString(36).slice(2,9);
  const seed = () => ([
    { id:uid(), bg:'linear-gradient(135deg,#c43e1c,#7a1e07)', color:'#fff', boxes:[
      { x:'8%', y:'32%', w:'84%', tag:'h1', style:'font-size:64px;font-weight:800;letter-spacing:-1px', html:'Welcome to Avartan Skill Lab' },
      { x:'8%', y:'58%', w:'84%', tag:'div', style:'font-size:26px;opacity:.9', html:'A world-class PowerPoint-style editor, built right here.' },
    ]},
    { id:uid(), bg:'#fff', color:'#242424', boxes:[
      { x:'6%', y:'6%', w:'88%', tag:'h2', style:'font-size:44px;color:#c43e1c;font-weight:700', html:'What you can do' },
      { x:'6%', y:'25%', w:'88%', tag:'div', style:'font-size:26px;line-height:1.5', html:'<ul><li>Add, duplicate and delete slides</li><li>Edit any text — bold, italic, colors, alignment</li><li>Insert text boxes, images and shapes</li><li>Present full-screen with keyboard navigation</li></ul>' },
    ]},
    { id:uid(), bg:'radial-gradient(circle at 30% 30%,#0f6cbd,#003366)', color:'#fff', boxes:[
      { x:'8%', y:'40%', w:'84%', tag:'h1', style:'font-size:72px;font-weight:800;text-align:center', html:'Thank you' },
    ]},
  ]);
  let slides = seed();
  let current = 0;
  const $ = s => document.querySelector(s);
  const thumbs = $('#thumbs'), stage = $('#slide'), pos = $('#pos');

  function renderSlide(){
    const s = slides[current];
    stage.setAttribute('style','background:'+s.bg+';color:'+s.color+';font-family:Calibri,Segoe UI,sans-serif');
    stage.innerHTML = '';
    s.boxes.forEach((b,i)=>{
      const el = document.createElement(b.tag||'div');
      el.className = 'box';
      el.style.cssText = 'left:'+b.x+';top:'+b.y+';width:'+b.w+';'+(b.style||'');
      el.contentEditable = 'true';
      el.dataset.i = i;
      el.innerHTML = b.html;
      el.addEventListener('input', ()=>{ s.boxes[i].html = el.innerHTML; renderThumbs(); });
      stage.appendChild(el);
    });
    pos.textContent = 'Slide '+(current+1)+' of '+slides.length;
  }
  function renderThumbs(){
    thumbs.innerHTML = '';
    slides.forEach((s,i)=>{
      const t = document.createElement('div');
      t.className = 'thumb'+(i===current?' active':'');
      const title = (s.boxes[0]&&s.boxes[0].html||'Slide').replace(/<[^>]+>/g,'').slice(0,40);
      const sub = (s.boxes[1]&&s.boxes[1].html||'').replace(/<[^>]+>/g,'').slice(0,60);
      t.innerHTML = '<div class="num">'+(i+1)+'</div><div class="mini" style="background:'+s.bg+';color:'+s.color+'"><h4>'+title+'</h4><div>'+sub+'</div></div>';
      t.onclick = ()=>{ current = i; renderSlide(); renderThumbs(); };
      thumbs.appendChild(t);
    });
  }
  function addSlide(dup){
    const base = dup ? JSON.parse(JSON.stringify(slides[current])) : { bg:'#fff', color:'#242424', boxes:[
      { x:'6%', y:'8%', w:'88%', tag:'h2', style:'font-size:44px;color:#c43e1c;font-weight:700', html:'New Slide' },
      { x:'6%', y:'28%', w:'88%', tag:'div', style:'font-size:26px;line-height:1.4', html:'Click to edit your content.' },
    ]};
    base.id = uid();
    slides.splice(current+1, 0, base);
    current++; renderSlide(); renderThumbs();
  }
  function delSlide(){
    if (slides.length<=1) return;
    slides.splice(current,1);
    current = Math.max(0, current-1);
    renderSlide(); renderThumbs();
  }
  function addBox(kind){
    const s = slides[current];
    const cnt = s.boxes.length;
    if (kind==='image'){
      const url = prompt('Image URL:', 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800');
      if (!url) return;
      s.boxes.push({ x:'20%', y:'25%', w:'60%', tag:'div', style:'', html:'<img src="'+url+'" style="width:100%;border-radius:6px" />' });
    } else if (kind==='shape'){
      s.boxes.push({ x:(15+cnt*3)+'%', y:(20+cnt*3)+'%', w:'220px', tag:'div', style:'height:140px;background:#0f6cbd;border-radius:12px', html:'' });
    } else {
      s.boxes.push({ x:(10+cnt*3)+'%', y:(30+cnt*3)+'%', w:'50%', tag:'div', style:'font-size:24px;color:#242424;background:rgba(255,255,255,.6);border:1px dashed #999', html:'Double-click to edit' });
    }
    renderSlide(); renderThumbs();
  }
  document.querySelectorAll('[data-cmd]').forEach(b=>{
    b.addEventListener('mousedown', e=>e.preventDefault());
    b.addEventListener('click', ()=>document.execCommand(b.dataset.cmd, false, null));
  });
  $('#fc').addEventListener('input', e=>document.execCommand('foreColor', false, e.target.value));
  $('#font').addEventListener('change', e=>document.execCommand('fontName', false, e.target.value));
  $('#size').addEventListener('change', e=>{
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    document.execCommand('fontSize', false, 7);
    document.querySelectorAll('font[size="7"]').forEach(f=>{
      f.removeAttribute('size'); f.style.fontSize = e.target.value+'px';
    });
  });
  document.querySelectorAll('[data-act]').forEach(b=>{
    b.onclick = ()=>{
      const a = b.dataset.act;
      if (a==='new') addSlide(false);
      else if (a==='dup') addSlide(true);
      else if (a==='del') delSlide();
      else if (a==='text'||a==='image'||a==='shape') addBox(a);
      else if (a==='present') present();
    };
  });
  function present(){
    document.body.classList.add('presenting');
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
    document.addEventListener('keydown', navKey);
  }
  function exitPresent(){
    document.body.classList.remove('presenting');
    document.removeEventListener('keydown', navKey);
    if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  }
  function navKey(e){
    if (e.key==='Escape'){ exitPresent(); }
    else if (e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){ if (current<slides.length-1){current++; renderSlide(); renderThumbs();} }
    else if (e.key==='ArrowLeft'||e.key==='PageUp'){ if (current>0){current--; renderSlide(); renderThumbs();} }
  }
  document.addEventListener('fullscreenchange', ()=>{ if (!document.fullscreenElement) exitPresent(); });
  renderSlide(); renderThumbs();
})();
</script>
</body>
</html>`;