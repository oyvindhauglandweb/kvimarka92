import fs from "node:fs/promises";
import {
  ARRANGEMENT_ENGINE_VERSION,
  ARR_TABLE,
  ARR_F,
  arrListAllRows,
  arrImportAllSources,
  arrDedupeExistingVigrestad,
  arrClean,
  arrNormalize,
  arrResolveHaaFellesraadOrganizer
} from "./arrangementer-engine.mjs";

const env = {
  ARRANGEMENT_BASEROW_TOKEN: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  BASEROW_API_BASE: process.env.BASEROW_API_BASE || "https://api.baserow.io"
};

if (!env.ARRANGEMENT_BASEROW_TOKEN) {
  throw new Error("ARRANGEMENT_BASEROW_TOKEN mangler.");
}

const outputPath = process.env.ARRANGEMENT_DATA_PATH || "arrangementer-data.json";

function linkedNames(linkValue, byRowId, byPublicId) {
  if (!Array.isArray(linkValue)) return [];
  const names = [];

  for (const item of linkValue) {
    if (typeof item === "number") {
      const name = byRowId.get(item);
      if (name) names.push(name);
      continue;
    }

    if (typeof item === "string") {
      const name = byPublicId.get(arrNormalize(item));
      if (name) names.push(name);
      continue;
    }

    const rowId = Number(item?.id);
    const rawValue = arrClean(item?.value ?? item?.name ?? "");
    const name =
      (Number.isFinite(rowId) ? byRowId.get(rowId) : "") ||
      (rawValue ? byPublicId.get(arrNormalize(rawValue)) : "") ||
      rawValue;

    if (name) names.push(name);
  }

  return [...new Set(names)];
}

async function buildSnapshot(importSummary) {
  const [eventsRows, settlements, meetingTypes, sources] = await Promise.all([
    arrListAllRows(env, ARR_TABLE.EVENTS),
    arrListAllRows(env, ARR_TABLE.SETTLEMENTS),
    arrListAllRows(env, ARR_TABLE.MEETING_TYPES),
    arrListAllRows(env, ARR_TABLE.SOURCES)
  ]);

  const settlementNameByRowId = new Map();
  const settlementNameByPublicId = new Map();
  const municipalityBySettlementName = new Map();
  const activeSettlementNames = new Set();

  for (const row of settlements) {
    const rowId = Number(row.id);
    const publicId = arrClean(row[ARR_F.settlements.settlementId] || "");
    const name = arrClean(row[ARR_F.settlements.name] || "");
    const municipality = arrClean(row[ARR_F.settlements.municipality] || "");

    if (Number.isFinite(rowId) && name) settlementNameByRowId.set(rowId, name);
    if (publicId && name) settlementNameByPublicId.set(arrNormalize(publicId), name);
    if (name) municipalityBySettlementName.set(arrNormalize(name), municipality);

    if (row[ARR_F.settlements.active] !== false && name) {
      activeSettlementNames.add(arrNormalize(name));
    }
  }

  const meetingTypeNameByRowId = new Map();
  const meetingTypeNameByPublicId = new Map();

  for (const row of meetingTypes) {
    const rowId = Number(row.id);
    const publicId = arrClean(row[ARR_F.meetingTypes.typeId] || "");
    const name = arrClean(row[ARR_F.meetingTypes.name] || "");

    if (Number.isFinite(rowId) && name) meetingTypeNameByRowId.set(rowId, name);
    if (publicId && name) meetingTypeNameByPublicId.set(arrNormalize(publicId), name);
  }

  const activeSourceNames = new Set();
  const activeSourceIds = new Set();

  for (const row of sources) {
    if (row[ARR_F.sources.enabled] === false) continue;
    const name = arrClean(row[ARR_F.sources.name] || "");
    const id = arrClean(row[ARR_F.sources.sourceId] || "");
    if (name) activeSourceNames.add(arrNormalize(name));
    if (id) activeSourceIds.add(arrNormalize(id));
  }

  const now = Date.now();
  const fromMs = now - 6 * 60 * 60 * 1000;
  const toMs = now + 370 * 86400000;
  const events = [];

  for (const row of eventsRows) {
    if (row[ARR_F.events.active] === false) continue;

    const source = arrClean(row[ARR_F.events.source] || "");
    const normalizedSource = arrNormalize(source);

    if (
      normalizedSource &&
      !activeSourceNames.has(normalizedSource) &&
      !activeSourceIds.has(normalizedSource)
    ) continue;

    const startTime = row[ARR_F.events.startTime] || null;
    const startMs = new Date(startTime).getTime();
    if (!Number.isFinite(startMs) || startMs < fromMs || startMs > toMs) continue;

    const settlementNames = linkedNames(
      row[ARR_F.events.settlement],
      settlementNameByRowId,
      settlementNameByPublicId
    );

    if (
      settlementNames.length &&
      !settlementNames.some(name => activeSettlementNames.has(arrNormalize(name)))
    ) continue;

    const settlement = settlementNames[0] || "";
    const typeNames = linkedNames(
      row[ARR_F.events.meetingType],
      meetingTypeNameByRowId,
      meetingTypeNameByPublicId
    );

    events.push({
      id: row[ARR_F.events.eventId] || String(row.id),
      title: row[ARR_F.events.title] || "",
      startTime,
      endTime: row[ARR_F.events.endTime] || null,
      meetingTypes: typeNames,
      organizer: arrResolveHaaFellesraadOrganizer(
        row[ARR_F.events.title] || "",
        row[ARR_F.events.organizer] || source || ""
      ),
      location: row[ARR_F.events.location] || "",
      settlement,
      municipality: municipalityBySettlementName.get(arrNormalize(settlement)) || "",
      description: row[ARR_F.events.description] || "",
      sourceUrl: row[ARR_F.events.sourceUrl] || "",
      source,
      active: true
    });
  }

  events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return {
    schemaVersion: 1,
    engineVersion: ARRANGEMENT_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
    importSummary,
    events
  };
}

