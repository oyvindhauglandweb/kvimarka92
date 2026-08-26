import fs from "node:fs/promises";
import {
  ARRANGEMENT_ENGINE_VERSION,
  ARR_AREAS,
  ARR_TABLE,
  ARR_F,
  arrUseArea,
  arrListAllRows,
  arrCreateRowsBatch,
  arrUpdateRowsBatch,
  arrLoadOrganizations,
  arrImportAllSources,
  arrClean,
  arrNormalize,
  arrResolveHaaFellesraadOrganizer
} from "./arrangementer-engine.mjs";

const env = {
  ARRANGEMENT_BASEROW_TOKEN: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_DEFAULT:
    process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_SANDNES:
    process.env.ARRANGEMENT_BASEROW_TOKEN_SANDNES || "",
  ARRANGEMENT_BASEROW_TOKEN_STAVANGER:
    process.env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER || "",
  BASEROW_API_BASE: process.env.BASEROW_API_BASE || "https://api.baserow.io"
};

if (!env.ARRANGEMENT_BASEROW_TOKEN) {
  throw new Error("ARRANGEMENT_BASEROW_TOKEN mangler.");
}

if (!env.ARRANGEMENT_BASEROW_TOKEN_SANDNES) {
  throw new Error("ARRANGEMENT_BASEROW_TOKEN_SANDNES mangler.");
}

if (!env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER) {
  throw new Error("ARRANGEMENT_BASEROW_TOKEN_STAVANGER mangler.");
}

const outputPath = process.env.ARRANGEMENT_DATA_PATH || "arrangementer-data.json";

// V458: Én felles Organizers-tabell for alle workspaces/områder.
const ORGANIZERS_TABLE = 1158581;
const ORGANIZER_F = {
  organizerId:"field_10401282",
  name:"field_10401283",
  textColor:"field_10401691",
  active:"field_10401284"
};

const historyPath = process.env.ARRANGEMENT_HISTORY_PATH || "arrangementer-import-history.json";


function envForArea(areaKey) {
  if (areaKey === "sandnes") {
    return {
      ...env,
      ARRANGEMENT_BASEROW_TOKEN: env.ARRANGEMENT_BASEROW_TOKEN_SANDNES
    };
  }

  if (areaKey === "stavanger") {
    return {
      ...env,
      ARRANGEMENT_BASEROW_TOKEN: env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER
    };
  }

  return {
    ...env,
    ARRANGEMENT_BASEROW_TOKEN: env.ARRANGEMENT_BASEROW_TOKEN
  };
}

function textOrganizationIds(value) {
  return [...new Set(
    String(value || "")
      .split(/[;,]/)
      .map(v => arrClean(v).toUpperCase())
      .filter(v => /^ORG-\d{4,}$/.test(v))
  )];
}

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


function normalizeSemanticText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function vigrestadIsEvent(event) {
  return normalizeSemanticText(event?.organizer) ===
    normalizeSemanticText("Vigrestad Misjonshus");
}

