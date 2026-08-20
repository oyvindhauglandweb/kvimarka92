// One-time safe cleanup of migrated Sandnes events from the old/common Baserow workspace.
// Safety rules:
// 1) Reads moved Sandnes sources from the NEW Sandnes Sources table.
// 2) Requires the matching sources in OLD Sources to be disabled.
// 3) Deletes ONLY OLD Events that belong to those moved sources AND already have Active=false.
// 4) Never touches the new Sandnes workspace.
// 5) Requires explicit CONFIRM_DELETE_SANDNES=DELETE-SANDNES.

const API_BASE = String(process.env.BASEROW_API_BASE || "https://api.baserow.io").replace(/\/$/, "");
const OLD_TOKEN = String(process.env.ARRANGEMENT_BASEROW_TOKEN || "").trim();
const SANDNES_TOKEN = String(process.env.ARRANGEMENT_BASEROW_TOKEN_SANDNES || "").trim();
const CONFIRM = String(process.env.CONFIRM_DELETE_SANDNES || "");

const OLD_EVENTS_TABLE = 1137493;
const OLD_SOURCES_TABLE = 1137506;
const SANDNES_SOURCES_TABLE = 1144922;

// Old/common workspace field IDs
const OLD = {
  events: {
    source: "field_10177399",
    active: "field_10177442",
    eventId: "field_10177330",
    title: "field_10177331",
  },
  sources: {
    sourceId: "field_10177445",
    name: "field_10177446",
    enabled: "field_10177499",
  }
};

// New Sandnes workspace Sources field IDs
const SANDNES = {
  sources: {
    sourceId: "field_10252702",
    name: "field_10252703",
    enabled: "field_10252707",
  }
};

function normalize(v) {
  return String(v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function headers(token, json=false) {
  const h = { Authorization: `Token ${token}`, Accept: "application/json" };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function listAllRows(token, tableId) {
  const rows = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE}/api/database/rows/table/${tableId}/?user_field_names=false&size=200&page=${page}`;
    const r = await fetch(url, { headers: headers(token) });
    if (!r.ok) throw new Error(`GET table ${tableId} failed ${r.status}: ${await r.text()}`);
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
  if (!(r.ok || r.status === 204)) {
    throw new Error(`DELETE ${tableId}/${rowId} failed ${r.status}: ${await r.text()}`);
  }
}

async function main() {
  if (!OLD_TOKEN) throw new Error("ARRANGEMENT_BASEROW_TOKEN mangler.");
  if (!SANDNES_TOKEN) throw new Error("ARRANGEMENT_BASEROW_TOKEN_SANDNES mangler.");
  if (CONFIRM !== "DELETE-SANDNES") {
    throw new Error('Sikkerhetsstopp: workflow-input må være nøyaktig "DELETE-SANDNES".');
  }

  const [sandnesSources, oldSources, oldEvents] = await Promise.all([
    listAllRows(SANDNES_TOKEN, SANDNES_SOURCES_TABLE),
    listAllRows(OLD_TOKEN, OLD_SOURCES_TABLE),
    listAllRows(OLD_TOKEN, OLD_EVENTS_TABLE),
  ]);

  const movedIds = new Set();
  const movedNames = new Set();

  for (const row of sandnesSources) {
    const sourceId = normalize(row[SANDNES.sources.sourceId]);
    const name = normalize(row[SANDNES.sources.name]);
    if (sourceId) movedIds.add(sourceId);
    if (name) movedNames.add(name);
  }

  if (!movedIds.size && !movedNames.size) {
    throw new Error("Ingen Sandnes-kilder funnet i nytt workspace. Ingenting slettes.");
  }

  const matchingOldSources = oldSources.filter(row => {
    const id = normalize(row[OLD.sources.sourceId]);
    const name = normalize(row[OLD.sources.name]);
    return (id && movedIds.has(id)) || (name && movedNames.has(name));
  });

  if (!matchingOldSources.length) {
    throw new Error("Fant ingen tilsvarende Sandnes-kilder i gammel Sources. Ingenting slettes.");
  }

  const stillEnabled = matchingOldSources.filter(row => row[OLD.sources.enabled] !== false);
  if (stillEnabled.length) {
    const details = stillEnabled.map(row => ({
      rowId: row.id,
      sourceId: row[OLD.sources.sourceId] || "",
      name: row[OLD.sources.name] || ""
    }));
    throw new Error(
      "Sikkerhetsstopp: minst én gammel Sandnes-kilde er fortsatt Enabled=true: " +
      JSON.stringify(details)
    );
  }

  const candidates = oldEvents.filter(row => {
    if (row[OLD.events.active] !== false) return false;
    const source = normalize(row[OLD.events.source]);
    return source && (movedIds.has(source) || movedNames.has(source));
  });

  const activeMatches = oldEvents.filter(row => {
    if (row[OLD.events.active] === false) return false;
    const source = normalize(row[OLD.events.source]);
    return source && (movedIds.has(source) || movedNames.has(source));
  });

  console.log(JSON.stringify({
    phase: "preview",
    sandnesSources: sandnesSources.length,
    matchingOldSources: matchingOldSources.length,
    oldSourcesAllDisabled: stillEnabled.length === 0,
    deleteCandidates: candidates.length,
    activeSandnesEventsBlockedFromDelete: activeMatches.length,
    sampleCandidates: candidates.slice(0, 10).map(row => ({
      rowId: row.id,
      eventId: row[OLD.events.eventId] || "",
      title: row[OLD.events.title] || "",
      source: row[OLD.events.source] || ""
    }))
  }, null, 2));

  if (activeMatches.length) {
    throw new Error(
      `Sikkerhetsstopp: ${activeMatches.length} gamle Sandnes-events er fortsatt aktive. Ingen rader slettes.`
    );
  }

  let deleted = 0;
  for (const row of candidates) {
    await deleteRow(OLD_TOKEN, OLD_EVENTS_TABLE, row.id);
    deleted++;
    if (deleted % 50 === 0 || deleted === candidates.length) {
      console.log(`Slettet ${deleted}/${candidates.length} gamle Sandnes-events`);
    }
  }

  console.log(JSON.stringify({
    ok: true,
    deleted,
    table: OLD_EVENTS_TABLE,
    newSandnesWorkspaceChanged: false
  }, null, 2));
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