console.log(`Arrangementer import engine: ${ARRANGEMENT_ENGINE_VERSION}`);
console.log("Starter full import uten Cloudflare Worker CPU-grense...");

// Viktig: cleanup:false.
// Vi sletter aldri historikk før ny import er validert.
// En vellykket source kan fortsatt deaktivere egne arrangementer som faktisk
// er forsvunnet fra kilden; en source som feiler beholder eksisterende data.
const result = await arrImportAllSources(env, { cleanup: false });

const sourceResults = Array.isArray(result.sources) ? result.sources : [];
const activeSources = await arrListAllRows(env, ARR_TABLE.SOURCES);

const vigrestadSourceIds = activeSources
  .filter(row => row[ARR_F.sources.enabled] !== false)
  .map(row => ({
    id: arrClean(row[ARR_F.sources.sourceId] || ""),
    name: arrClean(row[ARR_F.sources.name] || "")
  }))
  .filter(source =>
    /^SRC-(?:001[6-9]|002[0-6])$/i.test(source.id) ||
    arrNormalize(source.name).startsWith(arrNormalize("Vigrestad Misjonshus"))
  );

const resultById = new Map(
  sourceResults.map(row => [arrClean(row.sourceId || ""), row])
);

const allVigrestadSucceeded =
  vigrestadSourceIds.length > 0 &&
  vigrestadSourceIds.every(source => {
    const row = resultById.get(source.id);
    return row && !row.error;
  });

let dedupe = {
  ok: false,
  skipped: true,
  reason: "Ikke alle aktive Vigrestad-kilder lyktes."
};

if (allVigrestadSucceeded) {
  console.log("Alle Vigrestad-kilder lyktes. Kjører isolert dedupe...");
  dedupe = await arrDedupeExistingVigrestad(env);
}

const summary = {
  ok: result.ok,
  startedAt: result.startedAt,
  finishedAt: result.finishedAt,
  created: result.created,
  updated: result.updated,
  errors: result.errors,
  sourceCount: sourceResults.length,
  successfulSources: sourceResults.filter(row => !row.error).length,
  failedSources: sourceResults
    .filter(row => row.error)
    .map(row => ({
      sourceId: row.sourceId,
      name: row.name,
      error: row.error
    })),
  dedupe
};

const snapshot = await buildSnapshot(summary);
await fs.writeFile(outputPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

console.log(JSON.stringify(summary, null, 2));
console.log(`Skrev ${snapshot.eventCount} arrangementer til ${outputPath}.`);

// Vi lar workflowen være "successful" selv om enkelte kilder feiler,
// fordi fail-safe beholder deres gamle datasett. Feilene vises tydelig i
// snapshot/importSummary og Actions-loggen.
if (summary.failedSources.length) {
  console.warn(`${summary.failedSources.length} kilde(r) feilet, eksisterende data er beholdt.`);
}
