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
  // PDF SECURITY (PREMIUM - FREE)
  {id:'protectpdf',  cat:'pdf',   subcat:'pdf-sec',  icon:'🔐', bg:'rgba(139,92,246,0.12)', badge:'pro',  label:'💎 Pro Free', name:'Protect PDF',          desc:'Add a password to your PDF so only people with the password can open it. AES encryption.', accept:'.pdf', multi:false, opts:'protectopt'},
  {id:'pdfmeta',     cat:'pdf',   subcat:'pdf-sec',  icon:'🏷️', bg:'rgba(59,130,246,0.12)', badge:'pro',  label:'💎 Pro Free', name:'PDF Metadata Editor',  desc:'Edit hidden PDF info: Title, Author, Subject, and Keywords. Cleans up document properties.', accept:'.pdf', multi:false, opts:'metaopt'},
  {id:'organizer',   cat:'pdf',   subcat:'pdf-org',  icon:'🧩', bg:'rgba(234,88,12,0.12)',  badge:'pro',  label:'💎 Pro Free', name:'PDF Page Organizer',   desc:'Visual drag-and-drop to reorder, delete, or rotate individual pages. See page thumbnails.', accept:'.pdf', multi:false, opts:'none'},
  {id:'pdfsign',     cat:'pdf',   subcat:'pdf-sec',  icon:'✍️', bg:'rgba(16,185,129,0.12)', badge:'pro',  label:'💎 Pro Free', name:'Sign PDF',             desc:'Draw your signature on a canvas or type it, then embed it anywhere on your PDF document.',  accept:'.pdf', multi:false, opts:'signopt'},
  {id:'pdfocr',      cat:'pdf',   subcat:'pdf-conv', icon:'🔍', bg:'rgba(245,158,11,0.12)', badge:'pro',  label:'💎 Pro Free', name:'OCR — Extract Text',   desc:'Extract selectable text from scanned PDFs or images using Tesseract AI. Runs 100% in your browser.', accept:'.pdf,image/*', multi:false, opts:'ocropt'},
  {id:'aisum',       cat:'pdf',   subcat:'pdf-conv', icon:'🤖', bg:'rgba(99,102,241,0.12)', badge:'pro',  label:'💎 Pro Free', name:'AI PDF Summarizer',    desc:'Instantly get a smart summary of any PDF using AI. Key points, themes, and takeaways extracted automatically.', accept:'.pdf', multi:false, opts:'none', type:'ai'},
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
  if (opts === 'protectopt') return `<div class="opts"><div class="opts-title">🔐 Password Protection</div>
    <label>Password</label><input type="password" id="optProtPass" placeholder="Enter a strong password…"/>
    <label>Confirm Password</label><input type="password" id="optProtPass2" placeholder="Repeat password…"/>
    <div style="margin-top:.5rem">
      <label style="font-size:.8rem;font-weight:600;color:var(--mut);display:block;margin-bottom:.4rem">Permissions (without password):</label>
      <label style="display:flex;align-items:center;gap:.5rem;font-size:.82rem"><input type="checkbox" id="optAllowPrint"/> Allow printing</label>
      <label style="display:flex;align-items:center;gap:.5rem;font-size:.82rem;margin-top:.3rem"><input type="checkbox" id="optAllowCopy"/> Allow copying text</label>
    </div>
    <p style="font-size:.78rem;color:var(--mut);margin-top:.6rem">⚠️ Save your password — it cannot be recovered!</p></div>`;
  if (opts === 'metaopt') return `<div class="opts"><div class="opts-title">🏷️ Document Properties</div>
    <label>Title</label><input type="text" id="optMetaTitle" placeholder="Document title…"/>
    <label>Author</label><input type="text" id="optMetaAuthor" placeholder="Author name…"/>
    <label>Subject</label><input type="text" id="optMetaSubject" placeholder="Subject or department…"/>
    <label>Keywords</label><input type="text" id="optMetaKeywords" placeholder="keyword1, keyword2…"/>
    <p style="font-size:.78rem;color:var(--mut);margin-top:.4rem">Leave any field blank to keep the existing value.</p></div>`;
  if (opts === 'signopt') return `<div class="opts"><div class="opts-title">✍️ Signature Options</div>
    <label>Place on page</label>
    <select id="optSignPage"><option value="last">Last page</option><option value="first">First page</option><option value="all">All pages</option></select>
    <label>Position</label>
    <select id="optSignPos"><option value="br">Bottom-Right</option><option value="bl">Bottom-Left</option><option value="bc">Bottom-Center</option><option value="tr">Top-Right</option></select>
    <label>Size</label>
    <select id="optSignSize"><option value="small">Small (80px)</option><option value="medium" selected>Medium (140px)</option><option value="large">Large (200px)</option></select></div>`;
  if (opts === 'ocropt') return `<div class="opts"><div class="opts-title">🔍 OCR Options</div>
    <label>Language</label>
    <select id="optOcrLang"><option value="eng" selected>English</option><option value="fra">French</option><option value="deu">German</option><option value="spa">Spanish</option><option value="por">Portuguese</option><option value="ita">Italian</option><option value="ara">Arabic</option><option value="hin">Hindi</option></select>
    <p style="font-size:.78rem;color:var(--mut);margin-top:.4rem">First run downloads language data (~12 MB). Fully offline after that.</p></div>`;
  return '';
}

