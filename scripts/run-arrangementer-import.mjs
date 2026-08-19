import fs from "node:fs/promises";
import {
  ARRANGEMENT_ENGINE_VERSION,
  ARR_TABLE,
  ARR_F,
  arrListAllRows,
  arrImportAllSources,
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

  // Kildene gjelder Norge. Bruk Europe/Oslo eksplisitt for gruppering.
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

  return {
    start,
    end
  };
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
    if (vigrestadIsEvent(event)) {
      vigrestad.push(event);
    } else {
      passthrough.push(event);
    }
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

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }

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
    if (
      source === normalizeSemanticText("Vigrestad Misjonshus")
    ) {
      n += 10000;
    }

    // Deretter foretrekk mest informative rad.
    if (String(event.description || "").trim()) {
      n += 100;
    }

    if (String(event.sourceUrl || "").trim()) {
      n += 10;
    }

    if (String(event.location || "").trim()) {
      n += 5;
    }

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
        const overlaps = cluster.items.some(existing => {
          const existingInterval = eventInterval(existing);

          return (
            existingInterval &&
            intervalsOverlap(interval, existingInterval)
          );
        });

        if (overlaps) {
          target = cluster;
          break;
        }
      }

      if (!target) {
        target = {
          items: []
        };

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

        return String(a.id || "")
          .localeCompare(String(b.id || ""));
      })[0];

      // Behold tidspunktet fra valgt fasitrad.
      // Vi slår IKKE sammen start/slutt, fordi romreservasjoner ofte
      // starter tidligere enn selve arrangementet.
      deduped.push(best);
    }
  }

  deduped.sort(
    (a, b) =>
      new Date(a.startTime) -
      new Date(b.startTime)
  );

  return {
    events: deduped,
    duplicateGroups,
    overlapGroups,
    removed
  };
}

