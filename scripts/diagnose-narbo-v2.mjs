// Nærbø diagnostic V2 - automatic discovery of event/activity pages.
// NO Baserow writes.
const ORIGIN = "https://narbobedehus.no";
const SEEDS = [
  `${ORIGIN}/`,
  `${ORIGIN}/calendar/alle-arrangementer/`,
  `${ORIGIN}/calendar/moter/`,
  `${ORIGIN}/barnelag-og-kor/`,
];

const MAX_DISCOVERED_PAGES = 50;
const MAX_FETCHES = 60;

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
    out.push({title,start:start.toISOString(),sourceUrl,line:lines[i]});
  }

  const seen = new Set();
  return out.filter(e => {
    const k = `${e.start}|${e.title.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function normalizeUrl(href, baseUrl) {
  try {
    const u = new URL(decodeEntities(href), baseUrl);
    if (u.origin !== ORIGIN) return null;
    u.hash = "";
    if (/\/wp-(admin|login|json)\b/i.test(u.pathname) || /\/feed\/?$/i.test(u.pathname) || /\/tag\//i.test(u.pathname) || /\/author\//i.test(u.pathname) || /\/category\//i.test(u.pathname) || /\/\d{4}\/\d{2}\//i.test(u.pathname) || /[?&]s=/i.test(u.search)) return null;
    return u.href;
  } catch { return null; }
}

function extractInternalLinks(html, baseUrl) {
  const found = new Map();
  for (const m of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = normalizeUrl(m[1], baseUrl);
    if (!url) continue;
    const label = decodeEntities(String(m[2]||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
    if (!found.has(url)) found.set(url, label);
  }
  return [...found].map(([url,label])=>({url,label}));
}

function scoreCandidate(link) {
  const text = `${link.url} ${link.label}`.toLocaleLowerCase("no");
  let score = 0;
  const positive = [
    ["calendar",8],["arrangement",8],["møte",7],["moter",7],["kor",6],
    ["barn",5],["ungdom",5],["klubb",5],["lag",4],["sang",5],["emmaus",7],
    ["kvisten",7],["maks",7],["bønn",5],["senior",4],["kvinne",4],["mann",4],
    ["forsamling",4],["aktivitet",4],["søndag",3],["gudstjeneste",4]
  ];
  for (const [needle,weight] of positive) if (text.includes(needle)) score += weight;
  const negative = [["kontakt",-8],["personvern",-10],["gave",-5],["utleie",-6],["historie",-5],["om-oss",-5],["styret",-5],["facebook",-10]];
  for (const [needle,weight] of negative) if (text.includes(needle)) score += weight;
  return score;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers:{"user-agent":"Mozilla/5.0 (compatible; Kvimarka92-NarboDiagnostic/2.0)","accept":"text/html,application/xhtml+xml"},
      signal:controller.signal,
      redirect:"follow"
    });
    const text = await res.text();
    return {status:res.status,finalUrl:res.url,text};
  } finally { clearTimeout(timer); }
}

const fetched = new Map();
const discovered = new Map();
async function fetchOnce(url) {
  if (fetched.has(url)) return fetched.get(url);
  if (fetched.size >= MAX_FETCHES) throw new Error("MAX_FETCHES reached");
  const result = await fetchText(url);
  fetched.set(url,result);
  return result;
}

for (const url of SEEDS) {
  try {
    const result = await fetchOnce(url);
    for (const link of extractInternalLinks(result.text,result.finalUrl)) {
      const score = scoreCandidate(link);
      if (score <= 0) continue;
      const old = discovered.get(link.url);
      if (!old || score > old.score) discovered.set(link.url,{...link,score});
    }
  } catch {}
}
for (const url of SEEDS) if (!discovered.has(url)) discovered.set(url,{url,label:"seed",score:100});

const candidates = [...discovered.values()].sort((a,b)=>b.score-a.score || a.url.localeCompare(b.url)).slice(0,MAX_DISCOVERED_PAGES);
const report = {generatedAt:new Date().toISOString(),purpose:"Nærbø source coverage diagnostic V2. Automatic page discovery. No Baserow writes.",limits:{MAX_DISCOVERED_PAGES,MAX_FETCHES},candidateCount:candidates.length,pages:[],union:null};
const allEvents = [];

for (const candidate of candidates) {
  const item = {url:candidate.url,label:candidate.label,score:candidate.score};
  try {
    const {status,finalUrl,text} = await fetchOnce(candidate.url);
    const events = parseVisibleEvents(text,finalUrl);
    const dates = events.map(e=>e.start).sort();
    item.status=status; item.finalUrl=finalUrl; item.bytes=Buffer.byteLength(text);
    item.eventCount=events.length; item.firstEvent=dates[0]||null; item.lastEvent=dates.at(-1)||null;
    item.sampleFirst=events.slice(0,3); item.sampleLast=events.slice(-3);
    allEvents.push(...events);
  } catch (err) { item.error=`${err?.name||"Error"}: ${err?.message||err}`; }
  report.pages.push(item);
}

const unionSeen = new Set();
const union = [];
for (const e of allEvents.sort((a,b)=>a.start.localeCompare(b.start))) {
  const k = `${e.start}|${String(e.title||"").toLocaleLowerCase("no").replace(/\s+/g," ").trim()}`;
  if (unionSeen.has(k)) continue;
  unionSeen.add(k); union.push(e);
}
const unionDates = union.map(e=>e.start).sort();
report.union = {eventCount:union.length,firstEvent:unionDates[0]||null,lastEvent:unionDates.at(-1)||null,events:union};

console.log("\n=== NÆRBØ DIAGNOSTIC V2 ===");
console.log(`Candidates: ${report.candidateCount}`);
for (const p of report.pages) {
  if (p.error) console.log(`ERROR | ${p.url} | ${p.error}`);
  else if (p.eventCount>0) console.log(`${String(p.eventCount).padStart(3)} events | ${p.firstEvent||"-"} -> ${p.lastEvent||"-"} | score ${p.score} | ${p.url}`);
}
console.log(`\nUNION: ${report.union.eventCount} unique events`);
console.log(`FIRST: ${report.union.firstEvent||"-"}`);
console.log(`LAST:  ${report.union.lastEvent||"-"}`);

await import("node:fs/promises").then(fs=>fs.writeFile("narbo-diagnostic-v2.json",JSON.stringify(report,null,2),"utf8"));
console.log("\nWrote narbo-diagnostic-v2.json");
