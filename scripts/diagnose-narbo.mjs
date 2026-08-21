// Nærbø diagnostic only - no Baserow writes.
const URLS = [
  "https://narbobedehus.no/",
  "https://narbobedehus.no/calendar/alle-arrangementer/",
  "https://narbobedehus.no/calendar/moter/",
  "https://narbobedehus.no/glad-sang/",
  "https://narbobedehus.no/kvisten-barnelag/",
  "https://narbobedehus.no/barnelag-og-kor/",
];

const MONTHS = {
  januar:1,februar:2,mars:3,april:4,mai:5,juni:6,
  juli:7,august:8,september:9,oktober:10,november:11,desember:12
};

function decodeEntities(s) {
  let v = String(s ?? "");
  for (let i=0;i<4;i++) {
    const before = v;
    v = v
      .replace(/&nbsp;|&#160;/gi," ")
      .replace(/&quot;/gi,'"')
      .replace(/&#39;|&apos;/gi,"'")
      .replace(/&ndash;/gi,"–")
      .replace(/&mdash;/gi,"—")
      .replace(/&aring;/gi,"å").replace(/&oslash;/gi,"ø").replace(/&aelig;/gi,"æ")
      .replace(/&Aring;/g,"Å").replace(/&Oslash;/g,"Ø").replace(/&AElig;/g,"Æ")
      .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
      .replace(/&amp;/gi,"&");
    if (v === before) break;
  }
  return v;
}

function htmlToLines(html) {
  return decodeEntities(String(html ?? ""))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"\n")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"\n")
    .replace(/<br\s*\/?>/gi,"\n")
    .replace(/<\/p>|<\/li>|<\/div>|<\/h[1-6]>|<\/tr>/gi,"\n")
    .replace(/<[^>]+>/g," ")
    .replace(/\r/g,"")
    .split("\n")
    .map(x=>x.replace(/\s+/g," ").trim())
    .filter(Boolean);
}

function parseVisibleEvents(html, sourceUrl) {
  const lines = htmlToLines(html);
  const detailRe = /^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s*,?\s*(\d{1,2})\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\s+(20\d{2})\s+(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(?:(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s*,?\s*(\d{1,2})\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\s+(20\d{2})\s+)?(\d{1,2}):(\d{2}))?$/i;
  const dateHeadingRe = /^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s*,?\s*\d{1,2}\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\s*(20\d{2})?$/i;
  const junkRe = /^(listevisning|kalendervisning|bruk kalendervisning for å se mer!?|publisert|stikkord:|i|av)$/i;

  const out = [];
  for (let i=0;i<lines.length;i++) {
    const m = lines[i].match(detailRe);
    if (!m) continue;

    let title = "";
    for (let j=i-1;j>=0 && j>=i-8;j--) {
      const t = lines[j];
      if (!t || dateHeadingRe.test(t) || detailRe.test(t) || junkRe.test(t)) continue;
      if (/^[\d\s|•.-]+$/.test(t) || t.length > 220) continue;
      title = t.replace(/^•\s*/,"").trim();
      break;
    }

    const month = MONTHS[m[3].toLowerCase()];
    if (!month) continue;
    const start = new Date(Date.UTC(Number(m[4]),month-1,Number(m[2]),Number(m[5]),Number(m[6])));
    out.push({
      title,
      start: start.toISOString(),
      sourceUrl,
      line: lines[i],
    });
  }

  const seen = new Set();
  return out.filter(e => {
    const k = `${e.start}|${e.title.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function findPaginationHints(html, baseUrl) {
  const found = new Set();
  for (const m of String(html).matchAll(/href=["']([^"']+)["']/gi)) {
    try {
      const u = new URL(decodeEntities(m[1]), baseUrl);
      if (
        /\/page\/\d+\/?$/i.test(u.pathname) ||
        /[?&](?:paged|page)=\d+/i.test(u.search) ||
        /(?:next|neste)/i.test(m[0])
      ) found.add(u.href);
    } catch {}
  }
  return [...found];
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":"Mozilla/5.0 (compatible; Kvimarka92-NarboDiagnostic/1.0)",
        "accept":"text/html,application/xhtml+xml"
      },
      signal: controller.signal,
      redirect:"follow",
    });
    const text = await res.text();
    return {status:res.status, finalUrl:res.url, text};
  } finally {
    clearTimeout(timer);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  purpose: "Nærbø source coverage diagnostic. No Baserow writes.",
  pages: [],
};

for (const url of URLS) {
  const item = {url};
  try {
    const {status, finalUrl, text} = await fetchText(url);
    const events = parseVisibleEvents(text, finalUrl);
    const dates = events.map(e=>e.start).sort();
    item.status = status;
    item.finalUrl = finalUrl;
    item.bytes = Buffer.byteLength(text);
    item.eventCount = events.length;
    item.firstEvent = dates[0] || null;
    item.lastEvent = dates.at(-1) || null;
    item.paginationHints = findPaginationHints(text, finalUrl);
    item.sampleFirst = events.slice(0,5);
    item.sampleLast = events.slice(-5);
  } catch (err) {
    item.error = `${err?.name || "Error"}: ${err?.message || err}`;
  }
  report.pages.push(item);
}

console.log("\n=== NÆRBØ DIAGNOSTIC ===");
for (const p of report.pages) {
  console.log(`\n${p.url}`);
  if (p.error) {
    console.log(`  ERROR: ${p.error}`);
    continue;
  }
  console.log(`  HTTP: ${p.status}`);
  console.log(`  Events: ${p.eventCount}`);
  console.log(`  First: ${p.firstEvent || "-"}`);
  console.log(`  Last: ${p.lastEvent || "-"}`);
  console.log(`  Pagination hints: ${p.paginationHints.length ? p.paginationHints.join(", ") : "-"}`);
}

await import("node:fs/promises").then(fs =>
  fs.writeFile("narbo-diagnostic.json", JSON.stringify(report,null,2), "utf8")
);
console.log("\nWrote narbo-diagnostic.json");