function localDateKey(value) {
  const d = new Date(value || "");
  if (!Number.isFinite(d.getTime())) return "";

  // Kildene gjelder Norge. Snapshotet brukes for 2026-data, der browser/front-end
  // presenterer norsk lokal tid. Bruk Europe/Oslo eksplisitt for gruppering.
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

function eventInterval(event) {
  const start = new Date(event?.startTime || "").getTime();
  if (!Number.isFinite(start)) return null;

  let end = new Date(event?.endTime || "").getTime();
  if (!Number.isFinite(end) || end < start) {
    end = start;
  }

  return { start, end };
}

function intervalsOverlap(a, b) {
  // Samme tittel på samme dag regnes som samme Vigrestad-arrangement når
  // tidsintervallene overlapper. Dette håndterer romkalendere som reserverer
  // f.eks. 17:00–18:30 mens hovedkalenderen oppgir 17:30–18:30.
  return a.start <= b.end && b.start <= a.end;
}

function dedupeVigrestadSnapshot(events) {
  const passthrough = [];
  const vigrestad = [];

  for (const event of events) {
    if (vigrestadIsEvent(event)) vigrestad.push(event);
    else passthrough.push(event);
  }

  const buckets = new Map();

  for (const event of vigrestad) {
    const title = normalizeSemanticText(event?.title);
    const day = localDateKey(event?.startTime);

    if (!title || !day) {
      passthrough.push(event);
      continue;
    }

    const key = `${day}|${title}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(event);
  }

  let duplicateGroups = 0;
  let removed = 0;
  let overlapGroups = 0;
  const deduped = [...passthrough];

  const score = event => {
    let n = 0;
    const source = normalizeSemanticText(event.source || "");

    // Hovedkilden er fasit når den finnes.
    if (source === normalizeSemanticText("Vigrestad Misjonshus")) n += 10000;

    // Deretter foretrekk mest informative rad.
    if (String(event.description || "").trim()) n += 100;
    if (String(event.sourceUrl || "").trim()) n += 10;
    if (String(event.location || "").trim()) n += 5;

    return n;
  };

  for (const items of buckets.values()) {
    // Sorter kronologisk og bygg klynger av overlappende tidsintervaller.
    const ordered = [...items].sort((a, b) => {
      const ai = eventInterval(a);
      const bi = eventInterval(b);
      return (ai?.start ?? 0) - (bi?.start ?? 0);
    });

    const clusters = [];

    for (const item of ordered) {
      const interval = eventInterval(item);

      if (!interval) {
        deduped.push(item);
        continue;
      }

      let target = null;

      for (const cluster of clusters) {
        if (cluster.items.some(existing => {
          const existingInterval = eventInterval(existing);
          return existingInterval && intervalsOverlap(interval, existingInterval);
        })) {
          target = cluster;
          break;
        }
      }

      if (!target) {
        target = { items: [] };
        clusters.push(target);
      }

      target.items.push(item);
    }

    for (const cluster of clusters) {
      if (cluster.items.length === 1) {
        deduped.push(cluster.items[0]);
        continue;
      }

      duplicateGroups++;
      overlapGroups++;
      removed += cluster.items.length - 1;

      const best = [...cluster.items].sort((a, b) => {
        const d = score(b) - score(a);
        if (d) return d;
        return String(a.id || "").localeCompare(String(b.id || ""));
      })[0];

      // Behold tidspunktet fra valgt fasitrad. Vi slår IKKE sammen start/slutt,
      // fordi romreservasjoner ofte starter tidligere enn selve arrangementet.
      deduped.push(best);
    }
  }

  deduped.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return {
    events: deduped,
    duplicateGroups,
    overlapGroups,
    removed
  };
}


function dedupeExactSnapshotEvents(events) {
  const seen = new Set();
  const output = [];
  let removed = 0;

  const clean = value => String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("no");

  const iso = value => {
    const d = new Date(value || "");
    return Number.isNaN(d.getTime()) ? clean(value) : d.toISOString();
  };

  for (const event of Array.isArray(events) ? events : []) {
    const key = [
      iso(event.startTime || event.start),
      iso(event.endTime || event.end),
      clean(event.title),
      clean(event.organizer),
      clean(event.location),
      clean(event.settlement),
      clean(event.municipality),
      clean(event.description)
    ].join("|");

    if (seen.has(key)) {
      removed++;
      continue;
    }

    seen.add(key);
    output.push(event);
  }

  return { events: output, removed };
}

async function migrateAreaOutOfDefault(areaKey) {
  if (areaKey === "default") {
    throw new Error("Kan ikke migrere default-området ut av seg selv.");
  }

  // Les målområdets kilder. Disse er fasiten for hvilke kilder som er flyttet.
  arrUseArea(areaKey);
  const targetArea = ARR_AREAS[areaKey];
  const targetEnv = envForArea(areaKey);
  const targetSources = await arrListAllRows(
    targetEnv,
    targetArea.tables.SOURCES
  );

  const movedSourceIds = new Set();
  const movedSourceNames = new Set();

  for (const row of targetSources) {
    const id = arrClean(row[targetArea.fields.sources.sourceId] || "");
    const name = arrClean(row[targetArea.fields.sources.name] || "");

    if (id) movedSourceIds.add(arrNormalize(id));
    if (name) movedSourceNames.add(arrNormalize(name));
  }

  if (!movedSourceIds.size && !movedSourceNames.size) {
    throw new Error(
      `${targetArea.name}: ingen kilder funnet i mål-workspacet; migrering avbrytes.`
    );
  }

  // Bytt tilbake til gammel fellesdatabase.
  arrUseArea("default");
  const defaultArea = ARR_AREAS.default;
  const defaultEnv = envForArea("default");

  const [oldSources, oldEvents] = await Promise.all([
    arrListAllRows(defaultEnv, defaultArea.tables.SOURCES),
    arrListAllRows(defaultEnv, defaultArea.tables.EVENTS)
  ]);

  const sourceUpdates = [];

  for (const row of oldSources) {
    const id = arrNormalize(
      arrClean(row[defaultArea.fields.sources.sourceId] || "")
    );
    const name = arrNormalize(
      arrClean(row[defaultArea.fields.sources.name] || "")
    );

    const moved =
      (id && movedSourceIds.has(id)) ||
      (name && movedSourceNames.has(name));

    if (
      moved &&
      row[defaultArea.fields.sources.enabled] !== false
    ) {
      sourceUpdates.push({
        id: row.id,
        [defaultArea.fields.sources.enabled]: false
      });
    }
  }

  if (sourceUpdates.length) {
    await arrUpdateRowsBatch(
      defaultEnv,
      defaultArea.tables.SOURCES,
      sourceUpdates
    );
  }

  const eventUpdates = [];

  for (const row of oldEvents) {
    if (row[defaultArea.fields.events.active] === false) {
      continue;
    }

    const source = arrNormalize(
      arrClean(row[defaultArea.fields.events.source] || "")
    );

    if (!source) continue;

    const moved =
      movedSourceIds.has(source) ||
      movedSourceNames.has(source);

    if (moved) {
      eventUpdates.push({
        id: row.id,
        [defaultArea.fields.events.active]: false
      });
    }
  }

  if (eventUpdates.length) {
    await arrUpdateRowsBatch(
      defaultEnv,
      defaultArea.tables.EVENTS,
      eventUpdates
    );
  }

  return {
    area: areaKey,
    areaName: targetArea.name,
    matchedSourceIds: movedSourceIds.size,
    matchedSourceNames: movedSourceNames.size,
    oldSourcesDisabled: sourceUpdates.length,
    oldEventsDeactivated: eventUpdates.length,
    deletedRows: 0
  };
}

async function readAreaSnapshotEvents(areaKey, organizationNameById) {
  arrUseArea(areaKey);
  const areaEnv = envForArea(areaKey);

  const [eventsRows, settlements, meetingTypes, sources] = await Promise.all([
    arrListAllRows(areaEnv, ARR_TABLE.EVENTS),
    arrListAllRows(areaEnv, ARR_TABLE.SETTLEMENTS),
    arrListAllRows(areaEnv, ARR_TABLE.MEETING_TYPES),
    arrListAllRows(areaEnv, ARR_TABLE.SOURCES)
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

    const organizationIds = textOrganizationIds(
      row[ARR_F.events.organizationIds] || ""
    );
    const organizationNames = organizationIds
      .map(id => organizationNameById.get(id) || "")
      .filter(Boolean);

    events.push({
      id: row[ARR_F.events.eventId] || String(row.id),
      title: row[ARR_F.events.title] || "",
      startTime,
      endTime: row[ARR_F.events.endTime] || null,
      meetingTypes: typeNames,
      organizationIds,
      organizations: organizationNames,
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

  return events;
}


function organizerSelectText(value) {
  if (value == null) return "";
  if (typeof value === "string") return arrClean(value);
  if (typeof value === "object") return arrClean(value.value ?? value.name ?? "");
  return arrClean(String(value));
}

function nextOrganizerId(existingIds, offset=1) {
  let max = 0;
  for (const id of existingIds) {
    const m = /^ORGZ-(\d+)$/i.exec(arrClean(id));
    if (m) max = Math.max(max, Number(m[1]) || 0);
  }
  return `ORGZ-${String(max + offset).padStart(4,"0")}`;
}

async function collectAllOrganizerNames() {
  const namesByNorm = new Map();

  for (const areaKey of ["default","sandnes","stavanger"]) {
    arrUseArea(areaKey);
    const cfg = ARR_AREAS[areaKey];
    const areaEnv = envForArea(areaKey);
    const [events, sources] = await Promise.all([
      arrListAllRows(areaEnv, cfg.tables.EVENTS),
      arrListAllRows(areaEnv, cfg.tables.SOURCES)
    ]);

    const sourceNameByRowId = new Map(
      sources.map(row => [Number(row.id), arrClean(row[cfg.fields.sources.name] || "")])
    );

    for (const row of events) {
      if (row[cfg.fields.events.active] === false) continue;

      const linked = Array.isArray(row[cfg.fields.events.source])
        ? row[cfg.fields.events.source]
        : row[cfg.fields.events.source]
          ? [row[cfg.fields.events.source]]
          : [];
      const sourceRowId = Number(linked[0]?.id ?? linked[0]);
      const sourceName = sourceNameByRowId.get(sourceRowId) || "";

      const organizer = arrResolveHaaFellesraadOrganizer(
        row[cfg.fields.events.title] || "",
        row[cfg.fields.events.organizer] || sourceName || ""
      );

      const clean = arrClean(organizer);
      const norm = arrNormalize(clean);
      if (clean && norm && !namesByNorm.has(norm)) namesByNorm.set(norm, clean);
    }
  }

  return [...namesByNorm.values()].sort((a,b) => a.localeCompare(b, "nb"));
}

async function syncCentralOrganizers() {
  const centralEnv = envForArea("default");
  const [existing, allNames] = await Promise.all([
    arrListAllRows(centralEnv, ORGANIZERS_TABLE),
    collectAllOrganizerNames()
  ]);

  const existingByNorm = new Map();
  const existingIds = [];

  for (const row of existing) {
    const name = arrClean(row[ORGANIZER_F.name] || "");
    const norm = arrNormalize(name);
    if (norm && !existingByNorm.has(norm)) existingByNorm.set(norm, row);
    existingIds.push(arrClean(row[ORGANIZER_F.organizerId] || ""));
  }

  const missing = allNames.filter(name => !existingByNorm.has(arrNormalize(name)));
  const creates = missing.map((name, index) => ({
    [ORGANIZER_F.organizerId]: nextOrganizerId(existingIds, index + 1),
    [ORGANIZER_F.name]: name,
    [ORGANIZER_F.active]: true
    // Text Color intentionally left blank = automatic frontend color.
  }));

  if (creates.length) {
    await arrCreateRowsBatch(centralEnv, ORGANIZERS_TABLE, creates, 100);
  }

  const rows = creates.length
    ? await arrListAllRows(centralEnv, ORGANIZERS_TABLE)
    : existing;

  return {
    created: creates.length,
    total: rows.length,
    rows: rows
      .filter(row => row[ORGANIZER_F.active] !== false)
      .map(row => ({
        id: arrClean(row[ORGANIZER_F.organizerId] || ""),
        name: arrClean(row[ORGANIZER_F.name] || ""),
        textColor: organizerSelectText(row[ORGANIZER_F.textColor])
      }))
      .filter(row => row.name)
      .sort((a,b) => a.name.localeCompare(b.name, "nb"))
  };
}

async function buildSnapshot(importSummary) {
  const areaKeys = ["default", "sandnes", "stavanger"];
  const allEvents = [];

  const organizations = await arrLoadOrganizations(envForArea("default"));
  const organizationNameById = new Map(
    organizations.map(row => [String(row.id || "").toUpperCase(), row.name || row.id])
  );

  for (const areaKey of areaKeys) {
    allEvents.push(...await readAreaSnapshotEvents(areaKey, organizationNameById));
  }

  allEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Vigrestad-dedupe skjer fortsatt kun i publisert snapshot.
  const vigrestadSnapshotDedupe = dedupeVigrestadSnapshot(allEvents);

  // Fjern deretter kun helt identiske publiserte arrangementer generelt.
  // Databasen røres ikke; dette gjelder bare arrangementer-data.json.
  const exactSnapshotDedupe = dedupeExactSnapshotEvents(
    vigrestadSnapshotDedupe.events
  );

  const organizerSync = await syncCentralOrganizers();

  return {
    schemaVersion: 6,
    engineVersion: ARRANGEMENT_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    areas: areaKeys.map(key => ({
      key,
      name: ARR_AREAS[key].name,
      eventsTable: ARR_AREAS[key].tables.EVENTS
    })),
    eventCount: exactSnapshotDedupe.events.length,
    importSummary: {
      ...importSummary,
      snapshotDedupe: {
        organizer: "Vigrestad Misjonshus",
        duplicateGroups: vigrestadSnapshotDedupe.duplicateGroups,
        overlapGroups: vigrestadSnapshotDedupe.overlapGroups,
        removedFromSnapshot: vigrestadSnapshotDedupe.removed,
        exactDuplicatesRemoved: exactSnapshotDedupe.removed,
        baserowRowsChanged: 0
      }
    },
    organizers: organizerSync.rows,
    organizerSync: { created: organizerSync.created, total: organizerSync.total },
    events: exactSnapshotDedupe.events
  };
}

console.log(`Arrangementer import engine: ${ARRANGEMENT_ENGINE_VERSION}`);
console.log("Starter multi-area import: Felles + Sandnes + Stavanger...");

// Importene kjøres sekvensielt. Det er bevisst:
// ARR_TABLE/ARR_F peker på ett område om gangen, og sekvensiell kjøring
// gjør områdebyttet deterministisk og enkelt å feilsøke.
const defaultResult = await arrImportAllSources(
  envForArea("default"),
  {
    cleanup: false,
    area: "default"
  }
);

const sandnesResult = await arrImportAllSources(
  envForArea("sandnes"),
  {
    cleanup: false,
    area: "sandnes"
  }
);

const stavangerResult = await arrImportAllSources(
  envForArea("stavanger"),
  {
    cleanup: false,
    area: "stavanger"
  }
);

// Når et område er importert til sitt eget workspace, sørger vi automatisk
// for at de samme kildene ikke lenger er aktive i gammel fellesdatabase.
// Dette er idempotent: bare fortsatt aktive kilder/events blir PATCH-et.
const sandnesMigration = await migrateAreaOutOfDefault("sandnes");
const stavangerMigration = await migrateAreaOutOfDefault("stavanger");

const areaResults = [
  { key: "default", result: defaultResult },
  { key: "sandnes", result: sandnesResult },
  { key: "stavanger", result: stavangerResult }
];


// V459: Les tidligere historikk før vi bygger alarmsammendraget.
// Dette brukes kun til å telle sammenhengende, mindre kritiske kildefeil.
let previousHistory = [];
try {
  const rawHistory = await fs.readFile(historyPath, "utf8");
  const parsedHistory = JSON.parse(rawHistory);
  previousHistory = Array.isArray(parsedHistory?.imports)
    ? parsedHistory.imports
    : Array.isArray(parsedHistory)
      ? parsedHistory
      : [];
} catch (_) {
  previousHistory = [];
}

const DEFERRED_SOURCE_ALARM_THRESHOLD = 12;

function sourceFailureKey(row) {
  return `${arrNormalize(row?.area || "")}|${arrNormalize(row?.sourceId || "")}|${arrNormalize(row?.name || "")}`;
}

function isDeferredSourceAlarm(error) {
  const text = arrClean(error || "");
  // V459: "VENTER – ..." betyr kjent/forventet manglende parser/feed.
  // Disse er ikke kritiske ved enkeltstående eller sporadiske forekomster.
  return /^VENTER\s*[–-]/i.test(text);
}

function previousSourceResultFor(historyRow, currentRow) {
  const targetKey = sourceFailureKey(currentRow);
  const rows = Array.isArray(historyRow?.sourceResults) ? historyRow.sourceResults : [];
  return rows.find(row => sourceFailureKey(row) === targetKey) || null;
}

function consecutiveDeferredFailureCount(currentRow) {
  if (!currentRow?.error || !isDeferredSourceAlarm(currentRow.error)) return 0;

  let count = 1; // current import
  for (const historyRow of previousHistory) {
    const previous = previousSourceResultFor(historyRow, currentRow);

    // Manglende kilde i en historikkrad bryter rekken.
    if (!previous) break;

    // En vellykket lesing nullstiller telleren.
    if (!previous.error) break;

    // Vi teller bare den samme typen utsatt alarm.
    if (!isDeferredSourceAlarm(previous.error)) break;

    count += 1;
  }
  return count;
}

const sourceResults = areaResults.flatMap(({key, result}) =>
  (Array.isArray(result.sources) ? result.sources : []).map(row => ({
    ...row,
    area: key
  }))
);

// Ingen destruktiv Vigrestad-dedupe i Baserow.
const dedupe = {
  ok: true,
  mode: "snapshot-only",
  baserowRowsChanged: 0,
  note: "Vigrestad-duplikater fjernes kun fra arrangementer-data.json."
};

const rawFailedSources = sourceResults
  .filter(row => row.error)
  .map(row => ({
    area: row.area,
    sourceId: row.sourceId,
    name: row.name,
    error: row.error
  }));

const sourceAlarmStatus = rawFailedSources.map(row => {
  const deferred = isDeferredSourceAlarm(row.error);
  const consecutiveFailures = deferred ? consecutiveDeferredFailureCount(row) : 1;
  return {
    ...row,
    deferred,
    consecutiveFailures,
    threshold: deferred ? DEFERRED_SOURCE_ALARM_THRESHOLD : 1,
    alarm: !deferred || consecutiveFailures >= DEFERRED_SOURCE_ALARM_THRESHOLD
  };
});

const failedSources = sourceAlarmStatus.filter(row => row.alarm);
const suppressedSourceFailures = sourceAlarmStatus.filter(row => !row.alarm);

const areaAlarmCounts = new Map();
for (const row of failedSources) {
  areaAlarmCounts.set(row.area, (areaAlarmCounts.get(row.area) || 0) + 1);
}

const summary = {
  // "ok" betyr fra V459 at ingen kildefeil har nådd alarmnivå.
  // Råfeil beholdes separat i rawFailedSources/sourceResults for diagnostikk.
  ok: failedSources.length === 0,
  startedAt: areaResults
    .map(({result}) => result.startedAt)
    .filter(Boolean)
    .sort()[0] || null,
  finishedAt: areaResults
    .map(({result}) => result.finishedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null,
  created: areaResults.reduce((sum, {result}) => sum + Number(result.created || 0), 0),
  updated: areaResults.reduce((sum, {result}) => sum + Number(result.updated || 0), 0),

  // "errors" er alarmverdige feil. rawErrors viser alle rå kildefeil.
  errors: failedSources.length,
  rawErrors: rawFailedSources.length,

  sourceCount: sourceResults.length,
  successfulSources: sourceResults.filter(row => !row.error).length,

  // Kun feil som faktisk skal gi alarm nå.
  failedSources: failedSources.map(row => ({
    area: row.area,
    sourceId: row.sourceId,
    name: row.name,
    error: row.error,
    consecutiveFailures: row.consecutiveFailures,
    threshold: row.threshold
  })),

  // Sporadiske/kjente "VENTER"-feil beholdes synlig som diagnostikk,
  // men gir ikke alarm før 12 sammenhengende forekomster.
  suppressedSourceFailures: suppressedSourceFailures.map(row => ({
    area: row.area,
    sourceId: row.sourceId,
    name: row.name,
    error: row.error,
    consecutiveFailures: row.consecutiveFailures,
    threshold: row.threshold
  })),

  rawFailedSources,

  sourceResults: sourceResults.map(row => {
    const alarmState = sourceAlarmStatus.find(state =>
      sourceFailureKey(state) === sourceFailureKey(row)
    );
    return {
      area: row.area,
      sourceId: row.sourceId,
      name: row.name,
      created: Number(row.created || 0),
      updated: Number(row.updated || 0),
      skipped: Number(row.skipped || 0),
      error: row.error || null,
      consecutiveFailures: alarmState?.consecutiveFailures || 0,
      alarm: Boolean(alarmState?.alarm),
      deferredAlarm: Boolean(alarmState?.deferred),
      createdEvents: Array.isArray(row.createdEvents) ? row.createdEvents : []
    };
  }),

  areas: areaResults.map(({key, result}) => ({
    key,
    name: ARR_AREAS[key].name,
    eventsTable: ARR_AREAS[key].tables.EVENTS,
    sourcesTable: ARR_AREAS[key].tables.SOURCES,
    created: result.created,
    updated: result.updated,
    // Alarmverdige feil i området.
    errors: areaAlarmCounts.get(key) || 0,
    // Alle råfeil beholdes for diagnose.
    rawErrors: Number(result.errors || 0),
    sourceCount: Array.isArray(result.sources) ? result.sources.length : 0,
    diagnostics: result.diagnostics || undefined
  })),
  migrations: [
    sandnesMigration,
    stavangerMigration
  ],
  dedupe
};

const snapshot = await buildSnapshot(summary);
await fs.writeFile(outputPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

// V422: Behold en kompakt historikk over de siste 50 importene.
// Historikken ligger i GitHub sammen med snapshotet og bruker ingen Baserow-rader.
const historyEntry = {
  generatedAt: snapshot.generatedAt,
  engineVersion: ARRANGEMENT_ENGINE_VERSION,
  ok: summary.ok,
  startedAt: summary.startedAt,
  finishedAt: summary.finishedAt,
  eventCount: snapshot.eventCount,
  created: summary.created,
  updated: summary.updated,
  errors: summary.errors,
  rawErrors: summary.rawErrors,
  sourceCount: summary.sourceCount,
  successfulSources: summary.successfulSources,
  failedSources: summary.failedSources,
  suppressedSourceFailures: summary.suppressedSourceFailures,
  rawFailedSources: summary.rawFailedSources,
  areas: summary.areas.map(area => ({
    key: area.key,
    name: area.name,
    eventsTable: area.eventsTable,
    sourcesTable: area.sourcesTable,
    created: Number(area.created || 0),
    updated: Number(area.updated || 0),
    errors: Number(area.errors || 0),
    rawErrors: Number(area.rawErrors || 0),
    sourceCount: Number(area.sourceCount || 0)
  })),
  sourceResults: summary.sourceResults,
  migrations: summary.migrations,
  snapshotDedupe: snapshot.importSummary?.snapshotDedupe || null
};

const history = {
  schemaVersion: 1,
  generatedAt: snapshot.generatedAt,
  imports: [
    historyEntry,
    ...previousHistory.filter(row => row?.generatedAt !== historyEntry.generatedAt)
  ].slice(0, 50)
};

await fs.writeFile(historyPath, JSON.stringify(history, null, 2) + "\n", "utf8");

console.log(JSON.stringify(summary, null, 2));
console.log(`Skrev ${snapshot.eventCount} arrangementer fra ${snapshot.areas.length} områder til ${outputPath}.`);

if (summary.failedSources.length) {
  console.warn(`${summary.failedSources.length} kilde(r) har nådd alarmnivå, eksisterende data er beholdt.`);
} else if (summary.suppressedSourceFailures.length) {
  console.log(
    `${summary.suppressedSourceFailures.length} kjent/sporadisk kildefeil under alarmgrensen ` +
    `(${DEFERRED_SOURCE_ALARM_THRESHOLD} på rad); ingen alarm.`
  );
}
