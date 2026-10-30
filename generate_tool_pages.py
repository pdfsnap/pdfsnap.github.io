#!/usr/bin/env python3
"""
Generates standalone, indexable tool pages (e.g. merge-pdf.html) for PDFSnap.

Each page reuses index.html's design, nav, footer and the existing app.js, but
has its own URL, <title>, description, canonical, headline, how-to steps, FAQ
and the tool embedded directly on the page (no popup).

Usage (run inside the repo root):  python3 generate_tool_pages.py
Change BASE_URL below once you buy a custom domain, then run it again.
"""
import html, json, re, sys
from pathlib import Path

BASE_URL = "https://pdfsnap.github.io"   # <- change to your custom domain later
ROOT = Path(__file__).resolve().parent

# --------------------------------------------------------------------------
# One entry per tool. `id` must match an id in TOOLS inside app.js.
# --------------------------------------------------------------------------
TOOLS_PAGES = [
    {
        "id": "merge",
        "slug": "merge-pdf.html",
        "name": "Merge PDF",
        "icon": "🗂️",
        "title": "Merge PDF Files Online Free – Combine PDFs | PDFSnap",
        "description": "Combine multiple PDF files into one document in seconds. Free, no signup, no watermark, and your files never leave your device.",
        "h1": "Merge PDF files into one, free",
        "intro": "Select two or more PDFs, and PDFSnap joins them into a single file you can download right away. "
                 "Everything happens inside your browser, so your documents are never uploaded to a server.",
        "steps": [
            ("Add your PDFs", "Tap the upload box and pick the PDF files you want to combine. You can select several at once or use “Add More Files”."),
            ("Choose your options", "Name the output file, pick the page order, and optionally compress the result after merging."),
            ("Merge and download", "Press “Process Now”. When it finishes, tap Download to save the merged PDF."),
        ],
        "why": [
            "No upload: files are merged on your own device with the pdf-lib library, so private documents stay private.",
            "No account, no watermark, and no page limits set by PDFSnap.",
            "Works on phones, tablets and computers, in any modern browser.",
            "Optional compression after merging helps when the combined file is too big to email.",
        ],
        "faq": [
            ("Is merging PDFs with PDFSnap really free?",
             "Yes. There is no signup, no watermark on the output, and no paid tier. The site is supported by ads."),
            ("Are my PDF files uploaded anywhere?",
             "No. The merge runs in your browser, so the files stay on your device. You can even disconnect from the internet after the page loads."),
            ("How do I change the order of the merged pages?",
             "Pages are joined in the order you added the files. Choose “Files in upload order” or “Reverse order” in the options. To get a custom order, add the files one by one in the order you want."),
            ("Is there a limit on file size or number of files?",
             "PDFSnap does not set a limit. The practical limit is your device’s memory, so very large files may be slow on older phones."),
            ("The merged PDF is too large. What can I do?",
             "Set “After merging” to “Also compress after merging”, or run the result through the Compress PDF tool."),
        ],
        "related": [
            ("Split PDF", "split-pdf-free.html", "✂️"),
            ("Compress PDF", "compress-pdf-without-losing-quality.html", "🗜️"),
            ("Rotate PDF pages", "rotate-pdf-pages-free.html", "🔃"),
            ("JPG to PDF", "jpg-to-pdf-free.html", "🖼️"),
        ],
        "guide": ("Read the full merge guide", "merge-pdf-files-free.html"),
    },
]


def esc(s):
    return html.escape(s, quote=True)


def read(name):
    return (ROOT / name).read_text(encoding="utf-8", errors="replace")


def set_meta(head, attr, key, value):
    """Replace the content of <meta ... attr="key" ...> regardless of attribute order."""
    pat = re.compile(r'<meta\b[^>]*\b%s="%s"[^>]*/?>' % (attr, re.escape(key)))
    new = '<meta content="%s" %s="%s"/>' % (esc(value), attr, key)
    if pat.search(head):
        return pat.sub(lambda m: new, head, count=1)
    return head.replace("</head>", new + "\n</head>")


