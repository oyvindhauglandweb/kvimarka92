import fs from "node:fs/promises";

const DATA_PATH = process.env.ARRANGEMENT_DATA_PATH || "arrangementer-data.json";
const STORSAMLING_URL = process.env.STORSAMLING_PROGRAM_URL || "https://storsamling.no/";
const USER_AGENT = "Kvimarka92-Arrangementer/1.0 (+https://storsamling.no/)";

const MONTHS = new Map([
  ["januar", 1], ["februar", 2], ["mars", 3], ["april", 4],
  ["mai", 5], ["juni", 6], ["juli", 7], ["august", 8],
  ["september", 9], ["oktober", 10], ["november", 11], ["desember", 12]
]);

function clean(value) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return clean(value)
    .toLocaleLowerCase("nb-NO")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = Number.parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

function htmlToLines(html) {
  return decodeHtmlEntities(
    String(html ?? "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "\n")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "\n")
      .replace(/<(?:br|p|div|h[1-6]|li|section|article|span)\b[^>]*>/gi, "\n")
      .replace(/<\/(?:p|div|h[1-6]|li|section|article|span)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  ).split(/\r?\n/).map(clean).filter(Boolean);
}

function dateKey(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthDayKey(month, day) {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventDateParts(startTime) {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(d);
  const byType = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    full: `${byType.year}-${byType.month}-${byType.day}`,
    monthDay: `${byType.month}-${byType.day}`
  };
}

function parseDateLine(line, fallbackYear = null) {
  const m = clean(line).match(
    /^(\d{1,2})\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\b(?:\s+(20\d{2}))?(?:\s*[-–—:]?\s*(.*))?$/i
  );
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS.get(normalize(m[2]));
  const year = m[3] ? Number(m[3]) : fallbackYear;
  const tail = clean(m[4] || "");
  if (!month || day < 1 || day > 31) return null;
  return { year, month, day, tail };
}

function speakerFromText(value) {
  const text = clean(value);
  const m = text.match(/(?:^|\b)(?:tale\s+av|taler)\s*:?\s+(.+)$/i);
  if (!m) return "";
  const speaker = clean(m[1]).replace(/[|•]+$/g, "").trim();
  if (!speaker) return "";
  if (/^(ingen|avlyst|utgår|utgar)\b/i.test(speaker)) return "";
  return speaker;
}

function parseProgram(html) {
  const lines = htmlToLines(html);
  let currentYear = null;
  let currentDate = null;
  const fullDateEntries = new Map();
  const monthDayEntries = new Map();

  for (const line of lines) {
    const programYearMatch = line.match(/\bprogram(?:met)?\s+for\b.*?\b(20\d{2})\b/i);
    if (programYearMatch) currentYear = Number(programYearMatch[1]);

    const parsedDate = parseDateLine(line, currentYear);
    if (parsedDate) {
      currentDate = parsedDate;
      const inlineSpeaker = speakerFromText(parsedDate.tail);
      if (inlineSpeaker) {
        if (parsedDate.year) fullDateEntries.set(dateKey(parsedDate.year, parsedDate.month, parsedDate.day), inlineSpeaker);
        monthDayEntries.set(monthDayKey(parsedDate.month, parsedDate.day), inlineSpeaker);
      }
      continue;
    }

    if (!currentDate) continue;

    const speaker = speakerFromText(line);
    if (speaker) {
      if (currentDate.year) fullDateEntries.set(dateKey(currentDate.year, currentDate.month, currentDate.day), speaker);
      monthDayEntries.set(monthDayKey(currentDate.month, currentDate.day), speaker);
      currentDate = null;
      continue;
    }

    if (/ingen\s+storsamling/i.test(line)) {
      currentDate = null;
    }
  }

  return { fullDateEntries, monthDayEntries, lines };
}

function isTargetEvent(event) {
  const title = normalize(event?.title);
  const municipality = normalize(event?.municipality);
  const settlement = normalize(event?.settlement);
  const location = normalize(event?.location);
  const organizer = normalize(event?.organizer);
  const source = normalize(event?.source);

  if (!title.startsWith("storsamling")) return false;
  if (municipality !== "ha") return false;

  const nearbo = settlement === "naerbo" || location.includes("naerbo bedehus");
  if (!nearbo) return false;

  return (
    organizer.includes("naerbo bedehus") ||
    source.includes("naerbo bedehus") ||
    location.includes("naerbo bedehus")
  );
}

function appendSpeaker(description, speaker) {
  const original = String(description ?? "").trim();
  const wanted = `Tale av: ${speaker}`;
  if (normalize(original).includes(normalize(wanted))) return original;

  const lines = original ? original.split(/\r?\n/) : [];
  let replaced = false;
  const updatedLines = lines.map(line => {
    if (/^\s*Tale av\s*:/i.test(line)) {
      replaced = true;
      return wanted;
    }
    return line;
  });

  if (replaced) return updatedLines.join("\n").trim();
  return original ? `${original}\n${wanted}` : wanted;
}

async function fetchProgram() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const url = new URL(STORSAMLING_URL);
    url.searchParams.set("_arr_cb", String(Date.now()));
    const res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        "accept": "text/html,application/xhtml+xml",
        "cache-control": "no-cache, no-store, max-age=0",
        "pragma": "no-cache"
      },
      redirect: "follow",
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ved henting av ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const snapshot = JSON.parse(raw);
  if (!snapshot || !Array.isArray(snapshot.events)) {
    throw new Error(`${DATA_PATH} mangler events-array.`);
  }

  let html;
  try {
    html = await fetchProgram();
  } catch (err) {
    console.warn(`Storsamling-berikelse hoppes over: ${err?.message || err}`);
    return;
  }

  const program = parseProgram(html);

  if (!program.fullDateEntries.size && !program.monthDayEntries.size) {
    console.warn("Storsamling-berikelse: Fant ingen sikre dato/taler-par. Snapshot beholdes uendret.");
    console.warn("Første tekstlinjer fra siden:", program.lines.slice(0, 80));
    return;
  }

  console.log("Storsamling Nærbø – funnet program:");
  for (const [key, speaker] of program.fullDateEntries) console.log(`  ${key} -> ${speaker}`);
  if (!program.fullDateEntries.size) {
    for (const [key, speaker] of program.monthDayEntries) console.log(`  ${key} -> ${speaker}`);
  }

  let targetEvents = 0;
  let matched = 0;
  let changed = 0;

  for (const event of snapshot.events) {
    if (!isTargetEvent(event)) continue;
    targetEvents += 1;

    const date = eventDateParts(event.startTime);
    if (!date) continue;

    const speaker =
      program.fullDateEntries.get(date.full) ||
      program.monthDayEntries.get(date.monthDay) ||
      "";

    if (!speaker) continue;
    matched += 1;

    const nextDescription = appendSpeaker(event.description, speaker);
    if (nextDescription !== String(event.description ?? "").trim()) {
      event.description = nextDescription;
      changed += 1;
      console.log(`Oppdatert ${date.full}: ${event.title} -> Tale av: ${speaker}`);
    }
  }

  snapshot.enrichment = {
    ...(snapshot.enrichment || {}),
    storsamlingNaerboSpeaker: {
      version: "V003",
      source: STORSAMLING_URL,
      generatedAt: new Date().toISOString(),
      fullDateEntries: program.fullDateEntries.size,
      monthDayEntries: program.monthDayEntries.size,
      targetEvents,
      matched,
      changed
    }
  };

  await fs.writeFile(DATA_PATH, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

  console.log(
    `Storsamling Nærbø: ${targetEvents} aktuelle arrangementer, ` +
    `${matched} datotreff, ${changed} beskrivelser oppdatert.`
  );
}

await main();
