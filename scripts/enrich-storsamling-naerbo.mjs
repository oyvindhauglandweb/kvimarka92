import fs from "node:fs/promises";

const DATA_PATH =
  process.env.ARRANGEMENT_DATA_PATH || "arrangementer-data.json";

const STORSAMLING_URL =
  process.env.STORSAMLING_PROGRAM_URL || "https://storsamling.no/";

const USER_AGENT =
  "Kvimarka92-Arrangementer/1.0 (+https://storsamling.no/)";

const MONTHS = new Map([
  ["januar", 1],
  ["februar", 2],
  ["mars", 3],
  ["april", 4],
  ["mai", 5],
  ["juni", 6],
  ["juli", 7],
  ["august", 8],
  ["september", 9],
  ["oktober", 10],
  ["november", 11],
  ["desember", 12]
]);

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return clean(value)
    .toLocaleLowerCase("nb-NO")
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
      .replace(/<(?:br|\/p|\/div|\/h[1-6]|\/li|\/section|\/article)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);
}

function dateKey(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventDateKey(startTime) {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);

  const byType = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function isProgramNoise(text) {
  const n = normalize(text);
  if (!n) return true;

  return [
    "onsker du",
    "for mer info",
    "les mer",
    "lytt til taler",
    "vipps",
    "copyright",
    "imfnor",
    "ansvarlig redaktor",
    "velkommen til storsamling",
    "naerbo bedehus",
    "program for"
  ].some(prefix => n.startsWith(prefix));
}

function parseProgram(html) {
  const lines = htmlToLines(html);

  let currentYear = null;
  const entries = new Map();

  for (const line of lines) {
    const yearMatch =
      line.match(/\bprogram(?:met)?\s+for\b.*?\b(20\d{2})\b/i) ||
      line.match(/\b(20\d{2})\b/);

    if (yearMatch && /program/i.test(line)) {
      currentYear = Number(yearMatch[1]);
      continue;
    }

    const m = line.match(
      /^(\d{1,2})\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\b(?:\s*[-–—:]?\s*)(.*)$/i
    );

    if (!m || !currentYear) continue;

    const day = Number(m[1]);
    const month = MONTHS.get(normalize(m[2]));
    let speaker = clean(m[3]);

    if (!month || !day || day < 1 || day > 31) continue;
    if (!speaker || isProgramNoise(speaker)) continue;

    speaker = speaker
      .replace(/^(?:taler|tale\s+av)\s*[:\-–—]?\s*/i, "")
      .trim();

    if (!speaker || isProgramNoise(speaker)) continue;

    entries.set(dateKey(currentYear, month, day), speaker);
  }

  return entries;
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

  const nearbo =
    settlement === "naerbo" ||
    location.includes("naerbo bedehus");

  if (!nearbo) return false;

  return (
    organizer.includes("naerbo bedehus") ||
    source.includes("naerbo bedehus") ||
    location.includes("naerbo bedehus")
  );
}

function appendSpeaker(description, speaker) {
  const original = String(description ?? "").trim();

  // Behold all eksisterende informasjon. Hvis samme taler allerede finnes,
  // gjør vi ingenting.
  const wanted = `Tale av: ${speaker}`;
  if (normalize(original).includes(normalize(wanted))) {
    return original;
  }

  // Hvis en eldre "Tale av:"-linje finnes, byttes kun denne linjen.
  // Resten av beskrivelsen beholdes urørt.
  const lines = original ? original.split(/\r?\n/) : [];
  let replaced = false;

  const updatedLines = lines.map(line => {
    if (/^\s*Tale av\s*:/i.test(line)) {
      replaced = true;
      return wanted;
    }
    return line;
  });

  if (replaced) {
    return updatedLines.join("\n").trim();
  }

  if (!original) return wanted;
  return `${original}\n${wanted}`;
}

async function fetchProgram() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(STORSAMLING_URL, {
      headers: {
        "user-agent": USER_AGENT,
        "accept": "text/html,application/xhtml+xml"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ved henting av ${STORSAMLING_URL}`);
    }

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
    // Fail-safe: En feil hos storsamling.no skal aldri ødelegge eller tømme
    // et ellers gyldig arrangementssnapshot.
    console.warn(
      `Storsamling-berikelse hoppes over: ${err?.message || err}`
    );
    return;
  }

  const program = parseProgram(html);

  if (!program.size) {
    console.warn(
      "Storsamling-berikelse: Fant ingen sikre dato/taler-par. Snapshot beholdes uendret."
    );
    return;
  }

  let targetEvents = 0;
  let matched = 0;
  let changed = 0;

  for (const event of snapshot.events) {
    if (!isTargetEvent(event)) continue;

    targetEvents += 1;

    const key = eventDateKey(event.startTime);
    if (!key) continue;

    const speaker = program.get(key);
    if (!speaker) continue;

    matched += 1;

    const nextDescription = appendSpeaker(event.description, speaker);
    if (nextDescription !== String(event.description ?? "").trim()) {
      event.description = nextDescription;
      changed += 1;
    }
  }

  snapshot.enrichment = {
    ...(snapshot.enrichment || {}),
    storsamlingNaerboSpeaker: {
      version: "V001",
      source: STORSAMLING_URL,
      generatedAt: new Date().toISOString(),
      programEntries: program.size,
      targetEvents,
      matched,
      changed
    }
  };

  await fs.writeFile(
    DATA_PATH,
    JSON.stringify(snapshot, null, 2) + "\n",
    "utf8"
  );

  console.log(
    `Storsamling Nærbø: ${program.size} programoppføringer, ` +
    `${targetEvents} aktuelle arrangementer, ${matched} datotreff, ` +
    `${changed} beskrivelser oppdatert.`
  );
}

await main();
