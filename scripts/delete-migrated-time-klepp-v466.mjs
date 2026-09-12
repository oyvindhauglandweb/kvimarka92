import fs from "node:fs/promises";

const API_BASE = String(process.env.BASEROW_API_BASE || "https://api.baserow.io").replace(/\/$/, "");
const OLD_TOKEN = String(process.env.ARRANGEMENT_BASEROW_TOKEN || "").trim();
const TIME_TOKEN = String(process.env.ARRANGEMENT_BASEROW_TOKEN_TIME || "").trim();
const KLEPP_TOKEN = String(process.env.ARRANGEMENT_BASEROW_TOKEN_KLEPP || "").trim();
const CONFIRM = String(process.env.CONFIRM_CLEANUP || "").trim();

const MANIFEST_FILE = "scripts/arrangementer-cleanup-manifest-v466.json";
const REPORT_FILE = "arrangementer-cleanup-result-v466.json";
const SETTLEMENT_REPORT_FILE = "arrangementer-settlement-cleanup-candidates-v466.json";

const CFG = {
  old: {
    tables: {
      events: 1137493,
      sources: 1137506,
      settlements: 1137544
    },
    fields: {
      events: {
        eventId: "field_10177330",
        title: "field_10177331",
        source: "field_10177399",
        active: "field_10177442",
        settlement: "field_10178013"
      },
      sources: {
        sourceId: "field_10177445",
        name: "field_10177446",
        enabled: "field_10177499",
        defaultSettlement: "field_10178042"
      },
      settlements: {
        settlementId: "field_10177956",
        name: "field_10177957",
        municipality: "field_10177958",
        active: "field_10178007"
      }
    }
  },
  time: {
    tables: { events: 1193653, sources: 1193657 },
    fields: {
      events: { source: "field_10794703" },
      sources: {
        sourceId: "field_10794743",
        name: "field_10794745"
      }
    }
  },
  klepp: {
    tables: { events: 1193659, sources: 1193663 },
    fields: {
      events: { source: "field_10794774" },
      sources: {
        sourceId: "field_10794804",
        name: "field_10794806"
      }
    }
  }
};

function clean(v) {
  return String(v ?? "").trim();
}

function norm(v) {
  return clean(v).replace(/\s+/g, " ").toLocaleLowerCase("nb-NO");
}

function headers(token) {
  return { Authorization: `Token ${token}`, Accept: "application/json" };
}

