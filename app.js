var PDFLIB_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
var PDFJS_CDN  = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
var PDFJS_WKR  = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
var QRCODE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
var libsOK = false; var qrLibOK = false;

function loadScript(src, cb) {
  var s = document.createElement('script');
  s.src = src; s.onload = cb;
  s.onerror = function(){ console.warn('Failed: '+src); if(cb) cb(); };
  document.head.appendChild(s);
}
// ── LAZY LOAD: heavy libs load only when user picks a tool ───────────────
var _pdfLibsLoading = false;
function ensurePdfLibs(cb) {
  if (libsOK) { if(cb) cb(); return; }
  if (_pdfLibsLoading) {
    var t = setInterval(function(){ if(libsOK){ clearInterval(t); if(cb) cb(); } }, 80);
    return;
  }
  _pdfLibsLoading = true;
  loadScript(PDFLIB_CDN, function(){
    loadScript(PDFJS_CDN, function(){
      if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WKR;
      libsOK = true;
      if(cb) cb();
    });
  });
}
function ensureQrLib(cb) {
  if (qrLibOK) { if(cb) cb(); return; }
  loadScript(QRCODE_CDN, function(){ qrLibOK = true; if(cb) cb(); });
}
// Build grid immediately — no libs needed for the tool grid UI
document.addEventListener('DOMContentLoaded', function(){ buildGrid(); updateNav(); });

// ═══ TOOLS CONFIG ═══
// subcat: pdf-org | pdf-conv | pdf-sec | img-edit | img-conv | utility
var TOOLS = [
  // PDF ORGANIZE
  {id:'merge',        cat:'pdf',   subcat:'pdf-org',  icon:'🗂️', bg:'rgba(100,100,255,0.1)',  badge:'hot',  label:'🔥 Popular', name:'Merge PDF',           desc:'Combine multiple PDFs into one. Reorder files, rename output, optional auto-compress.', accept:'.pdf', multi:true,  opts:'merge'},
  {id:'split',        cat:'pdf',   subcat:'pdf-org',  icon:'✂️', bg:'rgba(255,200,0,0.12)',   badge:'free', label:'Free',       name:'Split PDF',           desc:'Split by range, every N pages, all pages, or remove specific pages.',              accept:'.pdf', multi:false, opts:'split'},
  {id:'rotate',       cat:'pdf',   subcat:'pdf-org',  icon:'🔃', bg:'rgba(180,100,255,0.1)',  badge:'free', label:'Free',       name:'Rotate PDF',          desc:'Rotate all, odd, even, or specific pages. Choose 90°, 180°, or 270°.',             accept:'.pdf', multi:false, opts:'rotate'},
  {id:'pagenumbers',  cat:'pdf',   subcat:'pdf-org',  icon:'🔢', bg:'rgba(77,143,255,0.12)',  badge:'free', label:'Free',       name:'Add Page Numbers',    desc:'6 positions, 4 number formats, custom start number, skip cover pages.',           accept:'.pdf', multi:false, opts:'pagenum'},
  {id:'reorderpdf',   cat:'pdf',   subcat:'pdf-org',  icon:'🔀', bg:'rgba(255,77,0,0.1)',     badge:'new',  label:'✨ New',      name:'Reverse PDF Pages',   desc:'Flip the order of all pages in your PDF from last to first.',                     accept:'.pdf', multi:false, opts:'none'},
  {id:'grayscalepdf', cat:'pdf',   subcat:'pdf-org',  icon:'⬛', bg:'rgba(120,120,120,0.12)', badge:'new',  label:'✨ New',      name:'PDF to Grayscale',    desc:'Convert colorful PDFs to black & white. Great for printing. Supports batch.',      accept:'.pdf', multi:true,  opts:'none'},
  {id:'extractpages', cat:'pdf',   subcat:'pdf-org',  icon:'📋', bg:'rgba(0,200,140,0.1)',    badge:'new',  label:'✨ New',      name:'Extract PDF Pages',   desc:'Pick specific pages by number (e.g. 1,3,5-8) and save them as a new PDF.',       accept:'.pdf', multi:false, opts:'extractpg'},
  {id:'deletepages',  cat:'pdf',   subcat:'pdf-org',  icon:'🗑️', bg:'rgba(255,80,80,0.1)',    badge:'new',  label:'✨ New',      name:'Delete PDF Pages',    desc:'Remove specific pages you don\'t want and download the cleaned PDF.',            accept:'.pdf', multi:false, opts:'delpg'},
  // PDF CONVERT
  {id:'compress',     cat:'pdf',   subcat:'pdf-conv', icon:'🗜️',bg:'rgba(0,184,148,0.12)',    badge:'hot',  label:'🔥 Popular', name:'Compress PDF',        desc:'4 quality presets (Screen/eBook/Printer/Prepress). Optional grayscale. Supports batch.', accept:'.pdf', multi:true, opts:'pdfquality'},
  {id:'pdf2jpg',      cat:'pdf',   subcat:'pdf-conv', icon:'🖼️',bg:'rgba(255,140,66,0.12)',   badge:'hot',  label:'🔥 Popular', name:'PDF to JPG / PNG',    desc:'Convert PDF pages to high-quality JPG or PNG images. Set scale and quality.',   accept:'.pdf', multi:false, opts:'pdf2jpg'},
  {id:'jpg2pdf',      cat:'pdf',   subcat:'pdf-conv', icon:'🔄', bg:'rgba(0,184,148,0.1)',    badge:'free', label:'Free',       name:'Images to PDF',        desc:'Combine multiple images into a single PDF. A4/Letter/image size options.',       accept:'image/*', multi:true, opts:'jpg2pdf'},
  {id:'watermarkpdf', cat:'pdf',   subcat:'pdf-conv', icon:'💧', bg:'rgba(255,77,0,0.1)',     badge:'free', label:'Free',       name:'Watermark PDF',        desc:'Custom text, color, angle, opacity. Apply to all or specific pages.',           accept:'.pdf', multi:false, opts:'wmpdf'},
  {id:'imgpdf',       cat:'pdf',   subcat:'pdf-conv', icon:'📄', bg:'rgba(255,77,143,0.1)',   badge:'new',  label:'✨ New',      name:'Image to PDF',         desc:'Convert one or multiple images into a single PDF document.',                     accept:'image/*', multi:true, opts:'none'},
  // PDF SECURITY
  {id:'unlockpdf',    cat:'pdf',   subcat:'pdf-sec',  icon:'🔓', bg:'rgba(255,200,0,0.12)',   badge:'new',  label:'✨ New',      name:'Unlock PDF',           desc:'Remove copy/print/edit restrictions from PDFs. Works on permission-locked files.', accept:'.pdf', multi:false, opts:'none'},
  // IMAGE EDIT
  {id:'imgcompress',  cat:'image', subcat:'img-edit', icon:'🗜️',bg:'rgba(0,184,148,0.12)',   badge:'hot',  label:'🔥 Popular', name:'Compress Image',       desc:'Reduce image file size. Set quality, choose JPG/PNG/WebP output. Batch support.', accept:'image/*', multi:true, opts:'quality'},
  {id:'resize',       cat:'image', subcat:'img-edit', icon:'📐', bg:'rgba(77,143,255,0.12)', badge:'free', label:'Free',       name:'Resize Image',         desc:'Presets for HD/Social Media/Instagram or enter custom dimensions. Batch supported.', accept:'image/*', multi:true, opts:'resize'},
  {id:'crop',         cat:'image', subcat:'img-edit', icon:'✂️', bg:'rgba(168,85,247,0.12)', badge:'free', label:'Free',       name:'Crop Image',           desc:'Manual crop or quick center/corner square crop. Pixel-perfect control.',         accept:'image/*', multi:false, opts:'crop'},
  {id:'rotateimg',    cat:'image', subcat:'img-edit', icon:'🔃', bg:'rgba(255,140,0,0.1)',   badge:'free', label:'Free',       name:'Rotate Image',         desc:'Preset angles or any custom angle. Transparent or solid background fill.',       accept:'image/*', multi:true, opts:'rotimg'},
  {id:'flip',         cat:'image', subcat:'img-edit', icon:'🔄', bg:'rgba(0,200,255,0.1)',   badge:'free', label:'Free',       name:'Flip Image',           desc:'Mirror horizontally, flip vertically, or both. Batch supported.',               accept:'image/*', multi:true, opts:'flip'},
  {id:'brightness',   cat:'image', subcat:'img-edit', icon:'☀️', bg:'rgba(255,230,0,0.12)',  badge:'free', label:'Free',       name:'Brightness & Contrast',desc:'Adjust brightness, contrast, saturation and hue. Fine-tune your images.',        accept:'image/*', multi:true, opts:'bright'},
  {id:'sharpen',      cat:'image', subcat:'img-edit', icon:'🔆', bg:'rgba(255,100,100,0.1)', badge:'free', label:'Free',       name:'Sharpen Image',        desc:'Make blurry photos sharp and crisp using a convolution sharpening filter.',      accept:'image/*', multi:true, opts:'none'},
  {id:'blur',         cat:'image', subcat:'img-edit', icon:'🌫️',bg:'rgba(100,100,255,0.1)', badge:'free', label:'Free',       name:'Blur Image',           desc:'Gaussian blur with adjustable radius. Great for privacy or backgrounds.',        accept:'image/*', multi:true, opts:'bluropt'},
  {id:'grayscale',    cat:'image', subcat:'img-edit', icon:'🖤', bg:'rgba(120,120,120,0.12)',badge:'free', label:'Free',       name:'Image to Grayscale',   desc:'Convert color images to beautiful black & white. Batch supported.',             accept:'image/*', multi:true, opts:'none'},
  {id:'invertimg',    cat:'image', subcat:'img-edit', icon:'🔀', bg:'rgba(80,80,200,0.1)',   badge:'new',  label:'✨ New',      name:'Invert Image Colors',  desc:'Invert all colors — creates a negative/complement effect. Batch supported.',     accept:'image/*', multi:true, opts:'none'},
  {id:'addborder',    cat:'image', subcat:'img-edit', icon:'🖼️',bg:'rgba(255,150,50,0.1)',  badge:'new',  label:'✨ New',      name:'Add Border to Image',  desc:'Add a colored border around your image. Choose size, color, and corner style.',  accept:'image/*', multi:true, opts:'borderopt'},
  // IMAGE CONVERT
  {id:'jpg2png',      cat:'image', subcat:'img-conv', icon:'🔁', bg:'rgba(255,77,143,0.1)',  badge:'free', label:'Free',       name:'JPG to PNG',           desc:'Convert JPG to transparent-capable PNG. Set quality and background.',           accept:'.jpg,.jpeg', multi:true, opts:'convfmt'},
  {id:'png2jpg',      cat:'image', subcat:'img-conv', icon:'🔀', bg:'rgba(255,200,0,0.1)',   badge:'free', label:'Free',       name:'PNG to JPG',           desc:'Convert PNG to JPG for smaller file sizes. Set quality and background fill.',   accept:'.png', multi:true, opts:'convfmt'},
  {id:'webp2jpg',     cat:'image', subcat:'img-conv', icon:'🔄', bg:'rgba(0,200,255,0.1)',   badge:'free', label:'Free',       name:'WebP to JPG',          desc:'Convert WebP images to widely-compatible JPG format.',                           accept:'.webp', multi:true, opts:'convfmt'},
  {id:'jpg2webp',     cat:'image', subcat:'img-conv', icon:'🌐', bg:'rgba(100,200,100,0.1)', badge:'free', label:'Free',       name:'JPG to WebP',          desc:'Convert to modern WebP for smaller sizes on websites. Set quality level.',      accept:'.jpg,.jpeg,.png', multi:true, opts:'convfmt'},
  {id:'watermarkimg', cat:'image', subcat:'img-conv', icon:'💧', bg:'rgba(255,77,0,0.1)',    badge:'free', label:'Free',       name:'Watermark Image',      desc:'6 positions including tiled. Custom color, font size, opacity. Batch supported.',accept:'image/*', multi:true, opts:'wmimg'},
  // UTILITIES
  {id:'qrcode',       cat:'image', subcat:'utility',  icon:'📱', bg:'rgba(80,80,200,0.12)',  badge:'new',  label:'✨ New',      name:'QR Code Generator',   desc:'Turn any URL or text into a QR code. Download as PNG instantly. Free, no limits.', accept:null, multi:false, opts:'qropt', type:'text'},
  {id:'imginfo',      cat:'image', subcat:'utility',  icon:'ℹ️',  bg:'rgba(77,143,255,0.1)', badge:'new',  label:'✨ New',      name:'Image Info',           desc:'View your image dimensions, file size, format, and aspect ratio instantly.',     accept:'image/*', multi:false, opts:'none'},
  {id:'imgbase64',    cat:'image', subcat:'utility',  icon:'🔤', bg:'rgba(0,184,148,0.1)',   badge:'new',  label:'✨ New',      name:'Image to Base64',      desc:'Convert any image to a Base64 string for embedding in HTML/CSS/JSON.',          accept:'image/*', multi:false, opts:'none'},
  {id:'removeexif',   cat:'image', subcat:'utility',  icon:'🔏', bg:'rgba(255,100,100,0.1)', badge:'new',  label:'✨ New',      name:'Remove Image EXIF',    desc:'Strip GPS, camera info, and metadata from photos for privacy protection.',       accept:'image/*', multi:true, opts:'none'},
];