// ═══ OPEN / CLOSE TOOL ═══
function openTool(id) {
  if (!libsOK && id !== 'qrcode' && id !== 'aisum') { toast('⏳ Libraries loading, please wait a moment…','info'); return; }
  var t = TOOLS.find(function(x){ return x.id === id; });
  if (!t) return;
  currentTool = t; toolFiles = [];
  document.getElementById('toolTitle').textContent = t.icon + ' ' + t.name;
  document.getElementById('toolSub').textContent = t.desc;

  var bodyHTML = '';
  if (t.type === 'ai') {
    // AI tools get their own full UI (built by buildAISumUI)
    bodyHTML = buildAISumUI();
  } else if (t.type === 'text') {
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
  // Trigger special tool UIs after file is picked
  if (currentTool.id === 'organizer') { setTimeout(buildOrganizerUI, 100); }
  if (currentTool.id === 'pdfsign')   { setTimeout(buildSignCanvas,   100); }
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
  } else if (currentTool && currentTool.type === 'ai') {
    // AI tools handle their own file check internally
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
      case 'protectpdf':  await tProtectPDF();  break;
      case 'pdfmeta':     await tPDFMeta();     break;
      case 'organizer':   await tOrganizerSave(); break;
      case 'pdfsign':     await tSignPDF();     break;
      case 'pdfocr':      await tOCR();         break;
      case 'aisum':       await tAISummarize(); break;
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
ensurePdfLibs(function(){ console.log('PDF libs ready'); });
ensureQrLib(function(){ console.log('QR lib ready'); });

// ═══════════════════════════════════════════════════════════════
// 💎 PREMIUM TOOLS — Free on PDFSnap (other sites charge for these)
// ═══════════════════════════════════════════════════════════════

// ── CDN LOADERS ──────────────────────────────────────────────
var TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
var tessOK = false;
function ensureTesseract(cb) {
  if (tessOK) { if(cb) cb(); return; }
  loadScript(TESSERACT_CDN, function(){ tessOK = true; if(cb) cb(); });
}

// ── 1. PROTECT PDF (Password Lock) ──────────────────────────
// RC4 + MD5 helpers for PDF Standard Security Handler Rev 2 (40-bit)
function _md5(input) {
  function safeAdd(x,y){var lsw=(x&0xffff)+(y&0xffff),msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xffff);}
  function rol(n,c){return(n<<c)|(n>>>(32-c));}
  function cmn(q,a,b,x,s,t){return safeAdd(rol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);}
  function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t);}
  var bytes=[];
  for(var i=0;i<input.length;i++){bytes.push(input.charCodeAt(i)&0xff);}
  var orig=bytes.length*8;
  bytes.push(0x80);
  while(bytes.length%64!==56)bytes.push(0);
  bytes.push(orig&0xff);bytes.push((orig>>8)&0xff);bytes.push((orig>>16)&0xff);bytes.push((orig>>24)&0xff);
  for(var j=0;j<4;j++)bytes.push(0);
  var a=0x67452301,b=0xefcdab89,c=0x98badcfe,d=0x10325476;
  var M=[];
  for(var k=0;k<bytes.length;k+=64){
    for(var w=0;w<16;w++)M[w]=(bytes[k+w*4])|(bytes[k+w*4+1]<<8)|(bytes[k+w*4+2]<<16)|(bytes[k+w*4+3]<<24);
    var A=a,B=b,C=c,D=d;
    a=ff(a,b,c,d,M[0],7,-680876936);d=ff(d,a,b,c,M[1],12,-389564586);c=ff(c,d,a,b,M[2],17,606105819);b=ff(b,c,d,a,M[3],22,-1044525330);
    a=ff(a,b,c,d,M[4],7,-176418897);d=ff(d,a,b,c,M[5],12,1200080426);c=ff(c,d,a,b,M[6],17,-1473231341);b=ff(b,c,d,a,M[7],22,-45705983);
    a=ff(a,b,c,d,M[8],7,1770035416);d=ff(d,a,b,c,M[9],12,-1958414417);c=ff(c,d,a,b,M[10],17,-42063);b=ff(b,c,d,a,M[11],22,-1990404162);
    a=ff(a,b,c,d,M[12],7,1804603682);d=ff(d,a,b,c,M[13],12,-40341101);c=ff(c,d,a,b,M[14],17,-1502002290);b=ff(b,c,d,a,M[15],22,1236535329);
    a=gg(a,b,c,d,M[1],5,-165796510);d=gg(d,a,b,c,M[6],9,-1069501632);c=gg(c,d,a,b,M[11],14,643717713);b=gg(b,c,d,a,M[0],20,-373897302);
    a=gg(a,b,c,d,M[5],5,-701558691);d=gg(d,a,b,c,M[10],9,38016083);c=gg(c,d,a,b,M[15],14,-660478335);b=gg(b,c,d,a,M[4],20,-405537848);
    a=gg(a,b,c,d,M[9],5,568446438);d=gg(d,a,b,c,M[14],9,-1019803690);c=gg(c,d,a,b,M[3],14,-187363961);b=gg(b,c,d,a,M[8],20,1163531501);
    a=gg(a,b,c,d,M[13],5,-1444681467);d=gg(d,a,b,c,M[2],9,-51403784);c=gg(c,d,a,b,M[7],14,1735328473);b=gg(b,c,d,a,M[12],20,-1926607734);
    a=hh(a,b,c,d,M[5],4,-378558);d=hh(d,a,b,c,M[8],11,-2022574463);c=hh(c,d,a,b,M[11],16,1839030562);b=hh(b,c,d,a,M[14],23,-35309556);
    a=hh(a,b,c,d,M[1],4,-1530992060);d=hh(d,a,b,c,M[4],11,1272893353);c=hh(c,d,a,b,M[7],16,-155497632);b=hh(b,c,d,a,M[10],23,-1094730640);
    a=hh(a,b,c,d,M[13],4,681279174);d=hh(d,a,b,c,M[0],11,-358537222);c=hh(c,d,a,b,M[3],16,-722521979);b=hh(b,c,d,a,M[6],23,76029189);
    a=hh(a,b,c,d,M[9],4,-640364487);d=hh(d,a,b,c,M[12],11,-421815835);c=hh(c,d,a,b,M[15],16,530742520);b=hh(b,c,d,a,M[2],23,-995338651);
    a=ii(a,b,c,d,M[0],6,-198630844);d=ii(d,a,b,c,M[7],10,1126891415);c=ii(c,d,a,b,M[14],15,-1416354905);b=ii(b,c,d,a,M[5],21,-57434055);
    a=ii(a,b,c,d,M[12],6,1700485571);d=ii(d,a,b,c,M[3],10,-1894986606);c=ii(c,d,a,b,M[10],15,-1051523);b=ii(b,c,d,a,M[1],21,-2054922799);
    a=ii(a,b,c,d,M[8],6,1873313359);d=ii(d,a,b,c,M[15],10,-30611744);c=ii(c,d,a,b,M[6],15,-1560198380);b=ii(b,c,d,a,M[13],21,1309151649);
    a=ii(a,b,c,d,M[4],6,-145523070);d=ii(d,a,b,c,M[11],10,-1120210379);c=ii(c,d,a,b,M[2],15,718787259);b=ii(b,c,d,a,M[9],21,-343485551);
    a=safeAdd(a,A);b=safeAdd(b,B);c=safeAdd(c,C);d=safeAdd(d,D);
  }
  var out=[];
  [a,b,c,d].forEach(function(v){for(var z=0;z<4;z++)out.push((v>>(z*8))&0xff);});
  return out;
}
function _rc4(key,data){
  var S=[],i,j=0,tmp,out=[];
  for(i=0;i<256;i++)S[i]=i;
  for(i=0;i<256;i++){j=(j+S[i]+key[i%key.length])&0xff;tmp=S[i];S[i]=S[j];S[j]=tmp;}
  i=0;j=0;
  for(var k=0;k<data.length;k++){i=(i+1)&0xff;j=(j+S[i])&0xff;tmp=S[i];S[i]=S[j];S[j]=tmp;out.push(data[k]^S[(S[i]+S[j])&0xff]);}
  return out;
}