async function listAllRows(token, tableId) {
  const rows = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE}/api/database/rows/table/${tableId}/?user_field_names=false&size=200&page=${page}`;
    const r = await fetch(url, { headers: headers(token) });
    if (!r.ok) {
      throw new Error(`GET table ${tableId} failed ${r.status}: ${await r.text()}`);
    }
    const data = await r.json();
    rows.push(...(data.results || []));
    if (!data.next) break;
    page++;
  }
  return rows;
}

async function deleteRow(token, tableId, rowId) {
  const url = `${API_BASE}/api/database/rows/table/${tableId}/${rowId}/`;
  const r = await fetch(url, {
    method: "DELETE",
    headers: headers(token)
  });

  if (r.ok || r.status === 204) {
    return { deleted: true, alreadyDeleted: false };
  }

  const detail = await r.text();

  if (
    r.status === 404 ||
    (
      r.status === 400 &&
      /ERROR_CANNOT_DELETE_ALREADY_DELETED_ITEM|already been deleted/i.test(detail)
    )
  ) {
    return { deleted: false, alreadyDeleted: true };
  }

  throw new Error(`DELETE ${tableId}/${rowId} failed ${r.status}: ${detail}`);
}

function extractLinkIds(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (typeof item === "number") return [item];
      if (typeof item === "string" && /^\d+$/.test(item.trim())) return [Number(item)];
      if (item && typeof item === "object" && Number.isFinite(Number(item.id))) {
        return [Number(item.id)];
      }
      return [];
    });
  }

  if (typeof value === "number") return [value];
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return [Number(value)];

  if (value && typeof value === "object" && Number.isFinite(Number(value.id))) {
    return [Number(value.id)];
  }

  return [];
}

function targetSourceIdentity(events, sources, fields) {
  const anchors = new Set();
  for (const row of events) {
    const v = norm(row[fields.events.source]);
    if (v) anchors.add(v);
  }

  const ids = new Set();
  const names = new Set();

  for (const row of sources) {
    const id = norm(row[fields.sources.sourceId]);
    const name = norm(row[fields.sources.name]);

    if (
      (id && anchors.has(id)) ||
      (name && anchors.has(name))
    ) {
      if (id) ids.add(id);
      if (name) names.add(name);
    }
  }

  return { anchors, ids, names };
}

function rowMatchesIdentity(row, fields, identity) {
  const id = norm(row[fields.sourceId]);
  const name = norm(row[fields.name]);
  return (id && identity.ids.has(id)) || (name && identity.names.has(name));
}

function eventMatchesIdentity(row, fields, identity) {
  const source = norm(row[fields.source]);
  return source && (identity.ids.has(source) || identity.names.has(source));
}

async function processDeletes(token, tableId, rowIds, label) {
  let deleted = 0;
  let alreadyDeleted = 0;

  for (let i = 0; i < rowIds.length; i++) {
    const result = await deleteRow(token, tableId, rowIds[i]);
    if (result.deleted) deleted++;
    if (result.alreadyDeleted) alreadyDeleted++;

    if ((i + 1) % 50 === 0 || i + 1 === rowIds.length) {
      console.log(`${label}: ${i + 1}/${rowIds.length} behandlet (slettet=${deleted}, allerede borte=${alreadyDeleted})`);
    }
  }

  return { requested: rowIds.length, deleted, alreadyDeleted };
}

async function main() {
  if (!OLD_TOKEN) throw new Error("ARRANGEMENT_BASEROW_TOKEN mangler.");
  if (!TIME_TOKEN) throw new Error("ARRANGEMENT_BASEROW_TOKEN_TIME mangler.");
  if (!KLEPP_TOKEN) throw new Error("ARRANGEMENT_BASEROW_TOKEN_KLEPP mangler.");

  if (CONFIRM !== "DELETE-TIME-KLEPP-DEFAULT") {
    throw new Error('Sikkerhetsstopp: skriv nøyaktig "DELETE-TIME-KLEPP-DEFAULT" i confirm-feltet.');
  }

  const manifest = JSON.parse(await fs.readFile(MANIFEST_FILE, "utf8"));

  if (
    manifest.expected?.total?.events !== 1311 ||
    manifest.expected?.total?.sources !== 7 ||
    manifest.expected?.total?.rowsFreedIfDeleted !== 1318
  ) {
    throw new Error("Sikkerhetsstopp: manifestet har andre forventede summer enn godkjent V465 dry-run.");
  }

  console.log("Leser live-data før sletting...");
  const [
    oldEvents,
    oldSources,
    timeEvents,
    timeSources,
    kleppEvents,
    kleppSources
  ] = await Promise.all([
    listAllRows(OLD_TOKEN, CFG.old.tables.events),
    listAllRows(OLD_TOKEN, CFG.old.tables.sources),
    listAllRows(TIME_TOKEN, CFG.time.tables.events),
    listAllRows(TIME_TOKEN, CFG.time.tables.sources),
    listAllRows(KLEPP_TOKEN, CFG.klepp.tables.events),
    listAllRows(KLEPP_TOKEN, CFG.klepp.tables.sources)
  ]);

  if (!timeEvents.length || !kleppEvents.length) {
    throw new Error("Sikkerhetsstopp: Time eller Klepp har 0 Events. Ingen sletting.");
  }

  const timeIdentity = targetSourceIdentity(timeEvents, timeSources, CFG.time.fields);
  const kleppIdentity = targetSourceIdentity(kleppEvents, kleppSources, CFG.klepp.fields);

  if (!timeIdentity.ids.size && !timeIdentity.names.size) {
    throw new Error("Sikkerhetsstopp: finner ingen Time-kildeidentitet i nytt workspace.");
  }
  if (!kleppIdentity.ids.size && !kleppIdentity.names.size) {
    throw new Error("Sikkerhetsstopp: finner ingen Klepp-kildeidentitet i nytt workspace.");
  }

  const manifestEventIds = new Set([
    ...manifest.time.events.map(x => Number(x.rowId)),
    ...manifest.klepp.events.map(x => Number(x.rowId))
  ]);
  const manifestSourceIds = new Set([
    ...manifest.time.sources.map(x => Number(x.rowId)),
    ...manifest.klepp.sources.map(x => Number(x.rowId))
  ]);

  if (manifestEventIds.size !== 1311 || manifestSourceIds.size !== 7) {
    throw new Error("Sikkerhetsstopp: duplikate eller manglende rad-ID-er i manifestet.");
  }

  const currentOldEventById = new Map(oldEvents.map(row => [Number(row.id), row]));
  const currentOldSourceById = new Map(oldSources.map(row => [Number(row.id), row]));

  // Validate every still-existing manifest source before deleting anything.
  for (const entry of manifest.time.sources) {
    const row = currentOldSourceById.get(Number(entry.rowId));
    if (!row) continue;
    if (row[CFG.old.fields.sources.enabled] !== false) {
      throw new Error(`Sikkerhetsstopp: gammel Time Source rad ${entry.rowId} er Enabled=true.`);
    }
    if (!rowMatchesIdentity(row, CFG.old.fields.sources, timeIdentity)) {
      throw new Error(`Sikkerhetsstopp: gammel Time Source rad ${entry.rowId} matcher ikke lenger Time.`);
    }
  }

  for (const entry of manifest.klepp.sources) {
    const row = currentOldSourceById.get(Number(entry.rowId));
    if (!row) continue;
    if (row[CFG.old.fields.sources.enabled] !== false) {
      throw new Error(`Sikkerhetsstopp: gammel Klepp Source rad ${entry.rowId} er Enabled=true.`);
    }
    if (!rowMatchesIdentity(row, CFG.old.fields.sources, kleppIdentity)) {
      throw new Error(`Sikkerhetsstopp: gammel Klepp Source rad ${entry.rowId} matcher ikke lenger Klepp.`);
    }
  }

  // Validate every still-existing manifest event before deleting anything.
  for (const entry of manifest.time.events) {
    const row = currentOldEventById.get(Number(entry.rowId));
    if (!row) continue;
    if (row[CFG.old.fields.events.active] !== false) {
      throw new Error(`Sikkerhetsstopp: gammel Time Event rad ${entry.rowId} er fortsatt Active=true.`);
    }
    if (!eventMatchesIdentity(row, CFG.old.fields.events, timeIdentity)) {
      throw new Error(`Sikkerhetsstopp: gammel Time Event rad ${entry.rowId} matcher ikke lenger Time.`);
    }
  }

  for (const entry of manifest.klepp.events) {
    const row = currentOldEventById.get(Number(entry.rowId));
    if (!row) continue;
    if (row[CFG.old.fields.events.active] !== false) {
      throw new Error(`Sikkerhetsstopp: gammel Klepp Event rad ${entry.rowId} er fortsatt Active=true.`);
    }
    if (!eventMatchesIdentity(row, CFG.old.fields.events, kleppIdentity)) {
      throw new Error(`Sikkerhetsstopp: gammel Klepp Event rad ${entry.rowId} matcher ikke lenger Klepp.`);
    }
  }

  // Stop if new matching default rows have appeared outside the approved V465 manifest.
  const extraTimeEvents = oldEvents.filter(row =>
    eventMatchesIdentity(row, CFG.old.fields.events, timeIdentity) &&
    !manifestEventIds.has(Number(row.id))
  );
  const extraKleppEvents = oldEvents.filter(row =>
    eventMatchesIdentity(row, CFG.old.fields.events, kleppIdentity) &&
    !manifestEventIds.has(Number(row.id))
  );
  const extraTimeSources = oldSources.filter(row =>
    rowMatchesIdentity(row, CFG.old.fields.sources, timeIdentity) &&
    !manifestSourceIds.has(Number(row.id))
  );
  const extraKleppSources = oldSources.filter(row =>
    rowMatchesIdentity(row, CFG.old.fields.sources, kleppIdentity) &&
    !manifestSourceIds.has(Number(row.id))
  );

  if (
    extraTimeEvents.length ||
    extraKleppEvents.length ||
    extraTimeSources.length ||
    extraKleppSources.length
  ) {
    throw new Error(
      "Sikkerhetsstopp: nye Time/Klepp-rader finnes i default utenfor V465-manifestet: " +
      JSON.stringify({
        extraTimeEvents: extraTimeEvents.length,
        extraKleppEvents: extraKleppEvents.length,
        extraTimeSources: extraTimeSources.length,
        extraKleppSources: extraKleppSources.length
      })
    );
  }

  console.log(JSON.stringify({
    phase: "validated",
    approvedFromV465: {
      timeEvents: manifest.time.events.length,
      timeSources: manifest.time.sources.length,
      kleppEvents: manifest.klepp.events.length,
      kleppSources: manifest.klepp.sources.length
    },
    liveTargets: {
      timeEvents: timeEvents.length,
      kleppEvents: kleppEvents.length
    },
    note: "Ingen sletting er utført før alle sikkerhetskontroller over er bestått."
  }, null, 2));

  // Events first. Sources only after every event delete request has completed.
  const eventDelete = await processDeletes(
    OLD_TOKEN,
    CFG.old.tables.events,
    [...manifestEventIds],
    "Events"
  );

  const sourceDelete = await processDeletes(
    OLD_TOKEN,
    CFG.old.tables.sources,
    [...manifestSourceIds],
    "Sources"
  );

  // Verify physical cleanup.
  const [remainingEvents, remainingSources, settlements] = await Promise.all([
    listAllRows(OLD_TOKEN, CFG.old.tables.events),
    listAllRows(OLD_TOKEN, CFG.old.tables.sources),
    listAllRows(OLD_TOKEN, CFG.old.tables.settlements)
  ]);

  const remainingEventIds = new Set(remainingEvents.map(r => Number(r.id)));
  const remainingSourceIds = new Set(remainingSources.map(r => Number(r.id)));

  const manifestEventsStillPresent = [...manifestEventIds].filter(id => remainingEventIds.has(id));
  const manifestSourcesStillPresent = [...manifestSourceIds].filter(id => remainingSourceIds.has(id));

  if (manifestEventsStillPresent.length || manifestSourcesStillPresent.length) {
    throw new Error(
      `Verifisering feilet: ${manifestEventsStillPresent.length} Events og ` +
      `${manifestSourcesStillPresent.length} Sources fra manifestet finnes fortsatt.`
    );
  }

  const result = {
    version: "v466-time-klepp-default-delete-2026-09-13",
    ok: true,
    sourceManifest: manifest.manifestVersion,
    deletes: {
      events: eventDelete,
      sources: sourceDelete
    },
    verifiedRemainingManifestRows: {
      events: 0,
      sources: 0
    },
    rowsFreedFromDefaultTables: manifestEventIds.size + manifestSourceIds.size
  };

  await fs.writeFile(REPORT_FILE, JSON.stringify(result, null, 2) + "\n", "utf8");

  // Settlement follow-up: report only, no settlement delete in V466.
  const referencedSettlementIds = new Set();

  for (const row of remainingEvents) {
    for (const id of extractLinkIds(row[CFG.old.fields.events.settlement])) {
      referencedSettlementIds.add(id);
    }
  }

  for (const row of remainingSources) {
    for (const id of extractLinkIds(row[CFG.old.fields.sources.defaultSettlement])) {
      referencedSettlementIds.add(id);
    }
  }

  const candidates = settlements
    .filter(row => {
      const municipality = norm(row[CFG.old.fields.settlements.municipality]);
      return (
        (municipality === "time" || municipality === "klepp") &&
        !referencedSettlementIds.has(Number(row.id))
      );
    })
    .map(row => ({
      rowId: row.id,
      settlementId: clean(row[CFG.old.fields.settlements.settlementId]),
      name: clean(row[CFG.old.fields.settlements.name]),
      municipality: clean(row[CFG.old.fields.settlements.municipality]),
      active: row[CFG.old.fields.settlements.active] !== false
    }));

  const settlementReport = {
    version: "v466-settlement-follow-up-dry-run-2026-09-13",
    mode: "DRY_RUN_ONLY",
    generatedAt: new Date().toISOString(),
    defaultSettlementsTotal: settlements.length,
    referencedSettlementRowIds: referencedSettlementIds.size,
    orphanCandidatesTimeKlepp: candidates.length,
    candidates,
    writesPerformedToSettlements: 0
  };

  await fs.writeFile(
    SETTLEMENT_REPORT_FILE,
    JSON.stringify(settlementReport, null, 2) + "\n",
    "utf8"
  );

  console.log("\n=== V466 CLEANUP COMPLETE ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n=== SETTLEMENT FOLLOW-UP (READ ONLY) ===");
  console.log(JSON.stringify({
    candidates: settlementReport.orphanCandidatesTimeKlepp,
    rows: settlementReport.candidates
  }, null, 2));
  console.log("\nSettlements er IKKE slettet i V466.");
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