// ═══ STATE ═══
var currentUser = null; var currentTool = null; var toolFiles = []; var repToolName = '';
try { currentUser = JSON.parse(localStorage.getItem('fpdf_user') || 'null'); } catch(e){}

// ═══ ADBLOCK ═══
function detectAB() {
  var bait = document.createElement('div');
  bait.className = 'adsbox pub_300x250 text-ad ad-slot';
  bait.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
  bait.innerHTML = '&nbsp;';
  document.body.appendChild(bait);
  setTimeout(function(){
    var blocked = !bait.offsetHeight || !bait.offsetParent || window.getComputedStyle(bait).display === 'none';
    if (blocked) document.getElementById('abOv').classList.add('show');
    try { document.body.removeChild(bait); } catch(e){}
  }, 200);
}
function dismissAb() { document.getElementById('abOv').classList.remove('show'); setTimeout(detectAB, 3000); }
window.addEventListener('load', function(){ setTimeout(detectAB, 1500); });

// ═══ SEARCH ═══
function searchTools(q) {
  q = q.toLowerCase().trim();
  var cards = document.querySelectorAll('.tool-card');
  var count = 0;
  cards.forEach(function(c){
    var name = c.dataset.name || '';
    var desc = c.querySelector('.tool-desc').textContent.toLowerCase();
    var show = !q || name.includes(q) || desc.includes(q);
    c.classList.toggle('hidden', !show);
    if (show) count++;
  });
  document.getElementById('noResults').classList.toggle('show', count === 0 && q.length > 0);
  document.querySelectorAll('.scat-btn').forEach(function(b){ b.classList.remove('active'); });
  if (!q) document.querySelectorAll('.scat-btn')[0].classList.add('active');
}

// ═══ BUILD GRID ═══
function buildGrid() {
  var grid = document.getElementById('toolsGrid');
  grid.innerHTML = '';
  // Count per subcat
  var counts = {'all':TOOLS.length};
  TOOLS.forEach(function(t){ counts[t.subcat] = (counts[t.subcat]||0)+1; });
  var catLabels = {'pdf-org':'pdf-org','pdf-conv':'pdf-conv','pdf-sec':'pdf-sec','img-edit':'img-edit','img-conv':'img-conv','utility':'utility'};
  Object.keys(catLabels).forEach(function(k){
    var el = document.getElementById('cnt-'+k);
    if (el) el.textContent = counts[k]||0;
  });
  var allEl = document.getElementById('cnt-all');
  if (allEl) allEl.textContent = TOOLS.length;
  if (document.getElementById('toolCount')) document.getElementById('toolCount').textContent = TOOLS.length+'+';

  TOOLS.forEach(function(t) {
    var card = document.createElement('div');
    card.className = 'tool-card';
    card.dataset.cat = t.cat;
    card.dataset.subcat = t.subcat;
    card.dataset.name = t.name.toLowerCase();
    var catLabel = t.subcat === 'pdf-org' ? '📂 PDF Organize' :
                   t.subcat === 'pdf-conv' ? '🔄 PDF Convert' :
                   t.subcat === 'pdf-sec' ? '🔒 PDF Security' :
                   t.subcat === 'img-edit' ? '✏️ Image Edit' :
                   t.subcat === 'img-conv' ? '🔁 Image Convert' : '🛠️ Utility';
    card.innerHTML =
      '<span class="tool-badge badge-'+t.badge+'">'+t.label+'</span>'+
      '<div class="tool-icon" style="background:'+t.bg+'">'+t.icon+'</div>'+
      '<div class="tool-name">'+t.name+'</div>'+
      '<div class="tool-desc">'+t.desc+'</div>'+
      '<div class="tool-foot">'+
        '<span class="tool-cat">'+catLabel+'</span>'+
        '<div class="tool-actions">'+
        '<button class="btn-share" onclick="shareTool(event,\''+t.id+'\',\''+t.name+'\')">🔗</button>'+
        '<button class="btn-report-tool" onclick="openRep(event,\''+t.name+'\')">⚑</button>'+
        '</div>'+
      '</div>';
    card.addEventListener('click', function(e){
      if (e.target.closest('.btn-report-tool')||e.target.closest('.btn-share')) return;
      openTool(t.id);
    });
    grid.appendChild(card);
  });
}