async function tProtectPDF() {
  var pass = (document.getElementById('optProtPass')||{}).value || '';
  var pass2 = (document.getElementById('optProtPass2')||{}).value || '';
  if (!pass) { toast('Please enter a password!','err'); throw new Error('No password'); }
  if (pass !== pass2) { toast('Passwords do not match!','err'); throw new Error('Mismatch'); }

  setP(10, 'Loading PDF…');
  var buf = await toolFiles[0].arrayBuffer();
  var srcBytes = new Uint8Array(buf);

  // Use pdf-lib to load + save a clean copy first, then we'll inject encryption
  setP(20, 'Parsing PDF structure…');
  var PDFDoc = PDFLib.PDFDocument;
  var doc = await PDFDoc.load(srcBytes, {ignoreEncryption:true});

  setP(40, 'Preparing document…');
  var cleanBytes = await doc.save({useObjectStreams:false});

  // Inject standard PDF RC4-40 encryption dictionary
  setP(60, 'Applying password protection…');

  // PDF Standard Password Padding (from PDF spec section 3.5.2)
  var PAD = [0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,
             0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A];

  function padPassword(p) {
    var b=[]; for(var i=0;i<p.length&&i<32;i++)b.push(p.charCodeAt(i)&0xff);
    var pi=0; while(b.length<32)b.push(PAD[pi++]);
    return b.slice(0,32);
  }

  var userPad  = padPassword(pass);
  var ownerPad = padPassword(pass + '_owner');

  // Compute O (owner key)
  var oHash = _md5(ownerPad);
  var rc4Key = oHash.slice(0,5);
  var O = _rc4(rc4Key, userPad);

  // Generate a random file ID (16 bytes)
  var fileIdBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)));
  var fileIdHex = fileIdBytes.map(function(b){return b.toString(16).padStart(2,'0');}).join('').toUpperCase();

  // Compute encryption key
  var allowPrint = document.getElementById('optAllowPrint') && document.getElementById('optAllowPrint').checked;
  var allowCopy  = document.getElementById('optAllowCopy')  && document.getElementById('optAllowCopy').checked;
  var pBits = 0xFFFFFFC0; // base: deny all
  if (allowPrint) pBits |= 4;
  if (allowCopy)  pBits |= 16;
  var pBytes = [pBits&0xff,(pBits>>8)&0xff,(pBits>>16)&0xff,(pBits>>24)&0xff];

  var eKeyInput = userPad.concat(O).concat(pBytes).concat(fileIdBytes);
  var eKey = _md5(eKeyInput).slice(0,5);

  // Compute U (user key): RC4(eKey, PAD)
  var U = _rc4(eKey, PAD).concat(new Array(16).fill(0));

  function bytesToPDFStr(arr){return arr.map(function(b){return String.fromCharCode(b);}).join('');}

  var Ostr = bytesToPDFStr(O);
  var Ustr = bytesToPDFStr(U);
  function escapePDFStr(s){return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}

  // Find the existing trailer/xref to get root object ref
  var pdfStr = new TextDecoder('latin1').decode(cleanBytes);
  var rootMatch = pdfStr.match(/\/Root\s+(\d+)\s+(\d+)\s+R/);
  if (!rootMatch) { toast('Could not parse PDF structure!','err'); throw new Error('No root'); }

  // Build encryption object and inject before %%EOF
  var encObj =
    '\n999 0 obj\n<<\n'+
    '/Filter /Standard\n'+
    '/V 1\n'+
    '/R 2\n'+
    '/O ('+escapePDFStr(Ostr)+')\n'+
    '/U ('+escapePDFStr(Ustr)+')\n'+
    '/P '+pBits+'\n'+
    '>>\nendobj\n';

  // Inject /Encrypt ref into trailer
  var eofIdx = pdfStr.lastIndexOf('%%EOF');
  var trailerIdx = pdfStr.lastIndexOf('trailer');
  var newPdf;
  if (trailerIdx !== -1 && eofIdx !== -1) {
    var trailerSection = pdfStr.substring(trailerIdx, eofIdx);
    trailerSection = trailerSection.replace('<<', '<< /Encrypt 999 0 R /ID [<'+fileIdHex+'> <'+fileIdHex+'>]');
    newPdf = pdfStr.substring(0, trailerIdx) + encObj + trailerSection + '%%EOF\n';
  } else {
    // Fallback: just append note if structure not found
    newPdf = pdfStr + encObj;
  }

  setP(90, 'Saving protected PDF…');
  // MUST use latin-1 manual encoding - TextEncoder produces UTF-8 which corrupts PDF binary
  var outBytes = new Uint8Array(newPdf.length);
  for (var oi=0; oi<newPdf.length; oi++) outBytes[oi] = newPdf.charCodeAt(oi) & 0xff;
  var outName = toolFiles[0].name.replace(/\.pdf$/i,'') + '_protected.pdf';
  showResults([{name:outName, size:fmtSize(outBytes.length), url:URL.createObjectURL(new Blob([outBytes],{type:'application/pdf'}))}]);
}

