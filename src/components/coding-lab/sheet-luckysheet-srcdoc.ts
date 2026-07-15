// Luckysheet — the closest-to-Excel open-source spreadsheet with a full ribbon,
// formula bar, formatting, charts and sheet tabs. Loaded from a public CDN so
// the whole editor is a single self-contained iframe document.

export const SHEET_LUCKYSHEET_SRC_DOC = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Excel Workbook</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/css/pluginsCss.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/plugins.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/css/luckysheet.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/assets/iconfont/iconfont.css" />
<script src="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/js/plugin.js"></script>
<script src="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/luckysheet.umd.js"></script>
<style>
  html,body{margin:0;padding:0;height:100%;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f3f2f1}
  #luckysheet{margin:0;padding:0;position:absolute;width:100%;left:0;top:0;bottom:0}
  .loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#605e5c;font-size:14px;z-index:100;background:#fff}
</style>
</head>
<body>
<div id="loading" class="loading">Loading Excel workbook…</div>
<div id="luckysheet"></div>
<script>
  window.addEventListener('load', function(){
    if (typeof window.luckysheet === 'undefined') {
      document.getElementById('loading').textContent = 'Failed to load spreadsheet engine (network).';
      return;
    }
    const cellData = [
      { r:0, c:0, v:{ v:'ID', ct:{fa:'General',t:'g'}, bl:1, bg:'#0f6cbd', fc:'#ffffff', ht:0 }},
      { r:0, c:1, v:{ v:'Name', bl:1, bg:'#0f6cbd', fc:'#ffffff' }},
      { r:0, c:2, v:{ v:'Grade', bl:1, bg:'#0f6cbd', fc:'#ffffff' }},
      { r:0, c:3, v:{ v:'Math', bl:1, bg:'#0f6cbd', fc:'#ffffff' }},
      { r:0, c:4, v:{ v:'Science', bl:1, bg:'#0f6cbd', fc:'#ffffff' }},
      { r:0, c:5, v:{ v:'Average', bl:1, bg:'#0f6cbd', fc:'#ffffff' }},
      { r:1, c:0, v:{ v:1 }}, { r:1, c:1, v:{ v:'Aarav' }}, { r:1, c:2, v:{ v:8 }},
      { r:1, c:3, v:{ v:88 }}, { r:1, c:4, v:{ v:92 }},
      { r:1, c:5, v:{ f:'=AVERAGE(D2:E2)', v:90 }},
      { r:2, c:0, v:{ v:2 }}, { r:2, c:1, v:{ v:'Diya' }}, { r:2, c:2, v:{ v:9 }},
      { r:2, c:3, v:{ v:75 }}, { r:2, c:4, v:{ v:81 }},
      { r:2, c:5, v:{ f:'=AVERAGE(D3:E3)', v:78 }},
      { r:3, c:0, v:{ v:3 }}, { r:3, c:1, v:{ v:'Kabir' }}, { r:3, c:2, v:{ v:8 }},
      { r:3, c:3, v:{ v:95 }}, { r:3, c:4, v:{ v:89 }},
      { r:3, c:5, v:{ f:'=AVERAGE(D4:E4)', v:92 }},
      { r:4, c:0, v:{ v:4 }}, { r:4, c:1, v:{ v:'Mira' }}, { r:4, c:2, v:{ v:10 }},
      { r:4, c:3, v:{ v:70 }}, { r:4, c:4, v:{ v:85 }},
      { r:4, c:5, v:{ f:'=AVERAGE(D5:E5)', v:77.5 }},
      { r:5, c:0, v:{ v:5 }}, { r:5, c:1, v:{ v:'Rohan' }}, { r:5, c:2, v:{ v:9 }},
      { r:5, c:3, v:{ v:77 }}, { r:5, c:4, v:{ v:90 }},
      { r:5, c:5, v:{ f:'=AVERAGE(D6:E6)', v:83.5 }},
    ];
    try {
      window.luckysheet.create({
        container: 'luckysheet',
        title: 'Students Workbook',
        lang: 'en',
        showinfobar: false,
        showsheetbar: true,
        showstatisticBar: true,
        enableAddRow: true,
        enableAddCol: true,
        data: [
          { name: 'Students', color: '#0f6cbd', index: 0, status: 1, order: 0,
            hide: 0, row: 60, column: 20, defaultRowHeight: 22, defaultColWidth: 96,
            celldata: cellData, config: {}, scrollLeft: 0, scrollTop: 0 },
          { name: 'Scratch', color: '', index: 1, status: 0, order: 1,
            hide: 0, row: 50, column: 15, celldata: [] },
        ],
        hook: {
          workbookCreateAfter: function(){
            const el = document.getElementById('loading');
            if (el) el.remove();
          }
        }
      });
      // fallback: hide loader after 3s regardless
      setTimeout(function(){
        const el = document.getElementById('loading');
        if (el) el.remove();
      }, 3000);
    } catch (err) {
      document.getElementById('loading').textContent = 'Failed to init spreadsheet: ' + (err && err.message ? err.message : err);
    }
  });
</script>
</body>
</html>`;