async function buildSnapshot(importSummary) {
  const [
    eventsRows,
    settlements,
    meetingTypes,
    sources
  ] = await Promise.all([
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

    const publicId = arrClean(
      row[ARR_F.settlements.settlementId] ||
      ""
    );

    const name = arrClean(
      row[ARR_F.settlements.name] ||
      ""
    );

    const municipality = arrClean(
      row[ARR_F.settlements.municipality] ||
      ""
    );

    if (
      Number.isFinite(rowId) &&
      name
    ) {
      settlementNameByRowId.set(
        rowId,
        name
      );
    }

    if (
      publicId &&
      name
    ) {
      settlementNameByPublicId.set(
        arrNormalize(publicId),
        name
      );
    }

    if (name) {
      municipalityBySettlementName.set(
        arrNormalize(name),
        municipality
      );
    }

    if (
      row[ARR_F.settlements.active] !== false &&
      name
    ) {
      activeSettlementNames.add(
        arrNormalize(name)
      );
    }
  }

  const meetingTypeNameByRowId = new Map();
  const meetingTypeNameByPublicId = new Map();

  for (const row of meetingTypes) {
    const rowId = Number(row.id);

    const publicId = arrClean(
      row[ARR_F.meetingTypes.typeId] ||
      ""
    );

    const name = arrClean(
      row[ARR_F.meetingTypes.name] ||
      ""
    );

    if (
      Number.isFinite(rowId) &&
      name
    ) {
      meetingTypeNameByRowId.set(
        rowId,
        name
      );
    }

    if (
      publicId &&
      name
    ) {
      meetingTypeNameByPublicId.set(
        arrNormalize(publicId),
        name
      );
    }
  }

  const activeSourceNames = new Set();
  const activeSourceIds = new Set();

  for (const row of sources) {
    if (
      row[ARR_F.sources.enabled] === false
    ) {
      continue;
    }

    const name = arrClean(
      row[ARR_F.sources.name] ||
      ""
    );

    const id = arrClean(
      row[ARR_F.sources.sourceId] ||
      ""
    );

    if (name) {
      activeSourceNames.add(
        arrNormalize(name)
      );
    }

    if (id) {
      activeSourceIds.add(
        arrNormalize(id)
      );
    }
  }

  const now = Date.now();

  const fromMs =
    now -
    6 * 60 * 60 * 1000;

  const toMs =
    now +
    370 * 86400000;

  const events = [];

  for (const row of eventsRows) {
    if (
      row[ARR_F.events.active] === false
    ) {
      continue;
    }

    const source = arrClean(
      row[ARR_F.events.source] ||
      ""
    );

    const normalizedSource =
      arrNormalize(source);

    if (
      normalizedSource &&
      !activeSourceNames.has(normalizedSource) &&
      !activeSourceIds.has(normalizedSource)
    ) {
      continue;
    }

    const startTime =
      row[ARR_F.events.startTime] ||
      null;

    const startMs =
      new Date(startTime).getTime();

    if (
      !Number.isFinite(startMs) ||
      startMs < fromMs ||
      startMs > toMs
    ) {
      continue;
    }

    const settlementNames =
      linkedNames(
        row[ARR_F.events.settlement],
        settlementNameByRowId,
        settlementNameByPublicId
      );

    if (
      settlementNames.length &&
      !settlementNames.some(
        name =>
          activeSettlementNames.has(
            arrNormalize(name)
          )
      )
    ) {
      continue;
    }

    const settlement =
      settlementNames[0] ||
      "";

    const typeNames =
      linkedNames(
        row[ARR_F.events.meetingType],
        meetingTypeNameByRowId,
        meetingTypeNameByPublicId
      );

    events.push({
      id:
        row[ARR_F.events.eventId] ||
        String(row.id),

      title:
        row[ARR_F.events.title] ||
        "",

      startTime,

      endTime:
        row[ARR_F.events.endTime] ||
        null,

      meetingTypes:
        typeNames,

      organizer:
        arrResolveHaaFellesraadOrganizer(
          row[ARR_F.events.title] ||
          "",
          row[ARR_F.events.organizer] ||
          source ||
          ""
        ),

      location:
        row[ARR_F.events.location] ||
        "",

      settlement,

      municipality:
        municipalityBySettlementName.get(
          arrNormalize(settlement)
        ) ||
        "",

      description:
        row[ARR_F.events.description] ||
        "",

      sourceUrl:
        row[ARR_F.events.sourceUrl] ||
        "",

      source,

      active:
        true
    });
  }

  events.sort(
    (a, b) =>
      new Date(a.startTime) -
      new Date(b.startTime)
  );

  // V403:
  // Dedupe kun i publisert snapshot.
  // Samme Vigrestad-tittel på samme lokale dato samles når tidsintervallene
  // overlapper. Dette håndterer romreservasjoner med litt ulik start/slutt.
  // Ingen Baserow-rader deaktiveres eller slettes.
  const vigrestadSnapshotDedupe =
    dedupeVigrestadSnapshot(events);

  return {
    schemaVersion: 3,

    engineVersion:
      ARRANGEMENT_ENGINE_VERSION,

    generatedAt:
      new Date().toISOString(),

    eventCount:
      vigrestadSnapshotDedupe.events.length,

    importSummary: {
      ...importSummary,

      snapshotDedupe: {
        organizer:
          "Vigrestad Misjonshus",

        duplicateGroups:
          vigrestadSnapshotDedupe
            .duplicateGroups,

        overlapGroups:
          vigrestadSnapshotDedupe
            .overlapGroups,

        removedFromSnapshot:
          vigrestadSnapshotDedupe
            .removed,

        baserowRowsChanged:
          0
      }
    },

    events:
      vigrestadSnapshotDedupe.events
  };
}

console.log(
  `Arrangementer import engine: ${ARRANGEMENT_ENGINE_VERSION}`
);

console.log(
  "Starter full import uten Cloudflare Worker CPU-grense..."
);

// Viktig: cleanup:false.
// Vi sletter aldri historikk før ny import er validert.
// En vellykket source kan fortsatt deaktivere egne arrangementer som faktisk
// er forsvunnet fra kilden; en source som feiler beholder eksisterende data.
const result =
  await arrImportAllSources(
    env,
    {
      cleanup: false
    }
  );

const sourceResults =
  Array.isArray(result.sources)
    ? result.sources
    : [];

const activeSources =
  await arrListAllRows(
    env,
    ARR_TABLE.SOURCES
  );

// V403:
// Ikke kjør destruktiv/deaktiverende Vigrestad-dedupe i Baserow.
// Dedupe skjer kun i snapshotet som publiseres til frontend.
const dedupe = {
  ok: true,
  mode: "snapshot-only",
  baserowRowsChanged: 0,
  note:
    "Vigrestad-duplikater fjernes kun fra arrangementer-data.json."
};

const summary = {
  ok:
    result.ok,

  startedAt:
    result.startedAt,

  finishedAt:
    result.finishedAt,

  created:
    result.created,

  updated:
    result.updated,

  errors:
    result.errors,

  sourceCount:
    sourceResults.length,

  successfulSources:
    sourceResults.filter(
      row => !row.error
    ).length,

  failedSources:
    sourceResults
      .filter(
        row => row.error
      )
      .map(
        row => ({
          sourceId:
            row.sourceId,

          name:
            row.name,

          error:
            row.error
        })
      ),

  dedupe
};

const snapshot =
  await buildSnapshot(summary);

await fs.writeFile(
  outputPath,
  JSON.stringify(
    snapshot,
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(
  JSON.stringify(
    summary,
    null,
    2
  )
);

console.log(
  `Skrev ${snapshot.eventCount} arrangementer til ${outputPath}.`
);

// Workflowen skal fortsatt fullføres selv om enkelte kilder feiler.
// Kildevernet beholder da de eksisterende radene.
if (
  summary.failedSources.length
) {
  console.warn(
    `${summary.failedSources.length} kilde(r) feilet, eksisterende data er beholdt.`
  );
}