def build_head(tpl_head, t):
    url = "%s/%s" % (BASE_URL, t["slug"])
    h = tpl_head
    h = re.sub(r"<title>.*?</title>", lambda m: "<title>%s</title>" % esc(t["title"]), h, count=1, flags=re.S)
    h = re.sub(r'<link\b[^>]*rel="canonical"[^>]*/?>', lambda m: '<link href="%s" rel="canonical"/>' % url, h, count=1)
    h = set_meta(h, "name", "description", t["description"])
    h = re.sub(r'<meta\b[^>]*name="keywords"[^>]*/?>\s*', "", h)  # Google ignores it
    h = set_meta(h, "property", "og:title", t["title"])
    h = set_meta(h, "property", "og:description", t["description"])
    h = set_meta(h, "property", "og:url", url)
    h = set_meta(h, "name", "twitter:title", t["title"])
    h = set_meta(h, "name", "twitter:description", t["description"])
    # replace homepage JSON-LD with page-specific structured data
    h = re.sub(r'<script type="application/ld\+json">.*?</script>\s*', "", h, flags=re.S)
    app = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "PDFSnap " + t["name"],
        "url": url,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any (web browser)",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "description": t["description"],
    }
    faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in t["faq"]
        ],
    }
    crumbs = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "PDFSnap", "item": BASE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": t["name"], "item": url},
        ],
    }
    ld = "".join('<script type="application/ld+json">%s</script>\n' % json.dumps(o, ensure_ascii=False)
                 for o in (app, faq, crumbs))
    return h.replace("</head>", ld + PAGE_CSS + "</head>")


PAGE_CSS = """<style>
.tp{max-width:760px;margin:0 auto;padding:1.4rem 1rem 0}
.tp .crumbs{font-size:.8rem;color:var(--mut);margin-bottom:.8rem}
.tp .crumbs a{color:var(--mut);text-decoration:none}
.tp h1{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(1.7rem,5vw,2.4rem);font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-bottom:.6rem}
.tp .tp-intro{color:var(--mut);line-height:1.65;margin-bottom:1.2rem}
.tp h2{font-family:'Bricolage Grotesque',sans-serif;font-size:1.3rem;font-weight:800;margin:2.2rem 0 .8rem}
.tp ol.steps{list-style:none;padding:0;counter-reset:s;display:grid;gap:.7rem}
.tp ol.steps li{counter-increment:s;background:var(--sur);border:1.5px solid var(--bdr);border-radius:14px;padding:.9rem 1rem .9rem 3.2rem;position:relative;line-height:1.55}
.tp ol.steps li::before{content:counter(s);position:absolute;left:1rem;top:.85rem;width:1.6rem;height:1.6rem;border-radius:50%;background:var(--acc);color:#fff;font-weight:700;font-size:.85rem;display:flex;align-items:center;justify-content:center}
.tp ol.steps strong{display:block;margin-bottom:.15rem}
.tp ul.why{padding-left:1.2rem;line-height:1.8}
.tp details{background:var(--sur);border:1.5px solid var(--bdr);border-radius:12px;padding:.8rem 1rem;margin-bottom:.6rem}
.tp summary{cursor:pointer;font-weight:600}
.tp details p{margin-top:.5rem;color:var(--mut);line-height:1.65}
.tp .rel{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.7rem}
.tp .rel a{display:block;background:var(--sur);border:1.5px solid var(--bdr);border-radius:12px;padding:.8rem 1rem;color:inherit;text-decoration:none;font-weight:600}
.tp .rel a:hover{border-color:var(--acc)}
.tp .more{margin-top:1rem;font-size:.92rem}
.tp .more a{color:var(--acc);font-weight:600}
/* tool embedded in the page instead of a popup */
.tool-embed #toolOv.active{display:block;position:static;background:none;backdrop-filter:none;padding:0;animation:none}
.tool-embed .modal{max-width:100%;max-height:none;overflow:visible;margin:0 auto}
.tool-embed .modal-close{display:none}
.tool-embed #toolOv.active + #toolPlaceholder{display:none}
#toolPlaceholder{background:var(--sur);border:1.5px solid var(--bdr);border-radius:20px;padding:1.8rem;text-align:center}
</style>
"""