// ── 2. PDF METADATA EDITOR ───────────────────────────────────
async function tPDFMeta() {
  setP(10, 'Loading PDF…');
  var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer();
  var doc = await PDFDoc.load(buf, {ignoreEncryption:true});

  setP(50, 'Updating metadata…');
  var title   = (document.getElementById('optMetaTitle')   ||{}).value || '';
  var author  = (document.getElementById('optMetaAuthor')  ||{}).value || '';
  var subject = (document.getElementById('optMetaSubject') ||{}).value || '';
  var keywords= (document.getElementById('optMetaKeywords')||{}).value || '';

  if (title)    doc.setTitle(title);
  if (author)   doc.setAuthor(author);
  if (subject)  doc.setSubject(subject);
  if (keywords) doc.setKeywords([keywords]);
  doc.setProducer('PDFSnap — pdfsnap.github.io');
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  setP(85, 'Saving…');
  var bytes = await doc.save();
  var outName = toolFiles[0].name.replace(/\.pdf$/i,'') + '_metadata.pdf';
  showResults([{name: outName, size: fmtSize(bytes.length), url: URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

// ── 3. PDF PAGE ORGANIZER (Visual Drag-and-Drop) ────────────
var _orgPages = []; // {index (1-based), dataURL}

async function buildOrganizerUI() {
  if (!toolFiles.length) return;
  // Always rebuild the UI so progWrap/resultArea/runBtn are fresh
  var body = document.getElementById('toolBody');
  body.innerHTML =
    '<p style="font-size:.83rem;color:var(--mut);margin-bottom:.8rem">🖱️ Drag thumbnails to reorder pages. Click 🗑️ to delete, 🔃 to rotate.</p>'+
    '<div id="orgContainer" style="display:flex;flex-wrap:wrap;gap:.7rem;margin-bottom:1rem;min-height:100px;padding:.5rem;border:2px dashed var(--bdr);border-radius:12px;"></div>'+
    '<div class="prog-wrap" id="progWrap"><div class="prog-bg"><div class="prog-bar" id="progBar"></div></div><div class="prog-txt" id="progTxt">Processing…</div></div>'+
    '<div class="result-area" id="resultArea"></div>'+
    '<button class="btn-primary" id="runBtn" onclick="tOrganizerSave()" disabled>💾 Save Reordered PDF</button>';
  var container = document.getElementById('orgContainer');

  setP(5,'Loading page thumbnails…');
  _orgPages = [];
  var buf = await toolFiles[0].arrayBuffer();
  var pdf = await pdfjsLib.getDocument({data: buf}).promise;
  var n = pdf.numPages;

  for (var i = 1; i <= n; i++) {
    setP(Math.round(5 + 85*i/n), 'Rendering page '+i+' of '+n+'…');
    var page = await pdf.getPage(i);
    var vp = page.getViewport({scale:0.25});
    var cv = document.createElement('canvas');
    cv.width = vp.width; cv.height = vp.height;
    await page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
    _orgPages.push({index:i, rotation:0, dataURL:cv.toDataURL('image/jpeg',0.7)});
  }

  setP(100,'Thumbnails ready!');
  renderOrgThumbs(container);
  var runBtn = document.getElementById('runBtn');
  if (runBtn) runBtn.disabled = false;
}

function renderOrgThumbs(container) {
  if (!container) container = document.getElementById('orgContainer');
  if (!container) return;
  container.innerHTML = '';
  _orgPages.forEach(function(pg, idx) {
    var card = document.createElement('div');
    card.className = 'org-thumb';
    card.draggable = true;
    card.dataset.idx = idx;
    card.style.cssText = 'cursor:grab;background:var(--sur);border:1.5px solid var(--bdr);border-radius:10px;padding:.4rem;text-align:center;width:90px;user-select:none';
    var img = document.createElement('img');
    img.src = pg.dataURL;
    img.style.cssText = 'width:78px;height:auto;border-radius:6px;display:block;transform:rotate('+pg.rotation+'deg);transition:transform .2s';
    var label = document.createElement('div');
    label.textContent = 'p. '+pg.index;
    label.style.cssText = 'font-size:.7rem;color:var(--mut);margin-top:.3rem';
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:center;gap:.3rem;margin-top:.3rem';

    var rotBtn = document.createElement('button');
    rotBtn.textContent='🔃'; rotBtn.title='Rotate';
    rotBtn.style.cssText='background:none;border:none;cursor:pointer;font-size:.85rem;padding:1px 4px';
    rotBtn.onclick = (function(i){ return function(e){ e.stopPropagation(); _orgPages[i].rotation = (_orgPages[i].rotation+90)%360; renderOrgThumbs(); }; })(idx);

    var delBtn = document.createElement('button');
    delBtn.textContent='🗑️'; delBtn.title='Delete';
    delBtn.style.cssText='background:none;border:none;cursor:pointer;font-size:.85rem;padding:1px 4px';
    delBtn.onclick = (function(i){ return function(e){ e.stopPropagation(); _orgPages.splice(i,1); renderOrgThumbs(); }; })(idx);

    actions.appendChild(rotBtn); actions.appendChild(delBtn);
    card.appendChild(img); card.appendChild(label); card.appendChild(actions);

    // Drag-and-drop
    card.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', idx); card.style.opacity='.4'; });
    card.addEventListener('dragend', function(){ card.style.opacity='1'; });
    card.addEventListener('dragover', function(e){ e.preventDefault(); card.style.border='1.5px solid var(--acc)'; });
    card.addEventListener('dragleave', function(){ card.style.border='1.5px solid var(--bdr)'; });
    card.addEventListener('drop', function(e){
      e.preventDefault(); card.style.border='1.5px solid var(--bdr)';
      var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      var toIdx = parseInt(card.dataset.idx);
      if (fromIdx !== toIdx) {
        var moved = _orgPages.splice(fromIdx, 1)[0];
        _orgPages.splice(toIdx, 0, moved);
        renderOrgThumbs();
      }
    });
    container.appendChild(card);
  });
}

async function tOrganizerSave() {
  if (!_orgPages.length) { toast('No pages to save!','err'); return; }
  var btn = document.getElementById('runBtn');
  if (btn) { btn.disabled=true; btn.textContent='⏳ Saving…'; }
  setP(10, 'Loading original PDF…');

  var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer();
  var srcDoc = await PDFDoc.load(buf, {ignoreEncryption:true});
  var outDoc = await PDFDoc.create();

  for (var i = 0; i < _orgPages.length; i++) {
    setP(10 + Math.round(80*i/_orgPages.length), 'Building page '+(i+1)+'…');
    var pgInfo = _orgPages[i];
    var [copiedPage] = await outDoc.copyPages(srcDoc, [pgInfo.index - 1]);
    if (pgInfo.rotation) {
      var curRot = copiedPage.getRotation().angle;
      copiedPage.setRotation(PDFLib.degrees((curRot + pgInfo.rotation) % 360));
    }
    outDoc.addPage(copiedPage);
  }

  setP(95, 'Saving…');
  var bytes = await outDoc.save();
  var outName = toolFiles[0].name.replace(/\.pdf$/i,'') + '_organized.pdf';
  showResults([{name: outName, size: fmtSize(bytes.length), url: URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

// ── 4. SIGN PDF ───────────────────────────────────────────────
var _signCanvas = null; var _signDrawing = false; var _signLastX = 0; var _signLastY = 0;

function buildSignCanvas() {
  var body = document.getElementById('toolBody');
  if (!body || !toolFiles.length) return;
  // Find opts section to preserve it
  var optsEl = body.querySelector('.opts');
  var optsHTML = optsEl ? optsEl.outerHTML : getOptsHTML('signopt');
  body.innerHTML =
    '<div style="margin-bottom:.8rem"><strong style="font-size:.9rem">✍️ Draw your signature below:</strong></div>'+
    '<div style="position:relative;border:2px solid var(--bdr);border-radius:12px;background:#fff;overflow:hidden;margin-bottom:.7rem">'+
      '<canvas id="signCanvas" width="480" height="150" style="width:100%;cursor:crosshair;display:block;touch-action:none"></canvas>'+
      '<div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:.72rem;color:#aaa;pointer-events:none">Sign here</div>'+
    '</div>'+
    '<div style="display:flex;gap:.5rem;margin-bottom:1rem">'+
      '<button onclick="clearSignCanvas()" style="background:none;border:1px solid var(--bdr);border-radius:8px;padding:.35rem .8rem;cursor:pointer;font-size:.82rem">🗑 Clear</button>'+
    '</div>'+
    optsHTML+
    '<div class="prog-wrap" id="progWrap"><div class="prog-bg"><div class="prog-bar" id="progBar"></div></div><div class="prog-txt" id="progTxt">Processing…</div></div>'+
    '<div class="result-area" id="resultArea"></div>'+
    '<button class="btn-primary" id="runBtn" onclick="runTool()">✍️ Embed Signature in PDF</button>';

  _signCanvas = document.getElementById('signCanvas');
  var ctx = _signCanvas.getContext('2d');
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  function getPos(e) {
    var rect = _signCanvas.getBoundingClientRect();
    var scaleX = _signCanvas.width / rect.width;
    var scaleY = _signCanvas.height / rect.height;
    var src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  }
  function startDraw(e) { e.preventDefault(); _signDrawing=true; var p=getPos(e); _signLastX=p.x; _signLastY=p.y; }
  function draw(e) {
    if (!_signDrawing) return; e.preventDefault();
    var p = getPos(e);
    ctx.beginPath(); ctx.moveTo(_signLastX,_signLastY); ctx.lineTo(p.x,p.y); ctx.stroke();
    _signLastX=p.x; _signLastY=p.y;
  }
  function stopDraw(e) { _signDrawing=false; }
  _signCanvas.addEventListener('mousedown',startDraw); _signCanvas.addEventListener('mousemove',draw);
  _signCanvas.addEventListener('mouseup',stopDraw); _signCanvas.addEventListener('mouseleave',stopDraw);
  _signCanvas.addEventListener('touchstart',startDraw,{passive:false}); _signCanvas.addEventListener('touchmove',draw,{passive:false});
  _signCanvas.addEventListener('touchend',stopDraw);
}

function clearSignCanvas() {
  if (_signCanvas) { var ctx=_signCanvas.getContext('2d'); ctx.clearRect(0,0,_signCanvas.width,_signCanvas.height); }
}

async function tSignPDF() {
  if (!_signCanvas) { toast('Please draw your signature first!','err'); throw new Error('No canvas'); }
  // Check canvas has something
  var ctx = _signCanvas.getContext('2d');
  var px = ctx.getImageData(0,0,_signCanvas.width,_signCanvas.height).data;
  var hasSign = false;
  for (var i=3;i<px.length;i+=4) { if(px[i]>0){hasSign=true;break;} }
  if (!hasSign) { toast('Please draw your signature first!','err'); throw new Error('Empty signature'); }

  setP(10, 'Loading PDF…');
  var PDFDoc = PDFLib.PDFDocument;
  var buf = await toolFiles[0].arrayBuffer();
  var doc = await PDFDoc.load(buf, {ignoreEncryption:true});
  var totalPages = doc.getPageCount();

  var signImgData = _signCanvas.toDataURL('image/png');
  var signBytes = Uint8Array.from(atob(signImgData.split(',')[1]), function(c){ return c.charCodeAt(0); });
  setP(30, 'Embedding signature…');
  var signImage = await doc.embedPng(signBytes);

  var sizePx = {small:80,medium:140,large:200};
  var sizeKey = (document.getElementById('optSignSize')||{}).value || 'medium';
  var sigW = sizePx[sizeKey] || 140;
  var sigH = sigW * (_signCanvas.height / _signCanvas.width);

  var pageOpt = (document.getElementById('optSignPage')||{}).value || 'last';
  var pos = (document.getElementById('optSignPos')||{}).value || 'br';

  var pagesToSign = [];
  if (pageOpt === 'first') pagesToSign = [0];
  else if (pageOpt === 'last') pagesToSign = [totalPages-1];
  else pagesToSign = Array.from({length:totalPages},function(_,k){return k;});

  pagesToSign.forEach(function(pi) {
    setP(30 + Math.round(60*pi/totalPages), 'Signing page '+(pi+1)+'…');
    var page = doc.getPage(pi);
    var {width,height} = page.getSize();
    var margin = 20;
    var x = pos.endsWith('r') ? width-sigW-margin : pos.endsWith('l') ? margin : (width-sigW)/2;
    var y = pos.startsWith('b') ? margin : height-sigH-margin;
    page.drawImage(signImage, {x:x, y:y, width:sigW, height:sigH, opacity:0.85});
  });

  setP(90, 'Saving signed PDF…');
  var bytes = await doc.save();
  var outName = toolFiles[0].name.replace(/\.pdf$/i,'') + '_signed.pdf';
  showResults([{name:outName, size:fmtSize(bytes.length), url:URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))}]);
}

// ── 5. OCR — EXTRACT TEXT ─────────────────────────────────────
async function tOCR() {
  setP(5,'Loading OCR engine…');
  await new Promise(function(res){ ensureTesseract(res); });

  var file = toolFiles[0];
  var lang = (document.getElementById('optOcrLang')||{}).value || 'eng';
  var isPDF = file.name.toLowerCase().endsWith('.pdf');

  var worker = await Tesseract.createWorker({
    logger: function(m){
      if (m.status === 'recognizing text') setP(20 + Math.round(70*m.progress), 'Recognizing text… '+Math.round(m.progress*100)+'%');
      else if (m.status) setP(15, m.status+'…');
    }
  });
  await worker.loadLanguage(lang);
  await worker.initialize(lang);

  var fullText = '';

  if (isPDF) {
    setP(10, 'Rendering PDF pages…');
    var buf = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({data:buf}).promise;
    var n = pdf.numPages;
    for (var i = 1; i <= n; i++) {
      setP(10 + Math.round(5*i/n), 'Rendering page '+i+'…');
      var page = await pdf.getPage(i);
      var vp = page.getViewport({scale:2.0});
      var cv = document.createElement('canvas');
      cv.width = vp.width; cv.height = vp.height;
      await page.render({canvasContext:cv.getContext('2d'), viewport:vp}).promise;
      setP(15, 'Running OCR on page '+i+' of '+n+'…');
      var result = await worker.recognize(cv);
      fullText += '--- Page '+i+' ---\n' + result.data.text + '\n\n';
    }
  } else {
    setP(15, 'Running OCR…');
    var result2 = await worker.recognize(file);
    fullText = result2.data.text;
  }

  await worker.terminate();
  setP(100, 'OCR complete!');

  var ra = document.getElementById('resultArea');
  if (ra) {
    var blob = new Blob([fullText], {type:'text/plain'});
    var url = URL.createObjectURL(blob);
    ra.innerHTML =
      '<div class="res-item" style="flex-direction:column;align-items:flex-start">'+
      '<div style="display:flex;width:100%;justify-content:space-between;align-items:center;margin-bottom:.5rem">'+
      '<strong style="font-size:.9rem">Extracted Text ('+fullText.length.toLocaleString()+' chars)</strong>'+
      '<a class="btn-dl" href="'+url+'" download="ocr-output.txt">⬇ Download .txt</a>'+
      '</div>'+
      '<textarea id="ocrText" style="width:100%;height:200px;font-size:.8rem;font-family:monospace;border:1px solid var(--bdr);border-radius:8px;padding:.6rem;background:var(--sur);color:var(--txt);resize:vertical" readonly></textarea>'+
      '<button onclick="navigator.clipboard.writeText(document.getElementById(\'ocrText\').value).then(function(){toast(\'Copied!\',\'ok\')})" style="margin-top:.5rem;background:none;border:1px solid var(--bdr);border-radius:8px;padding:.35rem .8rem;cursor:pointer;font-size:.82rem">📋 Copy to Clipboard</button>'+
      '</div>';
    // Set textarea value via DOM (safe, avoids </textarea> injection)
    var ta = document.getElementById('ocrText');
    if (ta) ta.value = fullText;
    ra.classList.add('show');
  }
  var btn = document.getElementById('runBtn');
  if (btn) { btn.textContent='▶ Run Again'; btn.disabled=false; btn.onclick=function(){openTool('pdfocr');}; }
  toast('✅ Text extracted! '+Math.round(fullText.length/1000)+'k characters found.','ok');
}

// ── 6. AI PDF SUMMARIZER ─────────────────────────────────────
function buildAISumUI() {
  var savedKey = '';
  try { savedKey = localStorage.getItem('pdfsnap_ai_key') || ''; } catch(e){}
  return '<div id="aiSumWrap">'+
    '<div style="background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.1));border:1px solid rgba(139,92,246,.3);border-radius:12px;padding:1rem;margin-bottom:1rem">'+
      '<div style="font-size:.85rem;font-weight:700;color:#8B5CF6;margin-bottom:.3rem">🤖 Powered by Claude AI</div>'+
      '<div style="font-size:.78rem;color:var(--mut)">Your PDF text is extracted in your browser, then summarized via Anthropic\'s API. Files never leave your device.</div>'+
    '</div>'+
    '<div class="dropzone" id="dz" style="margin-bottom:.8rem">'+
      '<input type="file" id="fileMain" accept=".pdf" onchange="addFiles(this.files)"/>'+
      '<div class="dz-icon">📂</div>'+
      '<div class="dz-text"><strong>Tap to select a PDF</strong><br/>or drag &amp; drop here</div>'+
      '<div class="dz-fmt">.pdf</div>'+
    '</div>'+
    '<div class="file-list" id="fileList"></div>'+
    '<div class="fg" style="margin-top:.8rem">'+
      '<label>Anthropic API Key <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style="font-size:.75rem;color:var(--bl)">(Get free key \u2192)</a></label>'+
      '<input type="password" id="aiKeyInput" placeholder="sk-ant-\u2026" value="'+savedKey+'" oninput="saveAiKey(this.value)"/>'+
    '</div>'+
    '<div class="fg">'+
      '<label>Summary Style</label>'+
      '<select id="aiSumStyle">'+
        '<option value="bullet">Bullet points (key takeaways)</option>'+
        '<option value="paragraph">Short paragraph summary</option>'+
        '<option value="detailed">Detailed analysis</option>'+
        '<option value="eli5">Explain it simply (ELI5)</option>'+
      '</select>'+
    '</div>'+
    '<div class="prog-wrap" id="progWrap"><div class="prog-bg"><div class="prog-bar" id="progBar"></div></div><div class="prog-txt" id="progTxt">Processing…</div></div>'+
    '<div id="aiSumResult" style="display:none;background:var(--sur);border:1.5px solid var(--bdr);border-radius:12px;padding:1rem;margin-bottom:.8rem;white-space:pre-wrap;font-size:.87rem;line-height:1.65;max-height:400px;overflow-y:auto"></div>'+
    '<button class="btn-primary" id="runBtn" onclick="tAISummarize()" disabled>🤖 Summarize PDF</button>'+
    '<div style="font-size:.75rem;color:var(--mut);margin-top:.5rem;text-align:center">Your API key is stored only in your browser. PDFSnap never sees it.</div>'+
  '</div>';
}

async function tAISummarize() {
  if (!toolFiles.length) { toast('Please select a PDF first!','err'); return; }
  var apiKey = (document.getElementById('aiKeyInput')||{}).value || '';
  if (!apiKey || !apiKey.startsWith('sk-ant')) { toast('Please enter your Anthropic API key!','err'); return; }

  // Ensure PDF libs are loaded (bypassed since runBtn calls us directly, not via runTool)
  if (!libsOK) {
    toast('Loading PDF engine…','info');
    ensurePdfLibs(function(){ tAISummarize(); });
    return;
  }

  var btn = document.getElementById('runBtn');
  if (btn) { btn.disabled=true; btn.textContent='⏳ Summarizing…'; }
  setP(10,'Extracting text from PDF…');

  // Extract text using pdf.js
  var buf = await toolFiles[0].arrayBuffer();
  var pdf = await pdfjsLib.getDocument({data:buf}).promise;
  var n = pdf.numPages;
  var allText = '';
  var maxPages = Math.min(n, 30); // Limit to 30 pages to stay within token limits

  for (var i = 1; i <= maxPages; i++) {
    setP(10 + Math.round(30*i/maxPages), 'Reading page '+i+'…');
    var page = await pdf.getPage(i);
    var content = await page.getTextContent();
    allText += content.items.map(function(s){ return s.str; }).join(' ') + '\n';
  }

  if (allText.trim().length < 100) {
    toast('Could not extract text. Try the OCR tool instead (for scanned PDFs)!','err');
    if (btn) { btn.disabled=false; btn.textContent='🤖 Summarize PDF'; }
    return;
  }

  // Trim text if too long
  if (allText.length > 15000) allText = allText.substring(0, 15000) + '\n[...text truncated for length...]';

  setP(50,'Sending to Claude AI…');

  var style = (document.getElementById('aiSumStyle')||{}).value || 'bullet';
  var styleInstructions = {
    bullet: 'Provide a summary as clear bullet points covering: main topic, key points, important findings/conclusions, and any action items. Use • for bullets.',
    paragraph: 'Write a concise 3-4 sentence paragraph summary of the main content and key takeaways.',
    detailed: 'Provide a detailed analysis including: overview, main sections/topics, key arguments or data, conclusions, and any limitations or caveats.',
    eli5: 'Explain this document as if to someone with no prior knowledge of the subject. Use simple language and analogies. Avoid jargon.'
  };

  var prompt = 'Please summarize the following PDF document.\n\n' +
    'Summary style: ' + styleInstructions[style] + '\n\n' +
    'Document text:\n---\n' + allText + '\n---\n\n' +
    'Provide only the summary, no preamble.';

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{role:'user', content:prompt}]
      })
    });

    if (!response.ok) {
      var errData = await response.json();
      throw new Error(errData.error ? errData.error.message : 'API error '+response.status);
    }

    var data = await response.json();
    var summaryText = data.content && data.content[0] ? data.content[0].text : 'No summary returned.';

    setP(100,'Summary ready!');
    var resultEl = document.getElementById('aiSumResult');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.textContent = summaryText;
    }

    // Copy button
    var copyArea = document.createElement('div');
    copyArea.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.8rem';
    copyArea.innerHTML =
      '<button onclick="navigator.clipboard.writeText(document.getElementById(\'aiSumResult\').textContent).then(function(){toast(\'Copied!\',\'ok\')})" style="background:none;border:1px solid var(--bdr);border-radius:8px;padding:.35rem .8rem;cursor:pointer;font-size:.82rem">📋 Copy Summary</button>'+
      '<button onclick="var b=new Blob([document.getElementById(\'aiSumResult\').textContent],{type:\'text/plain\'});var a=document.createElement(\'a\');a.href=URL.createObjectURL(b);a.download=\'summary.txt\';a.click()" style="background:none;border:1px solid var(--bdr);border-radius:8px;padding:.35rem .8rem;cursor:pointer;font-size:.82rem">⬇ Save .txt</button>';
    if (resultEl) resultEl.insertAdjacentElement('afterend', copyArea);

    toast('✅ Summary ready!','ok');
    if (btn) { btn.disabled=false; btn.textContent='🔄 Summarize Again'; }
  } catch(err) {
    toast('AI Error: '+err.message,'err');
    setP(100,'❌ Error');
    if (btn) { btn.disabled=false; btn.textContent='🤖 Summarize PDF'; }
  }
}
function saveAiKey(v) { try { localStorage.setItem('pdfsnap_ai_key', v); } catch(e){} }