function filterTools(subcat, btn) {
  document.querySelectorAll('.scat-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('searchInput').value = '';
  document.getElementById('noResults').classList.remove('show');
  document.querySelectorAll('.tool-card').forEach(function(c){
    if (subcat === 'all') c.classList.remove('hidden');
    else c.classList.toggle('hidden', c.dataset.subcat !== subcat);
  });
}

// ═══ OPTS HTML ═══
function getOptsHTML(opts) {
  if (opts === 'merge') return `<div class="opts"><div class="opts-title">⚙️ Merge Options</div>
    <label>Output File Name</label><input type="text" id="optMergeName" value="merged"/>
    <label>Page Order</label><select id="optMergeOrder"><option value="asc">Files in upload order (top → bottom)</option><option value="desc">Reverse order (bottom → top)</option></select>
    <label>After merging</label><select id="optMergePost"><option value="none">Just download the merged PDF</option><option value="compress">Also compress after merging</option></select></div>`;
  if (opts === 'split') return `<div class="opts"><div class="opts-title">⚙️ Split Mode</div>
    <label>How to split</label><select id="optSplitMode" onchange="toggleSplitMode(this.value)"><option value="range">Extract a page range (e.g. pages 2–5)</option><option value="every">Split every N pages</option><option value="all">Extract every page separately</option><option value="remove">Remove specific pages</option></select>
    <div id="splitRangeOpts"><div class="row2"><div><label>From Page</label><input type="number" id="optFrom" value="1" min="1"/></div><div><label>To Page (0 = last)</label><input type="number" id="optTo" value="0" min="0"/></div></div></div>
    <div id="splitEveryOpts" style="display:none"><label>Pages per file</label><input type="number" id="optEvery" value="1" min="1"/></div>
    <div id="splitRemoveOpts" style="display:none"><label>Pages to remove (comma-separated, e.g. 1,3,5)</label><input type="text" id="optRemovePages" placeholder="e.g. 1,3,5"/></div></div>`;
  if (opts === 'rotate') return `<div class="opts"><div class="opts-title">⚙️ Rotation Options</div>
    <label>Which pages</label><select id="optRotScope"><option value="all">All pages</option><option value="odd">Odd pages only</option><option value="even">Even pages only</option><option value="custom">Specific pages</option></select>
    <div id="rotCustomPages" style="display:none"><label>Page numbers (comma-separated)</label><input type="text" id="optRotPages" placeholder="e.g. 1,3,7"/></div>
    <label>Rotation Angle</label><select id="optRot"><option value="90">90° Clockwise ↻</option><option value="180">180° Flip</option><option value="270">270° Counter-clockwise ↺</option></select></div>`;
  if (opts === 'pdfquality') return `<div class="opts"><div class="opts-title">⚙️ Compression Options</div>
    <label>Compression Preset</label><select id="optPQ"><option value="screen">Screen (72 DPI) — smallest file</option><option value="ebook" selected>eBook (150 DPI) — balanced</option><option value="printer">Printer (300 DPI) — high quality</option><option value="prepress">Prepress (300 DPI) — maximum quality</option></select>
    <label>Output File Name</label><input type="text" id="optCompressName" value="compressed"/>
    <label style="display:flex;align-items:center;gap:.5rem"><input type="checkbox" id="optCompressGray"/> Convert to grayscale (smaller file)</label></div>`;
  if (opts === 'pdf2jpg') return `<div class="opts"><div class="opts-title">⚙️ PDF to Image Options</div>
    <label>Image Quality</label><div class="qrow"><input type="range" id="optQ" min="10" max="100" value="90" oninput="document.getElementById('qv').textContent=this.value+'%'"/><span class="qval" id="qv">90%</span></div>
    <label>Render Scale (higher = sharper)</label><select id="optPDFScale"><option value="1.5">1.5x — fast</option><option value="2.0" selected>2x — balanced</option><option value="3.0">3x — high resolution</option></select>
    <label>Output Format</label><select id="optPDFOutFmt"><option value="jpeg">JPG (smaller size)</option><option value="png">PNG (lossless, transparent)</option></select>
    <label>Pages to convert</label><select id="optPDFPages"><option value="all">All pages</option><option value="first">First page only</option><option value="range">Custom page range</option></select>
    <div id="pdfPageRange" style="display:none"><div class="row2"><div><label>From</label><input type="number" id="optPFrom" value="1" min="1"/></div><div><label>To</label><input type="number" id="optPTo" value="1" min="1"/></div></div></div></div>`;
  if (opts === 'jpg2pdf') return `<div class="opts"><div class="opts-title">⚙️ Images to PDF Options</div>
    <label>Page Size</label><select id="optJ2PSize"><option value="image">Fit to image size</option><option value="a4">A4 Portrait</option><option value="a4l">A4 Landscape</option><option value="letter">US Letter Portrait</option></select>
    <label>Image Fit</label><select id="optJ2PFit"><option value="contain">Fit inside page (keep ratio)</option><option value="fill">Fill page (may stretch)</option><option value="center">Center at original size</option></select>
    <label>Page Margin</label><select id="optJ2PMargin"><option value="0">No margin</option><option value="20">Small</option><option value="40" selected>Normal</option><option value="80">Large</option></select>
    <label>Output File Name</label><input type="text" id="optJ2PName" value="images"/></div>`;
  if (opts === 'wmpdf') return `<div class="opts"><div class="opts-title">⚙️ Watermark Options</div>
    <label>Watermark Text</label><input type="text" id="optWM" value="CONFIDENTIAL"/>
    <div class="row2"><div><label>Font Size</label><input type="number" id="optWMSize" value="52" min="12" max="140"/></div><div><label>Rotation</label><input type="number" id="optWMAngle" value="45" min="0" max="360"/></div></div>
    <label>Text Color</label><select id="optWMColor"><option value="grey">Grey</option><option value="red">Red</option><option value="blue">Blue</option><option value="black">Black</option><option value="orange">Orange</option></select>
    <label>Opacity</label><div class="qrow"><input type="range" id="optWMOp" min="5" max="60" value="25" oninput="document.getElementById('wmopv').textContent=this.value+'%'"/><span class="qval" id="wmopv">25%</span></div>
    <label>Apply to</label><select id="optWMPages"><option value="all">All pages</option><option value="first">First page only</option><option value="odd">Odd pages</option><option value="even">Even pages</option></select></div>`;
  if (opts === 'pagenum') return `<div class="opts"><div class="opts-title">⚙️ Page Number Options</div>
    <div class="row2"><div><label>Position</label><select id="optPNPos"><option value="bottom-center">Bottom Center</option><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="top-center">Top Center</option><option value="top-right">Top Right</option><option value="top-left">Top Left</option></select></div><div><label>Start From</label><input type="number" id="optPNStart" value="1" min="0"/></div></div>
    <label>Format</label><select id="optPNFormat"><option value="num">1, 2, 3 …</option><option value="of">1 of 10, 2 of 10 …</option><option value="dash">— 1 —, — 2 — …</option><option value="pg">Page 1, Page 2 …</option></select>
    <label>Font Size</label><input type="number" id="optPNSize" value="12" min="8" max="32"/>
    <label>Skip first N pages (e.g. cover)</label><input type="number" id="optPNSkip" value="0" min="0"/></div>`;
  if (opts === 'quality') return `<div class="opts"><div class="opts-title">⚙️ Image Quality</div>
    <label>Quality (higher = better, larger file)</label><div class="qrow"><input type="range" id="optQ" min="10" max="100" value="85" oninput="document.getElementById('qv').textContent=this.value+'%'"/><span class="qval" id="qv">85%</span></div>
    <label>Output Format</label><select id="optOutFmt"><option value="jpeg">JPG — smaller</option><option value="png">PNG — lossless</option><option value="webp">WebP — best compression</option></select></div>`;
  if (opts === 'resize') return `<div class="opts"><div class="opts-title">⚙️ Resize Options</div>
    <label>Preset Sizes</label><select id="optResizePreset" onchange="applyResizePreset(this.value)"><option value="">Custom (enter below)</option><option value="1920x1080">1920×1080 — Full HD</option><option value="1280x720">1280×720 — HD</option><option value="800x600">800×600 — Standard</option><option value="400x300">400×300 — Thumbnail</option><option value="150x150">150×150 — Small Square</option><option value="1200x630">1200×630 — Social (OG)</option><option value="1080x1080">1080×1080 — Instagram Square</option><option value="1080x1920">1080×1920 — Story / TikTok</option></select>
    <div class="row2"><div><label>Width (px)</label><input type="number" id="optW" placeholder="e.g. 800"/></div><div><label>Height (px)</label><input type="number" id="optH" placeholder="e.g. 600"/></div></div>
    <label>Aspect Ratio</label><select id="optAR"><option value="1">Keep aspect ratio (recommended)</option><option value="0">Stretch to exact size</option></select>
    <label>Output Quality</label><div class="qrow"><input type="range" id="optRQ" min="50" max="100" value="90" oninput="document.getElementById('rqv').textContent=this.value+'%'"/><span class="qval" id="rqv">90%</span></div></div>`;
  if (opts === 'crop') return `<div class="opts"><div class="opts-title">⚙️ Crop Area (pixels)</div>
    <div class="row2"><div><label>Left (X)</label><input type="number" id="optX" value="0" min="0"/></div><div><label>Top (Y)</label><input type="number" id="optY" value="0" min="0"/></div></div>
    <div class="row2"><div><label>Width</label><input type="number" id="optCW" placeholder="full"/></div><div><label>Height</label><input type="number" id="optCH" placeholder="full"/></div></div>
    <label>Quick square crop</label><select id="optCropSquare" onchange="applySquareCrop(this.value)"><option value="">Manual (use values above)</option><option value="center">Center square</option><option value="tl">Top-left square</option><option value="tr">Top-right square</option></select></div>`;
  if (opts === 'wmimg') return `<div class="opts"><div class="opts-title">⚙️ Image Watermark</div>
    <label>Watermark Text</label><input type="text" id="optIMGWM" value="© PDFSnap"/>
    <div class="row2"><div><label>Position</label><select id="optWMPos"><option value="center">Center (diagonal)</option><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="top-right">Top Right</option><option value="top-left">Top Left</option><option value="tile">Tiled</option></select></div><div><label>Color</label><select id="optWMC"><option value="white">White</option><option value="black">Black</option><option value="#FF4D00">Orange</option><option value="#00B894">Green</option><option value="#4D8FFF">Blue</option></select></div></div>
    <label>Font Size (0 = auto)</label><input type="number" id="optWMFS" value="0" min="0"/>
    <label>Opacity</label><div class="qrow"><input type="range" id="optWMO" min="10" max="90" value="50" oninput="document.getElementById('wmov').textContent=this.value+'%'"/><span class="qval" id="wmov">50%</span></div></div>`;
  if (opts === 'flip') return `<div class="opts"><div class="opts-title">⚙️ Flip Options</div>
    <label>Direction</label><select id="optFlip"><option value="h">↔ Horizontal (mirror)</option><option value="v">↕ Vertical (flip upside down)</option><option value="both">Both directions</option></select>
    <label>Output Format</label><select id="optFlipFmt"><option value="jpeg">JPG</option><option value="png">PNG (keeps transparency)</option></select></div>`;
  if (opts === 'rotimg') return `<div class="opts"><div class="opts-title">⚙️ Rotation Options</div>
    <label>Angle</label><select id="optRotI"><option value="90">90° Clockwise ↻</option><option value="180">180° Flip</option><option value="270">270° Counter-clockwise ↺</option></select>
    <label>Custom Angle (overrides selection)</label><input type="number" id="optRotCustom" placeholder="e.g. 45 (leave blank to use above)" min="-360" max="360"/>
    <label>Background (for custom angles)</label><select id="optRotBg"><option value="white">White</option><option value="black">Black</option><option value="transparent">Transparent (PNG only)</option></select></div>`;
  if (opts === 'bright') return `<div class="opts"><div class="opts-title">⚙️ Color Adjustments</div>
    <label>Brightness</label><div class="qrow"><input type="range" id="optB" min="-100" max="100" value="0" oninput="document.getElementById('bv').textContent=this.value"/><span class="qval" id="bv">0</span></div>
    <label>Contrast</label><div class="qrow"><input type="range" id="optC" min="-100" max="100" value="0" oninput="document.getElementById('cv').textContent=this.value"/><span class="qval" id="cv">0</span></div>
    <label>Saturation</label><div class="qrow"><input type="range" id="optSat" min="-100" max="100" value="0" oninput="document.getElementById('satv').textContent=this.value"/><span class="qval" id="satv">0</span></div>
    <label>Hue Shift (°)</label><div class="qrow"><input type="range" id="optHue" min="-180" max="180" value="0" oninput="document.getElementById('huev').textContent=this.value+'°'"/><span class="qval" id="huev">0°</span></div></div>`;
  if (opts === 'bluropt') return `<div class="opts"><div class="opts-title">⚙️ Blur Options</div>
    <label>Blur Amount</label><div class="qrow"><input type="range" id="optBlur" min="1" max="30" value="5" oninput="document.getElementById('blurv').textContent=this.value+'px'"/><span class="qval" id="blurv">5px</span></div></div>`;
  if (opts === 'convfmt') return `<div class="opts"><div class="opts-title">⚙️ Conversion Options</div>
    <label>Output Quality</label><div class="qrow"><input type="range" id="optQ" min="50" max="100" value="92" oninput="document.getElementById('qv').textContent=this.value+'%'"/><span class="qval" id="qv">92%</span></div>
    <label>Background (for JPG output)</label><select id="optBg"><option value="white">White</option><option value="black">Black</option><option value="#f0f0f0">Light Grey</option></select></div>`;
  if (opts === 'extractpg') return `<div class="opts"><div class="opts-title">⚙️ Extract Options</div>
    <label>Pages to extract (e.g. 1,3,5-8,10)</label><input type="text" id="optExtractPages" placeholder="e.g. 1,3,5-8,10"/>
    <label>Output File Name</label><input type="text" id="optExtractName" value="extracted"/></div>`;
  if (opts === 'delpg') return `<div class="opts"><div class="opts-title">⚙️ Delete Options</div>
    <label>Pages to DELETE (e.g. 1,3,5)</label><input type="text" id="optDelPages" placeholder="e.g. 1,3,5"/></div>`;
  if (opts === 'borderopt') return `<div class="opts"><div class="opts-title">⚙️ Border Options</div>
    <label>Border Size (px)</label><input type="number" id="optBorderSize" value="20" min="1" max="300"/>
    <label>Border Color</label><select id="optBorderColor"><option value="#000000">Black</option><option value="#FFFFFF">White</option><option value="#FF4D00">Orange</option><option value="#FF0000">Red</option><option value="#0000FF">Blue</option><option value="#00B894">Green</option><option value="#888888">Grey</option></select>
    <label>Custom Color (hex)</label><input type="text" id="optBorderCustom" placeholder="#FF4D00 (overrides above)"/>
    <label>Output Format</label><select id="optBorderFmt"><option value="jpeg">JPG</option><option value="png">PNG (keeps transparency)</option></select></div>`;
  if (opts === 'qropt') return `<div class="opts"><div class="opts-title">⚙️ QR Code Options</div>
    <label>Size (pixels)</label><select id="optQRSize"><option value="200">200×200 (small)</option><option value="300" selected>300×300 (medium)</option><option value="400">400×400 (large)</option><option value="600">600×600 (extra large)</option></select>
    <label>Error Correction</label><select id="optQRErr"><option value="L">L — 7% (smallest)</option><option value="M" selected>M — 15% (recommended)</option><option value="H">H — 30% (most robust)</option></select></div>`;
  return '';
}

// ═══ OPEN / CLOSE TOOL ═══
function openTool(id) {
  if (!libsOK && id !== 'qrcode') { toast('⏳ Libraries loading, please wait a moment…','info'); return; }
  var t = TOOLS.find(function(x){ return x.id === id; });
  if (!t) return;
  currentTool = t; toolFiles = [];
  document.getElementById('toolTitle').textContent = t.icon + ' ' + t.name;
  document.getElementById('toolSub').textContent = t.desc;

  var bodyHTML = '';
  if (t.type === 'text') {
    // Text-input tools (QR Code)
    bodyHTML = '<div class="qr-input-section">'+
      '<div class="fg"><label>Enter URL or text to encode</label><textarea id="qrTextInput" placeholder="https://yourwebsite.com or any text…" style="min-height:90px"></textarea></div>'+
      getOptsHTML(t.opts)+
      '</div>'+
      '<div id="qrResult" class="result-area"></div>'+
      '<div class="prog-wrap" id="progWrap"><div class="prog-bg"><div class="prog-bar" id="progBar"></div></div><div class="prog-txt" id="progTxt">Generating…</div></div>'+
      '<button class="btn-primary" id="runBtn" onclick="runTool()">📱 Generate QR Code</button>';
  } else {
    var addMoreBtn = t.multi
      ? '<button class="btn-add" id="btnAdd">➕ Add More Files<input type="file" id="fileMore" accept="'+t.accept+'" multiple onchange="addFiles(this.files)"/></button>'
      : '';
    bodyHTML =
      '<div class="dropzone" id="dz">'+
        '<input type="file" id="fileMain" accept="'+(t.accept||'*')+'"'+(t.multi?' multiple':'')+' onchange="addFiles(this.files)"/>'+
        '<div class="dz-icon">📂</div>'+
        '<div class="dz-text"><strong>Tap to select '+(t.multi?'files':'a file')+'</strong><br/>or drag &amp; drop here</div>'+
        '<div class="dz-fmt">'+(t.accept||'any file')+'</div>'+
      '</div>'+
      '<div class="file-list" id="fileList"></div>'+
      addMoreBtn+
      getOptsHTML(t.opts)+
      '<div class="prog-wrap" id="progWrap"><div class="prog-bg"><div class="prog-bar" id="progBar"></div></div><div class="prog-txt" id="progTxt">Processing…</div></div>'+
      '<div class="result-area" id="resultArea"></div>'+
      '<button class="btn-primary" id="runBtn" onclick="runTool()" '+(t.type==='text'?'':'disabled')+'>▶ Process Now</button>';
  }

  document.getElementById('toolBody').innerHTML = bodyHTML;
  if (t.type !== 'text') {
    var dz = document.getElementById('dz');
    if (dz) {
      dz.addEventListener('dragover', function(e){ e.preventDefault(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', function(){ dz.classList.remove('dragover'); });
      dz.addEventListener('drop', function(e){ e.preventDefault(); dz.classList.remove('dragover'); addFiles(e.dataTransfer.files); });
    }
  }
  document.getElementById('toolOv').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTool() {
  document.getElementById('toolOv').classList.remove('active');
  document.body.style.overflow = '';
  toolFiles = []; currentTool = null;
}

document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeTool(); closeAuth(); closeRep(); closeSideMenu(); }});
document.getElementById('toolOv').addEventListener('click', function(e){ if(e.target===this) closeTool(); });
document.getElementById('authOv').addEventListener('click', function(e){ if(e.target===this) closeAuth(); });
document.getElementById('repOv').addEventListener('click', function(e){ if(e.target===this) closeRep(); });

// ═══ FILE HANDLING ═══
function addFiles(files) {
  if (!currentTool) return;
  var arr = Array.from(files);
  if (!currentTool.multi) { toolFiles = [arr[0]]; }
  else { arr.forEach(function(f){ toolFiles.push(f); }); }
  renderFileList();
  var btn = document.getElementById('runBtn');
  if (btn) btn.disabled = toolFiles.length === 0;
}
function removeFile(i) {
  toolFiles.splice(i, 1); renderFileList();
  var btn = document.getElementById('runBtn');
  if (btn) btn.disabled = toolFiles.length === 0;
}
function renderFileList() {
  var fl = document.getElementById('fileList');
  if (!fl) return;
  fl.innerHTML = '';
  toolFiles.forEach(function(f, i){
    var d = document.createElement('div'); d.className = 'fi';
    d.innerHTML = '<span class="fi-icon">'+(currentTool.cat==='pdf'?'📄':'🖼️')+'</span>'+
      '<div class="fi-info"><div class="fi-name">'+f.name+'</div><div class="fi-size">'+fmtSize(f.size)+'</div></div>'+
      '<span class="fi-rm" onclick="removeFile('+i+')">✕</span>';
    fl.appendChild(d);
  });
}
function fmtSize(b) {
  if (b < 1024) return b+' B';
  if (b < 1048576) return (b/1024).toFixed(1)+' KB';
  return (b/1048576).toFixed(2)+' MB';
}

// ═══ PROGRESS & RESULTS ═══
function setP(pct, txt) {
  var pw = document.getElementById('progWrap'); var pb = document.getElementById('progBar'); var pt = document.getElementById('progTxt');
  if (pw) pw.classList.add('show');
  if (pb) pb.style.width = pct+'%';
  if (pt) pt.textContent = txt;
}
function showResults(items) {
  var ra = document.getElementById('resultArea'); if (!ra) return;
  ra.innerHTML = '';
  items.forEach(function(item){
    var d = document.createElement('div'); d.className = 'res-item';
    d.innerHTML = '<span class="res-icon">✅</span>'+
      '<div class="res-info"><div class="res-name">'+item.name+'</div><div class="res-size">'+item.size+'</div></div>'+
      (item.url ? '<a class="btn-dl" href="'+item.url+'" download="'+item.name+'">⬇ Download</a>' : '');
    ra.appendChild(d);
  });
  ra.classList.add('show');
  var btn = document.getElementById('runBtn');
  if (btn) { btn.textContent = '▶ Process Another'; btn.disabled = false; btn.onclick = function(){ openTool(currentTool.id); }; }
  toast('✅ Done! Click Download to save your file.', 'ok');
}

// ═══ RUN TOOL ═══
async function runTool() {
  // Gate on lazy-loaded libs
  if (currentTool && currentTool.cat === 'pdf' && !libsOK) {
    toast('Loading PDF engine…','info');
    ensurePdfLibs(function(){ runTool(); });
    return;
  }
  if (currentTool && currentTool.id === 'qrcode' && !qrLibOK) {
    toast('Loading QR engine…','info');
    ensureQrLib(function(){ runTool(); });
    return;
  }
  if (currentTool && currentTool.type === 'text') {
    // QR code — no file needed
  } else if (!toolFiles.length) { toast('Please select a file first!','err'); return; }
  var btn = document.getElementById('runBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing…'; }
  var ra = document.getElementById('resultArea');
  if (ra) { ra.innerHTML = ''; ra.classList.remove('show'); }
  setP(5, 'Starting…');
  try {
    switch(currentTool.id) {
      case 'merge':       await tMerge();       break;
      case 'split':       await tSplit();       break;
      case 'rotate':      await tRotatePDF();   break;
      case 'compress':    await tCompressPDF(); break;
      case 'pdf2jpg':     await tPDF2JPG();     break;
      case 'jpg2pdf':     await tJPG2PDF();     break;
      case 'watermarkpdf':await tWatermarkPDF();break;
      case 'pagenumbers': await tPageNumbers(); break;
      case 'grayscalepdf':await tGrayscalePDF();break;
      case 'reorderpdf':  await tReorderPDF();  break;
      case 'extractpages':await tExtractPages();break;
      case 'deletepages': await tDeletePages(); break;
      case 'unlockpdf':   await tUnlockPDF();   break;
      case 'imgcompress': await tCompress();    break;
      case 'resize':      await tResize();      break;
      case 'crop':        await tCrop();        break;
      case 'jpg2png':     await tConvert('png','image/png'); break;
      case 'png2jpg':     await tConvert('jpg','image/jpeg'); break;
      case 'webp2jpg':    await tConvert('jpg','image/jpeg'); break;
      case 'jpg2webp':    await tConvert('webp','image/webp'); break;
      case 'watermarkimg':await tWatermarkImg();break;
      case 'grayscale':   await tGrayscale();   break;
      case 'flip':        await tFlip();        break;
      case 'rotateimg':   await tRotateImg();   break;
      case 'brightness':  await tBrightness();  break;
      case 'sharpen':     await tSharpen();     break;
      case 'blur':        await tBlur();        break;
      case 'imgpdf':      await tImgToPDF();    break;
      case 'invertimg':   await tInvertImg();   break;
      case 'addborder':   await tAddBorder();   break;
      case 'qrcode':      await tQRCode();      break;
      case 'imginfo':     await tImgInfo();     break;
      case 'imgbase64':   await tImgBase64();   break;
      case 'removeexif':  await tRemoveEXIF();  break;
      default: toast('Tool not found','err');
    }
  } catch(err) {
    setP(100, '❌ Error: '+err.message);
    toast('Error: '+err.message,'err');
    if (btn) { btn.disabled = false; btn.textContent = '▶ Try Again'; btn.onclick = runTool; }
  }
}

// ════════════════════════════════════
// ═══ PDF TOOLS ═══════════════════════
// ════════════════════════════════════

async function tMerge() {
  var PDFDoc = PDFLib.PDFDocument;
  var merged = await PDFDoc.create();
  var files = toolFiles.slice();
  var order = document.getElementById('optMergeOrder') ? document.getElementById('optMergeOrder').value : 'asc';
  if (order === 'desc') files = files.slice().reverse();
  for (var i = 0; i < files.length; i++) {
    setP(Math.round(5+80*(i/files.length)), 'Merging file '+(i+1)+' of '+files.length+'…');
    var buf = await files[i].arrayBuffer();
    var src = await PDFDoc.load(buf, {ignoreEncryption:true});
    var pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach(function(p){ merged.addPage(p); });
  }
  setP(90, 'Saving…');
  var doCompress = document.getElementById('optMergePost') && document.getElementById('optMergePost').value === 'compress';
  var bytes = await merged.save({useObjectStreams: doCompress});
  var fname = (document.getElementById('optMergeName') ? document.getElementById('optMergeName').value.trim() : '') || 'merged';
  if (!fname.endsWith('.pdf')) fname += '.pdf';
  showResults([{name:fname, size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tSplit() {
  setP(10, 'Loading PDF…');
  var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer();
  var src = await PDFDoc.load(buf, {ignoreEncryption:true});
  var total = src.getPageCount();
  var mode = document.getElementById('optSplitMode') ? document.getElementById('optSplitMode').value : 'range';
  var results = [];
  if (mode === 'range') {
    var from = Math.max(1, parseInt(document.getElementById('optFrom').value)||1) - 1;
    var to = parseInt(document.getElementById('optTo').value)||0;
    if (to <= 0) to = total; to = Math.min(total, to) - 1;
    setP(50, 'Extracting pages…');
    var newDoc = await PDFDoc.create();
    var idxs = []; for (var i = from; i <= to; i++) idxs.push(i);
    var pages = await newDoc.copyPages(src, idxs);
    pages.forEach(function(p){ newDoc.addPage(p); });
    var bytes = await newDoc.save();
    results.push({name:'pages_'+(from+1)+'-'+(to+1)+'.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))});
  } else if (mode === 'every') {
    var n = Math.max(1, parseInt(document.getElementById('optEvery').value)||1);
    var part = 0;
    for (var start = 0; start < total; start += n) {
      part++;
      setP(Math.round(10+80*(start/total)), 'Creating part '+part+'…');
      var d = await PDFDoc.create();
      var end = Math.min(start+n-1, total-1);
      var idxs2 = []; for (var j=start;j<=end;j++) idxs2.push(j);
      var pg = await d.copyPages(src, idxs2); pg.forEach(function(p){ d.addPage(p); });
      var b = await d.save();
      results.push({name:'part'+part+'_p'+(start+1)+'-'+(end+1)+'.pdf', size:fmtSize(b.length), url:URL.createObjectURL(new Blob([b],{type:'application/pdf'}))});
    }
  } else if (mode === 'all') {
    for (var i = 0; i < total; i++) {
      setP(Math.round(10+80*(i/total)), 'Extracting page '+(i+1)+' of '+total+'…');
      var d = await PDFDoc.create();
      var pg = await d.copyPages(src,[i]); d.addPage(pg[0]);
      var b = await d.save();
      results.push({name:'page_'+(i+1)+'.pdf', size:fmtSize(b.length), url:URL.createObjectURL(new Blob([b],{type:'application/pdf'}))});
    }
  } else if (mode === 'remove') {
    var removeStr = (document.getElementById('optRemovePages').value||'').trim();
    var removeSet = new Set(removeStr.split(',').map(function(x){ return parseInt(x.trim())-1; }).filter(function(x){ return !isNaN(x)&&x>=0&&x<total; }));
    setP(50, 'Removing '+removeSet.size+' pages…');
    var d = await PDFDoc.create();
    var keepIdxs = []; for (var i=0;i<total;i++) if (!removeSet.has(i)) keepIdxs.push(i);
    var pg = await d.copyPages(src, keepIdxs); pg.forEach(function(p){ d.addPage(p); });
    var b = await d.save();
    results.push({name:'removed_pages.pdf', size:fmtSize(b.length), url:URL.createObjectURL(new Blob([b],{type:'application/pdf'}))});
  }
  setP(100,'Done!'); showResults(results);
}

async function tRotatePDF() {
  setP(10, 'Loading PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer(); var doc = await PDFDoc.load(buf, {ignoreEncryption:true});
  var angle = parseInt(document.getElementById('optRot').value)||90;
  var scope = document.getElementById('optRotScope') ? document.getElementById('optRotScope').value : 'all';
  var customPages = new Set();
  if (scope === 'custom') {
    var cp = (document.getElementById('optRotPages')?document.getElementById('optRotPages').value:'').trim();
    cp.split(',').forEach(function(x){ var n=parseInt(x.trim()); if(!isNaN(n)&&n>0) customPages.add(n-1); });
  }
  setP(50, 'Rotating pages…');
  doc.getPages().forEach(function(p, i){
    var shouldRotate = scope==='all' || (scope==='odd'&&i%2===0) || (scope==='even'&&i%2===1) || (scope==='custom'&&customPages.has(i));
    if (shouldRotate) { var cur = p.getRotation().angle; p.setRotation(PDFLib.degrees((cur+angle)%360)); }
  });
  setP(90, 'Saving…'); var bytes = await doc.save();
  showResults([{name:'rotated.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tCompressPDF() {
  var PDFDoc = PDFLib.PDFDocument;
  var preset = document.getElementById('optPQ') ? document.getElementById('optPQ').value : 'ebook';
  var doGray = document.getElementById('optCompressGray') && document.getElementById('optCompressGray').checked;
  var baseName = (document.getElementById('optCompressName')?document.getElementById('optCompressName').value.trim():'compressed')||'compressed';
  var results = [];
  for (var fi = 0; fi < toolFiles.length; fi++) {
    setP(Math.round(5+90*(fi/toolFiles.length)), 'Processing '+(fi+1)+' of '+toolFiles.length+'…');
    var buf = await toolFiles[fi].arrayBuffer();
    var doc = await PDFDoc.load(buf, {ignoreEncryption:true});
    var bytes;
    if (doGray) {
      var pdf = await pdfjsLib.getDocument({data: new Uint8Array(buf)}).promise;
      var scaleMap = {screen:1.0, ebook:1.5, printer:2.0, prepress:2.5};
      var qualMap  = {screen:0.5, ebook:0.75, printer:0.9, prepress:0.95};
      var scale = scaleMap[preset]||1.5; var qual = qualMap[preset]||0.75;
      var newDoc = await PDFDoc.create();
      for (var i=1;i<=pdf.numPages;i++) {
        setP(Math.round(5+85*(fi/toolFiles.length)+85*(i/pdf.numPages)/toolFiles.length),'File '+(fi+1)+' page '+i+'…');
        var page = await pdf.getPage(i); var vp = page.getViewport({scale:scale});
        var canvas = document.createElement('canvas'); canvas.width=vp.width; canvas.height=vp.height;
        var ctx=canvas.getContext('2d'); await page.render({canvasContext:ctx,viewport:vp}).promise;
        var id=ctx.getImageData(0,0,canvas.width,canvas.height);
        for (var j=0;j<id.data.length;j+=4){var g=id.data[j]*0.299+id.data[j+1]*0.587+id.data[j+2]*0.114;id.data[j]=id.data[j+1]=id.data[j+2]=g;}
        ctx.putImageData(id,0,0);
        var blob=await new Promise(function(res){canvas.toBlob(res,'image/jpeg',qual);}); var imgBuf=await blob.arrayBuffer();
        var img=await newDoc.embedJpg(imgBuf); var np=newDoc.addPage([img.width,img.height]); np.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
      }
      bytes=await newDoc.save({useObjectStreams:true});
    } else {
      bytes = await doc.save({useObjectStreams: true});
    }
    var fname = toolFiles.length > 1 ? toolFiles[fi].name.replace(/\.pdf$/i,'')+'_compressed.pdf' : (baseName.endsWith('.pdf')?baseName:baseName+'.pdf');
    var saved = toolFiles[fi].size>bytes.length ? Math.round((1-bytes.length/toolFiles[fi].size)*100) : 0;
    results.push({name:fname, size:fmtSize(bytes.length)+' (saved '+saved+'%)', url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))});
  }
  setP(100,'Done!'); showResults(results);
}

async function tPDF2JPG() {
  setP(5, 'Loading PDF renderer…');
  var buf = await toolFiles[0].arrayBuffer();
  var pdf = await pdfjsLib.getDocument({data: new Uint8Array(buf)}).promise;
  var total = pdf.numPages;
  var qual = document.getElementById('optQ') ? parseInt(document.getElementById('optQ').value)/100 : 0.90;
  var scale = document.getElementById('optPDFScale') ? parseFloat(document.getElementById('optPDFScale').value) : 2.0;
  var fmt = document.getElementById('optPDFOutFmt') ? document.getElementById('optPDFOutFmt').value : 'jpeg';
  var mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
  var ext = fmt === 'png' ? 'png' : 'jpg';
  var pagesMode = document.getElementById('optPDFPages') ? document.getElementById('optPDFPages').value : 'all';
  var pageFrom = 1, pageTo = total;
  if (pagesMode === 'first') { pageFrom=1; pageTo=1; }
  else if (pagesMode === 'range') {
    pageFrom = parseInt(document.getElementById('optPFrom').value)||1;
    pageTo   = parseInt(document.getElementById('optPTo').value)||total;
    pageTo   = Math.min(pageTo, total);
  }
  var results = [];
  for (var i = pageFrom; i <= pageTo; i++) {
    setP(Math.round(5+90*((i-pageFrom)/(pageTo-pageFrom+1))), 'Rendering page '+i+' of '+pageTo+'…');
    var page = await pdf.getPage(i);
    var vp = page.getViewport({scale:scale});
    var canvas = document.createElement('canvas');
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({canvasContext:canvas.getContext('2d'), viewport:vp}).promise;
    var blob = await new Promise(function(res){ canvas.toBlob(res, mime, qual); });
    results.push({name:'page-'+i+'.'+ext, size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

function loadImgEl(file) {
  return new Promise(function(res, rej){
    var img = new Image(); var url = URL.createObjectURL(file);
    img.onload = function(){ URL.revokeObjectURL(url); res(img); };
    img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error('Image load failed')); };
    img.src = url;
  });
}
function toBlob(canvas, mime, q) { return new Promise(function(res){ canvas.toBlob(res, mime, q); }); }

async function tJPG2PDF() {
  setP(5, 'Creating PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var doc = await PDFDoc.create();
  var sizeMode = document.getElementById('optJ2PSize') ? document.getElementById('optJ2PSize').value : 'image';
  var fitMode  = document.getElementById('optJ2PFit')  ? document.getElementById('optJ2PFit').value  : 'contain';
  var margin   = parseInt(document.getElementById('optJ2PMargin') ? document.getElementById('optJ2PMargin').value : '40') || 0;
  var pageSizes = {a4:[595,842], a4l:[842,595], letter:[612,792]};
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+85*(i/toolFiles.length)), 'Adding image '+(i+1)+'…');
    var buf = await toolFiles[i].arrayBuffer();
    var isPng = toolFiles[i].type === 'image/png';
    var embedBuf = buf;
    if (!isPng && toolFiles[i].type !== 'image/jpeg') {
      var imgEl = await loadImgEl(toolFiles[i]);
      var cv = document.createElement('canvas'); cv.width=imgEl.width; cv.height=imgEl.height;
      cv.getContext('2d').drawImage(imgEl,0,0);
      var bl = await toBlob(cv,'image/jpeg',0.92); embedBuf = await bl.arrayBuffer(); isPng=false;
    }
    var img = isPng ? await doc.embedPng(embedBuf) : await doc.embedJpg(embedBuf);
    var pw, ph;
    if (sizeMode === 'image') { pw=img.width; ph=img.height; }
    else { var ps=pageSizes[sizeMode]||[595,842]; pw=ps[0]; ph=ps[1]; }
    var page = doc.addPage([pw, ph]);
    var mx=margin, my=margin, aw=pw-2*margin, ah=ph-2*margin;
    if (aw<=0||ah<=0){mx=0;my=0;aw=pw;ah=ph;}
    var sx=aw/img.width, sy=ah/img.height, s, dx, dy, dw, dh;
    if (fitMode==='contain'){s=Math.min(sx,sy);dw=img.width*s;dh=img.height*s;dx=mx+(aw-dw)/2;dy=my+(ah-dh)/2;}
    else if (fitMode==='fill'){dw=aw;dh=ah;dx=mx;dy=my;}
    else {dw=img.width;dh=img.height;dx=mx+(aw-dw)/2;dy=my+(ah-dh)/2;}
    page.drawImage(img,{x:dx,y:ph-dy-dh,width:dw,height:dh});
  }
  setP(95, 'Saving…'); var bytes = await doc.save();
  var fname = ((document.getElementById('optJ2PName')?document.getElementById('optJ2PName').value.trim():'')||'images')+'.pdf';
  showResults([{name:fname, size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tWatermarkPDF() {
  setP(10,'Loading PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer(); var doc = await PDFDoc.load(buf,{ignoreEncryption:true});
  var text  = document.getElementById('optWM').value || 'CONFIDENTIAL';
  var size  = parseInt(document.getElementById('optWMSize').value)||52;
  var angle = parseInt(document.getElementById('optWMAngle').value)||45;
  var colorName = document.getElementById('optWMColor').value||'grey';
  var opacity = parseInt(document.getElementById('optWMOp').value)/100 || 0.25;
  var applyTo = document.getElementById('optWMPages').value||'all';
  var colorMap = {grey:[0.5,0.5,0.5],red:[0.8,0,0],blue:[0,0,0.8],black:[0,0,0],orange:[1,0.3,0]};
  var c = colorMap[colorName]||[0.5,0.5,0.5];
  var rgb = PDFLib.rgb(c[0],c[1],c[2]);
  var rad = angle * Math.PI / 180;
  var pages = doc.getPages();
  setP(50,'Adding watermark…');
  pages.forEach(function(page, idx){
    var include = applyTo==='all' || (applyTo==='first'&&idx===0) || (applyTo==='odd'&&idx%2===0) || (applyTo==='even'&&idx%2===1);
    if (!include) return;
    var {width,height} = page.getSize();
    page.drawText(text, {x:width/2-size*text.length*0.28, y:height/2, size:size, color:rgb, opacity:opacity, rotate:PDFLib.degrees(angle)});
  });
  setP(90,'Saving…'); var bytes = await doc.save();
  showResults([{name:'watermarked.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tPageNumbers() {
  setP(10,'Loading PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer(); var doc = await PDFDoc.load(buf,{ignoreEncryption:true});
  var pos    = document.getElementById('optPNPos').value||'bottom-center';
  var startN = parseInt(document.getElementById('optPNStart').value)||1;
  var format = document.getElementById('optPNFormat').value||'num';
  var fsz    = parseInt(document.getElementById('optPNSize').value)||12;
  var skip   = parseInt(document.getElementById('optPNSkip').value)||0;
  var pages  = doc.getPages(); var total = pages.length;
  setP(50,'Adding page numbers…');
  pages.forEach(function(page, idx){
    if (idx < skip) return;
    var n = idx - skip + startN;
    var label = format==='num'?String(n) : format==='of'?(n+' of '+(total-skip)) : format==='dash'?('— '+n+' —') : ('Page '+n);
    var {width,height} = page.getSize();
    var margin = 20; var tw = label.length * fsz * 0.5;
    var px = pos.includes('center') ? width/2-tw/2 : pos.includes('right') ? width-margin-tw : margin;
    var py = pos.includes('top') ? height-margin-fsz : margin;
    page.drawText(label, {x:px, y:py, size:fsz, color:PDFLib.rgb(0,0,0), opacity:0.7});
  });
  setP(90,'Saving…'); var bytes = await doc.save();
  showResults([{name:'numbered.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tGrayscalePDF() {
  var PDFDoc = PDFLib.PDFDocument; var results = [];
  for (var fi = 0; fi < toolFiles.length; fi++) {
    setP(Math.round(5+90*(fi/toolFiles.length)), 'Processing '+(fi+1)+'…');
    var buf = await toolFiles[fi].arrayBuffer();
    var pdf = await pdfjsLib.getDocument({data: new Uint8Array(buf)}).promise;
    var newDoc = await PDFDoc.create();
    for (var i=1;i<=pdf.numPages;i++) {
      setP(Math.round(5+85*(fi/toolFiles.length)+85*(i/pdf.numPages)/toolFiles.length),'Page '+i+'…');
      var page=await pdf.getPage(i); var vp=page.getViewport({scale:1.5});
      var canvas=document.createElement('canvas'); canvas.width=vp.width; canvas.height=vp.height;
      var ctx=canvas.getContext('2d'); await page.render({canvasContext:ctx,viewport:vp}).promise;
      var id=ctx.getImageData(0,0,canvas.width,canvas.height);
      for (var j=0;j<id.data.length;j+=4){var g=id.data[j]*0.299+id.data[j+1]*0.587+id.data[j+2]*0.114;id.data[j]=id.data[j+1]=id.data[j+2]=g;}
      ctx.putImageData(id,0,0);
      var blob=await new Promise(function(res){canvas.toBlob(res,'image/jpeg',0.9);}); var imgBuf=await blob.arrayBuffer();
      var img=await newDoc.embedJpg(imgBuf); var np=newDoc.addPage([img.width,img.height]); np.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
    }
    var bytes=await newDoc.save();
    var fname=toolFiles[fi].name.replace(/\.pdf$/i,'')+'_grayscale.pdf';
    results.push({name:fname, size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))});
  }
  setP(100,'Done!'); showResults(results);
}

async function tReorderPDF() {
  setP(10,'Loading PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer(); var doc = await PDFDoc.load(buf,{ignoreEncryption:true});
  var total = doc.getPageCount(); setP(40,'Reversing '+total+' pages…');
  var newDoc = await PDFDoc.create();
  var indices = []; for (var i=total-1;i>=0;i--) indices.push(i);
  var pages = await newDoc.copyPages(doc, indices); pages.forEach(function(p){ newDoc.addPage(p); });
  setP(90,'Saving…'); var bytes = await newDoc.save();
  showResults([{name:'reversed.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tExtractPages() {
  setP(10,'Loading PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer(); var src = await PDFDoc.load(buf,{ignoreEncryption:true});
  var total = src.getPageCount();
  var str = (document.getElementById('optExtractPages').value||'').trim();
  if (!str) { toast('Please enter page numbers to extract!','err'); return; }
  var idxSet = [];
  str.split(',').forEach(function(part){
    part = part.trim();
    if (part.includes('-')) {
      var range = part.split('-').map(function(x){ return parseInt(x.trim())-1; });
      for (var i=range[0];i<=range[1]&&i<total;i++) if(i>=0&&idxSet.indexOf(i)<0) idxSet.push(i);
    } else {
      var n = parseInt(part)-1; if(!isNaN(n)&&n>=0&&n<total&&idxSet.indexOf(n)<0) idxSet.push(n);
    }
  });
  idxSet.sort(function(a,b){return a-b;});
  if (!idxSet.length) { toast('No valid pages found!','err'); return; }
  setP(50,'Extracting '+idxSet.length+' pages…');
  var newDoc = await PDFDoc.create();
  var pages = await newDoc.copyPages(src, idxSet); pages.forEach(function(p){ newDoc.addPage(p); });
  setP(90,'Saving…'); var bytes = await newDoc.save();
  var fname = ((document.getElementById('optExtractName')?document.getElementById('optExtractName').value.trim():'')||'extracted')+'.pdf';
  showResults([{name:fname, size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tDeletePages() {
  setP(10,'Loading PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer(); var src = await PDFDoc.load(buf,{ignoreEncryption:true});
  var total = src.getPageCount();
  var str = (document.getElementById('optDelPages').value||'').trim();
  if (!str) { toast('Please enter page numbers to delete!','err'); return; }
  var removeSet = new Set();
  str.split(',').forEach(function(x){ var n=parseInt(x.trim())-1; if(!isNaN(n)&&n>=0&&n<total) removeSet.add(n); });
  if (!removeSet.size) { toast('No valid pages found!','err'); return; }
  setP(50,'Removing '+removeSet.size+' pages…');
  var keepIdxs = []; for (var i=0;i<total;i++) if(!removeSet.has(i)) keepIdxs.push(i);
  if (!keepIdxs.length) { toast('Cannot remove all pages!','err'); return; }
  var newDoc = await PDFDoc.create();
  var pages = await newDoc.copyPages(src, keepIdxs); pages.forEach(function(p){ newDoc.addPage(p); });
  setP(90,'Saving…'); var bytes = await newDoc.save();
  showResults([{name:'cleaned.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

async function tUnlockPDF() {
  setP(10,'Loading PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer();
  setP(40,'Removing restrictions…');
  var doc = await PDFDoc.load(buf, {ignoreEncryption:true});
  setP(80,'Saving unlocked PDF…');
  var bytes = await doc.save();
  showResults([{name:'unlocked.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

// ════════════════════════════════════
// ═══ IMAGE TOOLS ════════════════════
// ════════════════════════════════════

async function tCompress() {
  var qual = parseInt(document.getElementById('optQ').value)/100 || 0.85;
  var fmt  = document.getElementById('optOutFmt') ? document.getElementById('optOutFmt').value : 'jpeg';
  var mime = fmt==='png'?'image/png':fmt==='webp'?'image/webp':'image/jpeg';
  var ext  = fmt==='png'?'png':fmt==='webp'?'webp':'jpg';
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Compressing '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx=c.getContext('2d');
    if (mime!=='image/png'){ ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); }
    ctx.drawImage(img,0,0);
    var blob = await toBlob(c,mime,qual);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_compressed.'+ext, size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tResize() {
  var keepAR = document.getElementById('optAR').value==='1';
  var wIn = parseInt(document.getElementById('optW').value)||0;
  var hIn = parseInt(document.getElementById('optH').value)||0;
  if (!wIn && !hIn) { toast('Please enter width or height!','err'); return; }
  var qual = (document.getElementById('optRQ') ? parseInt(document.getElementById('optRQ').value)/100 : 0.9) || 0.9;
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Resizing '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var w = wIn || img.width; var h = hIn || img.height;
    var ratio = img.width/img.height;
    if (keepAR) {
      if (wIn && !hIn) h=Math.round(w/ratio);
      else if (!wIn && hIn) w=Math.round(h*ratio);
      else if (wIn && hIn) { var rr=Math.min(w/img.width,h/img.height); w=Math.round(img.width*rr); h=Math.round(img.height*rr); }
    }
    var c = document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    var blob = await toBlob(c,'image/jpeg',qual);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_'+w+'x'+h+'.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tCrop() {
  setP(20,'Loading image…');
  var img = await loadImgEl(toolFiles[0]);
  var x=parseInt(document.getElementById('optX').value)||0;
  var y=parseInt(document.getElementById('optY').value)||0;
  var cw=parseInt(document.getElementById('optCW').value)||img.width-x;
  var ch=parseInt(document.getElementById('optCH').value)||img.height-y;
  cw=Math.min(cw,img.width-x); ch=Math.min(ch,img.height-y);
  if (cw<=0||ch<=0) { toast('Invalid crop dimensions!','err'); return; }
  setP(60,'Cropping '+cw+'×'+ch+'…');
  var c = document.createElement('canvas'); c.width=cw; c.height=ch;
  c.getContext('2d').drawImage(img,x,y,cw,ch,0,0,cw,ch);
  var blob = await toBlob(c,'image/jpeg',0.92);
  showResults([{name:'cropped.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)}]);
}

async function tConvert(ext, mime) {
  var results = [];
  var qual = document.getElementById('optQ') ? parseInt(document.getElementById('optQ').value)/100 : 0.92;
  var bgColor = document.getElementById('optBg') ? document.getElementById('optBg').value : 'white';
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Converting '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d');
    if (mime==='image/jpeg'||mime==='image/webp') { ctx.fillStyle=bgColor; ctx.fillRect(0,0,c.width,c.height); }
    ctx.drawImage(img,0,0);
    var blob = await toBlob(c,mime,qual);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'.'+ext, size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tWatermarkImg() {
  var text    = (document.getElementById('optIMGWM').value||'© PDFSnap').trim();
  var color   = document.getElementById('optWMC').value||'white';
  var opacity = parseInt(document.getElementById('optWMO').value)/100 || 0.5;
  var wpos    = document.getElementById('optWMPos') ? document.getElementById('optWMPos').value : 'center';
  var fsSetting = parseInt(document.getElementById('optWMFS') ? document.getElementById('optWMFS').value : '0') || 0;
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Watermarking '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    var fs = fsSetting > 0 ? fsSetting : Math.max(16, Math.round(img.width*0.045));
    ctx.save(); ctx.globalAlpha=opacity; ctx.fillStyle=color;
    ctx.font='bold '+fs+'px sans-serif'; ctx.textBaseline='middle';
    var tw = ctx.measureText(text).width;
    var pad = Math.round(img.width*0.03);
    if (wpos==='center') {
      ctx.textAlign='center'; ctx.translate(img.width/2,img.height/2); ctx.rotate(-Math.PI/6); ctx.fillText(text,0,0);
    } else if (wpos==='tile') {
      ctx.textAlign='left';
      var stepX=tw+img.width*0.25, stepY=fs*3;
      for (var ty=-img.height;ty<img.height*2;ty+=stepY) {
        for (var tx=-img.width;tx<img.width*2;tx+=stepX) {
          ctx.save(); ctx.translate(tx,ty); ctx.rotate(-Math.PI/8); ctx.fillText(text,0,0); ctx.restore();
        }
      }
    } else {
      ctx.textAlign='left';
      var wx, wy;
      if (wpos==='bottom-right') { wx=img.width-tw-pad; wy=img.height-pad; }
      else if (wpos==='bottom-left') { wx=pad; wy=img.height-pad; }
      else if (wpos==='top-right') { wx=img.width-tw-pad; wy=pad+fs/2; }
      else { wx=pad; wy=pad+fs/2; }
      ctx.fillText(text,wx,wy);
    }
    ctx.restore();
    var blob = await toBlob(c,'image/jpeg',0.92);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_watermarked.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tGrayscale() {
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Converting '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    var id = ctx.getImageData(0,0,c.width,c.height);
    for (var j=0;j<id.data.length;j+=4){ var g=id.data[j]*0.299+id.data[j+1]*0.587+id.data[j+2]*0.114; id.data[j]=id.data[j+1]=id.data[j+2]=g; }
    ctx.putImageData(id,0,0);
    var blob = await toBlob(c,'image/jpeg',0.92);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_gray.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tFlip() {
  var dir  = document.getElementById('optFlip').value;
  var fmt  = document.getElementById('optFlipFmt') ? document.getElementById('optFlipFmt').value : 'jpeg';
  var mime = fmt==='png'?'image/png':'image/jpeg'; var ext = fmt==='png'?'png':'jpg';
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Flipping '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d');
    if (dir==='h'||dir==='both') { ctx.translate(c.width,0); ctx.scale(-1,1); }
    if (dir==='v'||dir==='both') { ctx.translate(0,c.height); ctx.scale(1,-1); }
    ctx.drawImage(img,0,0);
    var blob = await toBlob(c,mime,0.92);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_flipped.'+ext, size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tRotateImg() {
  var customVal = document.getElementById('optRotCustom') ? document.getElementById('optRotCustom').value.trim() : '';
  var angle = (customVal !== '') ? parseInt(customVal)||0 : parseInt(document.getElementById('optRotI').value)||90;
  var bg    = document.getElementById('optRotBg') ? document.getElementById('optRotBg').value : 'white';
  var usePng = bg==='transparent';
  var rad = angle*Math.PI/180;
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Rotating '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var sinA=Math.abs(Math.sin(rad)), cosA=Math.abs(Math.cos(rad));
    var nw=Math.round(img.width*cosA+img.height*sinA), nh=Math.round(img.width*sinA+img.height*cosA);
    var c = document.createElement('canvas'); c.width=nw; c.height=nh;
    var ctx = c.getContext('2d');
    if (!usePng) { ctx.fillStyle=bg; ctx.fillRect(0,0,nw,nh); }
    ctx.translate(nw/2,nh/2); ctx.rotate(rad); ctx.drawImage(img,-img.width/2,-img.height/2);
    var blob = await toBlob(c, usePng?'image/png':'image/jpeg', 0.92);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_rotated.'+(usePng?'png':'jpg'), size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tBrightness() {
  var b  = parseInt(document.getElementById('optB').value)||0;
  var con= parseInt(document.getElementById('optC').value)||0;
  var sat= parseInt(document.getElementById('optSat') ? document.getElementById('optSat').value : '0')||0;
  var hue= parseInt(document.getElementById('optHue') ? document.getElementById('optHue').value : '0')||0;
  var factor=(259*(con+255))/(255*(259-con));
  function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<0.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Adjusting '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    var id=ctx.getImageData(0,0,c.width,c.height);
    for (var j=0;j<id.data.length;j+=4){
      var r=id.data[j],g=id.data[j+1],b2=id.data[j+2];
      r=Math.min(255,Math.max(0,factor*(r-128)+128+b));
      g=Math.min(255,Math.max(0,factor*(g-128)+128+b));
      b2=Math.min(255,Math.max(0,factor*(b2-128)+128+b));
      if (sat!==0||hue!==0) {
        var mx=Math.max(r,g,b2)/255,mn=Math.min(r,g,b2)/255;
        var l=(mx+mn)/2,s2=0,h2=0;
        if(mx!==mn){s2=l<0.5?(mx-mn)/(mx+mn):(mx-mn)/(2-mx-mn);var d=mx-mn;h2=mx===r/255?(g/255-b2/255)/d+(g<b2?6:0):mx===g/255?(b2/255-r/255)/d+2:(r/255-g/255)/d+4;h2/=6;}
        if(sat!==0)s2=Math.max(0,Math.min(1,s2*(1+sat/100)));
        if(hue!==0)h2=(h2+hue/360+1)%1;
        if(s2===0){r=g=b2=l*255;}else{var q2=l<0.5?l*(1+s2):l+s2-l*s2,p2=2*l-q2;r=hue2rgb(p2,q2,h2+1/3)*255;g=hue2rgb(p2,q2,h2)*255;b2=hue2rgb(p2,q2,h2-1/3)*255;}
      }
      id.data[j]=Math.round(r); id.data[j+1]=Math.round(g); id.data[j+2]=Math.round(b2);
    }
    ctx.putImageData(id,0,0);
    var blob = await toBlob(c,'image/jpeg',0.92);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_adjusted.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tSharpen() {
  var kernel=[-1,-1,-1,-1,9,-1,-1,-1,-1];
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Sharpening '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    var src=ctx.getImageData(0,0,c.width,c.height); var dst=ctx.createImageData(c.width,c.height);
    var w=c.width; var h=c.height;
    for (var y=1;y<h-1;y++){
      for (var x=1;x<w-1;x++){
        var r=0,g=0,b=0;
        for (var ky=-1;ky<=1;ky++){ for (var kx=-1;kx<=1;kx++){ var idx=((y+ky)*w+(x+kx))*4; var kval=kernel[(ky+1)*3+(kx+1)]; r+=src.data[idx]*kval; g+=src.data[idx+1]*kval; b+=src.data[idx+2]*kval; } }
        var oi=(y*w+x)*4;
        dst.data[oi]=Math.min(255,Math.max(0,r)); dst.data[oi+1]=Math.min(255,Math.max(0,g)); dst.data[oi+2]=Math.min(255,Math.max(0,b)); dst.data[oi+3]=src.data[oi+3];
      }
    }
    ctx.putImageData(dst,0,0);
    var blob = await toBlob(c,'image/jpeg',0.92);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_sharpened.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tBlur() {
  var blurAmt = parseInt(document.getElementById('optBlur').value)||5;
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Blurring '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d'); ctx.filter='blur('+blurAmt+'px)'; ctx.drawImage(img,0,0);
    var blob = await toBlob(c,'image/jpeg',0.92);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_blurred.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tImgToPDF() {
  setP(10,'Creating PDF…'); var PDFDoc = PDFLib.PDFDocument;
  var doc = await PDFDoc.create();
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(10+80*(i/toolFiles.length)),'Adding image '+(i+1)+'…');
    var buf = await toolFiles[i].arrayBuffer();
    var isPng = toolFiles[i].type==='image/png';
    var img = isPng ? await doc.embedPng(buf) : await doc.embedJpg(buf);
    var page = doc.addPage([img.width,img.height]);
    page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
  }
  setP(95,'Saving…'); var bytes = await doc.save();
  showResults([{name:'images.pdf', size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

// ═══ NEW IMAGE TOOLS ═══

async function tInvertImg() {
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Inverting '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    var ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    var id = ctx.getImageData(0,0,c.width,c.height);
    for (var j=0;j<id.data.length;j+=4){ id.data[j]=255-id.data[j]; id.data[j+1]=255-id.data[j+1]; id.data[j+2]=255-id.data[j+2]; }
    ctx.putImageData(id,0,0);
    var blob = await toBlob(c,'image/png',1);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_inverted.png', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tAddBorder() {
  var borderSize = parseInt(document.getElementById('optBorderSize').value)||20;
  var customColor = (document.getElementById('optBorderCustom').value||'').trim();
  var borderColor = customColor || document.getElementById('optBorderColor').value || '#000000';
  var fmt = document.getElementById('optBorderFmt').value||'jpeg';
  var mime = fmt==='png'?'image/png':'image/jpeg'; var ext=fmt==='png'?'png':'jpg';
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Adding border to '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var nw = img.width + borderSize*2; var nh = img.height + borderSize*2;
    var c = document.createElement('canvas'); c.width=nw; c.height=nh;
    var ctx = c.getContext('2d');
    ctx.fillStyle = borderColor; ctx.fillRect(0,0,nw,nh);
    ctx.drawImage(img, borderSize, borderSize);
    var blob = await toBlob(c, mime, 0.95);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_bordered.'+ext, size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

async function tQRCode() {
  if (!qrLibOK) {
    // Try loading again
    await new Promise(function(res){ loadScript(QRCODE_CDN, function(){ qrLibOK=!!window.QRCode; res(); }); });
  }
  if (!window.QRCode) { toast('QR library failed to load. Check your internet connection.','err'); return; }
  var text = (document.getElementById('qrTextInput').value||'').trim();
  if (!text) { toast('Please enter text or a URL to generate a QR code!','err'); return; }
  var size = parseInt(document.getElementById('optQRSize').value)||300;
  var errLevel = document.getElementById('optQRErr') ? document.getElementById('optQRErr').value : 'M';
  setP(30,'Generating QR code…');
  var container = document.createElement('div');
  try {
    new QRCode(container, {text:text, width:size, height:size, colorDark:'#1A1218', colorLight:'#FFFFFF', correctLevel: QRCode.CorrectLevel[errLevel]||QRCode.CorrectLevel.M});
  } catch(e) { toast('Error generating QR: '+e.message,'err'); return; }
  setP(80,'Preparing download…');
  await new Promise(function(r){ setTimeout(r,200); });
  var canvas = container.querySelector('canvas') || container.querySelector('img');
  var resultArea = document.getElementById('qrResult');
  resultArea.innerHTML = '';
  if (canvas && canvas.tagName === 'CANVAS') {
    canvas.style.borderRadius = '10px';
    canvas.style.border = '2px solid var(--bdr)';
    resultArea.appendChild(canvas);
    var blob = await toBlob(canvas,'image/png',1);
    var dlBtn = document.createElement('a');
    dlBtn.className = 'btn-dl'; dlBtn.href = URL.createObjectURL(blob); dlBtn.download = 'qrcode.png'; dlBtn.textContent = '⬇ Download QR Code';
    resultArea.appendChild(dlBtn);
    resultArea.classList.add('show');
    toast('✅ QR code generated!','ok');
  } else if (canvas && canvas.tagName === 'IMG') {
    canvas.style.borderRadius = '10px'; canvas.style.border = '2px solid var(--bdr)';
    resultArea.appendChild(canvas);
    var dlBtn = document.createElement('a');
    dlBtn.className = 'btn-dl'; dlBtn.href = canvas.src; dlBtn.download = 'qrcode.png'; dlBtn.textContent = '⬇ Download QR Code';
    resultArea.appendChild(dlBtn);
    resultArea.classList.add('show');
    toast('✅ QR code generated!','ok');
  } else { toast('Could not render QR code. Try a different text.','err'); }
  setP(100,'Done!');
  var btn = document.getElementById('runBtn');
  if (btn) { btn.textContent = '📱 Generate Another'; btn.disabled=false; btn.onclick=function(){ openTool('qrcode'); }; }
}

async function tImgInfo() {
  setP(30,'Reading image…');
  var img = await loadImgEl(toolFiles[0]);
  var size = toolFiles[0].size; var type = toolFiles[0].type || 'unknown';
  var ar = (img.width/img.height).toFixed(2);
  var arName = Math.abs(img.width/img.height - 16/9) < 0.05 ? '16:9' : Math.abs(img.width/img.height - 4/3) < 0.05 ? '4:3' : Math.abs(img.width/img.height - 1) < 0.05 ? '1:1 (Square)' : ar+':1';
  setP(80,'Done!');
  var ra = document.getElementById('resultArea');
  ra.innerHTML = '<div style="background:var(--ok-light);border:1.5px solid rgba(0,184,148,.25);border-radius:12px;padding:1rem">'+
    '<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-weight:700;margin-bottom:.7rem;font-size:.95rem">📊 Image Information</div>'+
    '<table style="width:100%;font-size:.83rem;border-collapse:collapse">'+
    '<tr><td style="padding:.3rem 0;color:var(--mut);width:45%">Dimensions</td><td><strong>'+img.width+' × '+img.height+' px</strong></td></tr>'+
    '<tr><td style="padding:.3rem 0;color:var(--mut)">File Size</td><td><strong>'+fmtSize(size)+'</strong></td></tr>'+
    '<tr><td style="padding:.3rem 0;color:var(--mut)">Format</td><td><strong>'+type.replace('image/','').toUpperCase()+'</strong></td></tr>'+
    '<tr><td style="padding:.3rem 0;color:var(--mut)">Aspect Ratio</td><td><strong>'+arName+'</strong></td></tr>'+
    '<tr><td style="padding:.3rem 0;color:var(--mut)">Total Pixels</td><td><strong>'+(img.width*img.height).toLocaleString()+'</strong></td></tr>'+
    '<tr><td style="padding:.3rem 0;color:var(--mut)">Megapixels</td><td><strong>'+((img.width*img.height)/1000000).toFixed(2)+' MP</strong></td></tr>'+
    '</table></div>';
  ra.classList.add('show');
  var btn = document.getElementById('runBtn'); if(btn){btn.disabled=false;btn.textContent='▶ Check Another Image';btn.onclick=function(){openTool('imginfo');};}
}

async function tImgBase64() {
  setP(20,'Reading image…');
  var reader = new FileReader();
  var b64 = await new Promise(function(res){ reader.onload=function(e){ res(e.target.result); }; reader.readAsDataURL(toolFiles[0]); });
  setP(80,'Preparing output…');
  var ra = document.getElementById('resultArea');
  ra.innerHTML = '<div style="background:var(--ok-light);border:1.5px solid rgba(0,184,148,.25);border-radius:12px;padding:1rem">'+
    '<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-weight:700;margin-bottom:.5rem">✅ Base64 String</div>'+
    '<textarea readonly style="width:100%;height:120px;background:var(--bg);border:1.5px solid var(--bdr);border-radius:8px;padding:.5rem;font-size:.72rem;font-family:monospace;resize:vertical;color:var(--txt)">'+b64+'</textarea>'+
    '<button onclick="navigator.clipboard.writeText(\''+b64.replace(/'/g,"\\'")+'\')" style="margin-top:.5rem;background:var(--ok);color:#fff;border:none;border-radius:9px;padding:.42rem .92rem;font-weight:700;cursor:pointer;font-size:.8rem;">📋 Copy to Clipboard</button>'+
    '<div style="font-size:.72rem;color:var(--mut);margin-top:.5rem">Length: '+(b64.length).toLocaleString()+' characters (~'+fmtSize(b64.length)+')</div></div>';
  ra.classList.add('show'); setP(100,'Done!');
  toast('✅ Base64 ready! Click copy to use it.','ok');
  var btn=document.getElementById('runBtn');if(btn){btn.disabled=false;btn.textContent='▶ Convert Another';btn.onclick=function(){openTool('imgbase64');};}
}

async function tRemoveEXIF() {
  var results = [];
  for (var i = 0; i < toolFiles.length; i++) {
    setP(Math.round(5+90*(i/toolFiles.length)),'Removing EXIF from '+(i+1)+'…');
    var img = await loadImgEl(toolFiles[i]);
    var c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    c.getContext('2d').drawImage(img,0,0); // Redrawing strips EXIF
    var blob = await toBlob(c,'image/jpeg',0.95);
    var base = toolFiles[i].name.replace(/\.[^.]+$/,'');
    results.push({name:base+'_clean.jpg', size:fmtSize(blob.size), url:URL.createObjectURL(blob)});
  }
  showResults(results);
}

// ═══ DYNAMIC OPTION HELPERS ═══
function toggleSplitMode(val) {
  var r=document.getElementById('splitRangeOpts'),e=document.getElementById('splitEveryOpts'),rm=document.getElementById('splitRemoveOpts');
  if(r) r.style.display=val==='range'?'':'none';
  if(e) e.style.display=val==='every'?'':'none';
  if(rm) rm.style.display=val==='remove'?'':'none';
}
function applyResizePreset(val) {
  if (!val) return;
  var parts=val.split('x');
  var w=document.getElementById('optW'); var h=document.getElementById('optH');
  if(w) w.value=parts[0]; if(h) h.value=parts[1];
}
function applySquareCrop(val) { if(val) toast('Enter image dimensions above to set precise crop coordinates.','info'); }
document.addEventListener('change', function(e) {
  if (!e.target) return;
  if (e.target.id==='optRotScope') { var d=document.getElementById('rotCustomPages'); if(d) d.style.display=e.target.value==='custom'?'':'none'; }
  if (e.target.id==='optPDFPages') { var d2=document.getElementById('pdfPageRange'); if(d2) d2.style.display=e.target.value==='range'?'':'none'; }
});

// ═══ SIDE MENU ═══
function toggleSideMenu() {
  var menu=document.getElementById('sideMenu'),btn=document.getElementById('hamBtn'),overlay=document.getElementById('sideOverlay');
  if (menu.classList.contains('open')) { closeSideMenu(); }
  else { menu.classList.add('open'); btn.classList.add('open'); overlay.classList.add('show'); document.body.style.overflow='hidden'; }
}
function closeSideMenu() {
  document.getElementById('sideMenu').classList.remove('open');
  document.getElementById('hamBtn').classList.remove('open');
  document.getElementById('sideOverlay').classList.remove('show');
  document.body.style.overflow='';
}

// ═══ AUTH ═══
function openAuth(tab) { switchTab(tab); document.getElementById('authOv').classList.add('active'); document.body.style.overflow='hidden'; }
function closeAuth() { document.getElementById('authOv').classList.remove('active'); document.body.style.overflow=''; }
function switchTab(t) {
  document.getElementById('tabA').classList.toggle('active', t==='login');
  document.getElementById('tabB').classList.toggle('active', t==='signup');
  document.getElementById('panelLogin').classList.toggle('show', t==='login');
  document.getElementById('panelSignup').classList.toggle('show', t==='signup');
}
function doLogin() {
  var email=document.getElementById('lEmail').value.trim(), pass=document.getElementById('lPass').value.trim();
  if (!email||!pass) { toast('Please fill all fields!','err'); return; }
  var users=[]; try { users=JSON.parse(localStorage.getItem('fpdf_users')||'[]'); } catch(e){}
  var user=users.find(function(u){ return u.email===email&&u.pass===pass; });
  if (!user) { toast('Incorrect email or password!','err'); return; }
  currentUser=user; localStorage.setItem('fpdf_user',JSON.stringify(user)); closeAuth(); updateNav(); toast('👋 Welcome back, '+user.first+'!','ok');
}
function doSignup() {
  var first=document.getElementById('sFirst').value.trim(), last=document.getElementById('sLast').value.trim();
  var email=document.getElementById('sEmail').value.trim(), pass=document.getElementById('sPass').value.trim();
  if (!first||!last||!email||!pass) { toast('Please fill all fields!','err'); return; }
  if (pass.length<6) { toast('Password must be at least 6 characters!','err'); return; }
  var users=[]; try { users=JSON.parse(localStorage.getItem('fpdf_users')||'[]'); } catch(e){}
  if (users.find(function(u){ return u.email===email; })) { toast('This email is already registered!','err'); return; }
  var newUser={name:first+' '+last, first:first, email:email, pass:pass};
  users.push(newUser); localStorage.setItem('fpdf_users',JSON.stringify(users));
  currentUser=newUser; localStorage.setItem('fpdf_user',JSON.stringify(newUser)); closeAuth(); updateNav(); toast('🎉 Welcome to PDFSnap, '+first+'!','ok');
}
function doLogout() {
  currentUser=null; localStorage.removeItem('fpdf_user'); updateNav(); toast('Logged out. See you next time!','info');
  var uMenu=document.getElementById('uMenu'); if(uMenu) uMenu.classList.remove('open');
}
function updateNav() {
  var avatar=document.getElementById('uAvatar'), menuName=document.getElementById('uMenuName');
  var loginBtn=document.querySelector('.btn-login'), signupBtn=document.getElementById('btnSignup');
  if (currentUser) {
    if(avatar){avatar.classList.add('show');avatar.textContent=currentUser.first?currentUser.first[0].toUpperCase():'👤';}
    if(menuName) menuName.textContent=currentUser.name||currentUser.email;
    if(loginBtn) loginBtn.style.display='none'; if(signupBtn) signupBtn.style.display='none';
  } else {
    if(avatar) avatar.classList.remove('show');
    if(loginBtn) loginBtn.style.display=''; if(signupBtn) signupBtn.style.display='';
  }
}
function toggleMenu() { var m=document.getElementById('uMenu'); if(m) m.classList.toggle('open'); }
document.addEventListener('click', function(e){ var m=document.getElementById('uMenu'); if(m&&m.classList.contains('open')&&!e.target.closest('.u-wrap')) m.classList.remove('open'); });

// ═══ PROFILE ═══
function showProfile() {
  if (!currentUser) { openAuth('login'); return; }
  document.getElementById('mainWrap').style.display='none';
  document.getElementById('profileSec').classList.add('show');
  document.getElementById('pAvatar').textContent=currentUser.first?currentUser.first[0].toUpperCase():'👤';
  document.getElementById('pName').textContent=currentUser.name;
  document.getElementById('pEmail').textContent=currentUser.email;
  var reps=[]; try { reps=JSON.parse(localStorage.getItem('fpdf_reports')||'[]'); } catch(e){}
  var rl=document.getElementById('repList');
  if (!reps.length) { rl.innerHTML='<p style="color:var(--mut);font-size:.84rem">No reports yet. If a tool ever breaks, hit the ⚑ button!</p>'; return; }
  rl.innerHTML='';
  reps.slice().reverse().forEach(function(r){
    var d=document.createElement('div'); d.className='rep-entry';
    d.innerHTML='<div class="re-info"><div class="re-tool">'+r.tool+'</div><div class="re-meta">'+r.type+' · '+r.date+'</div>'+(r.desc?'<div class="re-desc">'+r.desc+'</div>':'')+'</div><span class="re-badge">Pending</span>';
    rl.appendChild(d);
  });
}
function showMain() { document.getElementById('mainWrap').style.display=''; document.getElementById('profileSec').classList.remove('show'); }

// ═══ REPORT ═══
function openRep(e, toolName) {
  e.stopPropagation(); repToolName=toolName;
  document.getElementById('repSub').textContent='Found an issue with: '+toolName;
  document.getElementById('rDesc').value='';
  document.getElementById('rEmail').value=currentUser?currentUser.email:'';
  document.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
  document.getElementById('repOv').classList.add('active'); document.body.style.overflow='hidden';
}
function closeRep() { document.getElementById('repOv').classList.remove('active'); document.body.style.overflow=''; }
function pickChip(el) { document.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); }); el.classList.add('sel'); }
async function submitRep() {
  var chip=document.querySelector('.chip.sel'); var type=chip?chip.textContent:'';
  var desc=(document.getElementById('rDesc').value||'').trim();
  var email=(document.getElementById('rEmail').value||'').trim();
  if (!type) { toast('Please select an issue type!','err'); return; }
  var btn=document.getElementById('repSubmitBtn'); btn.disabled=true; btn.textContent='Sending…';
  try { await fetch('https://formspree.io/f/mlgpvjqg',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({tool:repToolName,type:type,description:desc,email:email||'anonymous',date:new Date().toLocaleDateString()})}); } catch(e){}
  var all=[]; try { all=JSON.parse(localStorage.getItem('fpdf_reports')||'[]'); } catch(e){}
  all.push({tool:repToolName,type:type,desc:desc,email:email||'anonymous',date:new Date().toLocaleDateString()});
  localStorage.setItem('fpdf_reports',JSON.stringify(all));
  closeRep(); toast('🙏 Report submitted! We\'ll look into it.','ok');
  btn.disabled=false; btn.textContent='Submit Report';
}

// ═══ SHARE ═══
var _shareUrl='', _shareText='';
function shareTool(e, toolId, toolName) {
  e.stopPropagation();
  var url='https://pdfsnap.github.io/#'+toolId;
  var text='Check out this free '+toolName+' tool — no signup, runs in your browser!';
  _shareUrl=url; _shareText=text;
  document.getElementById('shareUrlInput').value=url;
  document.getElementById('shareSubTxt').textContent='Share "'+toolName+'" with someone who needs it!';
  document.getElementById('shareWhatsApp').href='https://wa.me/?text='+encodeURIComponent(text+' '+url);
  document.getElementById('shareTwitter').href='https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(url);
  document.getElementById('shareFacebook').href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url);
  document.getElementById('shareLinkedIn').href='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url);
  document.getElementById('shareEmail').href='mailto:?subject='+encodeURIComponent('Free '+toolName)+'&body='+encodeURIComponent(text+'\n\n'+url);
  document.getElementById('shareOv').classList.add('active'); document.body.style.overflow='hidden';
}
function closeShare() { document.getElementById('shareOv').classList.remove('active'); document.body.style.overflow=''; }
function copyShareUrl() {
  var inp=document.getElementById('shareUrlInput'); inp.select(); inp.setSelectionRange(0,9999);
  try { document.execCommand('copy'); toast('🔗 Link copied!','ok'); }
  catch(e) { navigator.clipboard.writeText(_shareUrl).then(function(){ toast('🔗 Link copied!','ok'); }); }
}
function nativeShare() {
  if (navigator.share) { navigator.share({title:'PDFSnap', text:_shareText, url:_shareUrl}).then(function(){ closeShare(); }).catch(function(){}); }
  else { copyShareUrl(); }
}
document.getElementById('shareOv').addEventListener('click', function(e){ if(e.target===this) closeShare(); });

// ═══ TOAST ═══
function toast(msg, type) {
  type=type||'info'; var icons={ok:'✅',err:'❌',info:'ℹ️'};
  var el=document.createElement('div'); el.className='toast t-'+type;
  el.innerHTML='<span>'+(icons[type]||'ℹ️')+'</span><span>'+msg+'</span>';
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },4000);
}