def build_content(t, tool_ov_html):
    steps = "".join("<li><strong>%s</strong>%s</li>" % (esc(a), esc(b)) for a, b in t["steps"])
    why = "".join("<li>%s</li>" % esc(x) for x in t["why"])
    faq = "".join("<details><summary>%s</summary><p>%s</p></details>" % (esc(q), esc(a)) for q, a in t["faq"])
    rel = "".join('<a href="%s">%s %s</a>' % (esc(u), i, esc(n)) for n, u, i in t["related"])
    g_text, g_url = t["guide"]
    return f"""<div id="mainWrap">
<main class="tp">
<div class="crumbs"><a href="index.html">PDFSnap</a> › {esc(t["name"])}</div>
<h1>{esc(t["h1"])}</h1>
<p class="tp-intro">{esc(t["intro"])}</p>
<div class="tool-embed">
{tool_ov_html}
<div id="toolPlaceholder"><button class="btn-primary" onclick="openTool('{t["id"]}')">{t["icon"]} Open {esc(t["name"])}</button></div>
</div>
<h2>How to use {esc(t["name"])}</h2>
<ol class="steps">{steps}</ol>
<h2>Why use PDFSnap</h2>
<ul class="why">{why}</ul>
<h2>Frequently asked questions</h2>
{faq}
<h2>More free tools</h2>
<div class="rel">{rel}</div>
<p class="more">📖 <a href="{esc(g_url)}">{esc(g_text)}</a></p>
</main>
<div style="display:none" aria-hidden="true"><input id="searchInput"/><div id="toolsGrid"></div><div id="noResults"></div><span id="cnt-all"></span><span id="toolCount"></span></div>
</div>
"""


PAGE_JS = """<script>
/* Tool pages: show the tool inline instead of as a popup */
window.addEventListener('load', function(){
  if (typeof openTool !== 'function') return;
  var _open = openTool;
  window.openTool = function(id){ _open(id); document.body.style.overflow=''; };
  window.closeTool = function(){};   /* nothing to close: the tool lives on the page */
  setTimeout(function(){ window.openTool('%s'); }, 250);
});
</script>
"""


def build_page(tpl, t):
    s_body = tpl.index("<body>")
    head = build_head(tpl[:s_body], t)

    # pieces of the original body we keep
    pre = tpl[s_body:tpl.index("<!-- MAIN -->")]
    # drop the ad-blocker nag overlay, keep a harmless stub so app.js does not error
    pre = re.sub(r"<!-- ADBLOCK OVERLAY -->.*?(?=<!-- SIDE OVERLAY -->)",
                 '<div id="abOv" style="display:none"></div>\n', pre, flags=re.S)
    pre = pre.replace('<div class="logo" onclick="showMain()">',
                      '<div class="logo" style="cursor:pointer" onclick="location.href=\'index.html\'">')

    profile = tpl[tpl.index("<!-- PROFILE SECTION -->"):tpl.index("<!-- TOOL MODAL -->")]
    tool_ov = tpl[tpl.index("<!-- TOOL MODAL -->"):tpl.index("<!-- AUTH MODAL -->")]
    other_modals = tpl[tpl.index("<!-- AUTH MODAL -->"):tpl.index("<!-- ═")]
    footer_to_end = tpl[tpl.index("<footer"):]

    body = (pre + build_content(t, tool_ov) + profile + other_modals + footer_to_end)
    body = body.replace("</body>", PAGE_JS % t["id"] + "</body>")
    return head + body


def update_sitemap(slugs):
    p = ROOT / "sitemap.xml"
    xml = p.read_text(encoding="utf-8")
    from datetime import date
    today = date.today().isoformat()
    for slug in slugs:
        loc = "%s/%s" % (BASE_URL, slug)
        if loc in xml:
            continue
        entry = ("<url><loc>%s</loc><lastmod>%s</lastmod><changefreq>monthly</changefreq>"
                 "<priority>0.9</priority></url>\n") % (loc, today)
        xml = xml.replace("</urlset>", entry + "</urlset>")
    p.write_text(xml, encoding="utf-8")


def main():
    tpl = read("index.html")
    for t in TOOLS_PAGES:
        out = ROOT / t["slug"]
        out.write_text(build_page(tpl, t), encoding="utf-8")
        print("wrote", out.name)
    update_sitemap([t["slug"] for t in TOOLS_PAGES])
    print("sitemap.xml updated")


if __name__ == "__main__":
    sys.exit(main())
