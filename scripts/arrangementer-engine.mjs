const ARRANGEMENT_ENGINE_VERSION = "v414-sandnes-correct-link-field-ids-2026-08-20";

const ARR_AREAS = {
  default: {
    name: "Felles",
    tables: {
      EVENTS: 1137493,
      SOURCES: 1137506,
      MEETING_TYPES: 1137511,
      SETTLEMENTS: 1137544,
    },
    fields: {
      events: {
        eventId: "field_10177330",
        title: "field_10177331",
        startTime: "field_10177332",
        endTime: "field_10177389",
        meetingType: "field_10177390",
        organizer: "field_10177394",
        location: "field_10177397",
        description: "field_10177398",
        source: "field_10177399",
        sourceUrl: "field_10177400",
        sourceEventId: "field_10177438",
        lastSeen: "field_10177439",
        active: "field_10177442",
        manuallyEdited: "field_10177443",
        settlement: "field_10178013",
      },
      sources: {
        sourceId: "field_10177445",
        name: "field_10177446",
        website: "field_10177447",
        calendarUrl: "field_10177474",
        sourceType: "field_10177498",
        enabled: "field_10177499",
        importMethod: "field_10177503",
        lastImport: "field_10177505",
        importStatus: "field_10177508",
        defaultSettlement: "field_10178042",
      },
      meetingTypes: {
        typeId: "field_10177509",
        name: "field_10177510",
        description: "field_10177511",
        keywords: "field_10177858",
        priority: "field_10177859",
        active: "field_10177860",
        sortOrder: "field_10177861",
      },
      settlements: {
        settlementId: "field_10177956",
        name: "field_10177957",
        municipality: "field_10177958",
        active: "field_10178007",
        sortOrder: "field_10178009",
      },
    },
  },

  sandnes: {
    name: "Sandnes",
    databaseId: 528983,
    tables: {
      EVENTS: 1144908,
      SOURCES: 1144922,
      MEETING_TYPES: 1144925,
      SETTLEMENTS: 1144926,
    },
    fields: {
      events: {
        eventId: "field_10252551",
        title: "field_10252552",
        startTime: "field_10252553",
        endTime: "field_10252554",
        meetingType: "field_10252555",
        organizer: "field_10252556",
        location: "field_10252557",
        description: "field_10252558",
        source: "field_10252559",
        sourceUrl: "field_10252560",
        sourceEventId: "field_10252561",
        lastSeen: "field_10252562",
        active: "field_10252563",
        manuallyEdited: "field_10252564",
        settlement: "field_10252776",
      },
      sources: {
        sourceId: "field_10252702",
        name: "field_10252703",
        website: "field_10252704",
        calendarUrl: "field_10252705",
        sourceType: "field_10252706",
        enabled: "field_10252707",
        importMethod: "field_10252708",
        lastImport: "field_10252709",
        importStatus: "field_10252710",
        defaultSettlement: "field_10252777",
      },
      meetingTypes: {
        typeId: "field_10252723",
        name: "field_10252724",
        description: "field_10252725",
        keywords: "field_10252726",
        priority: "field_10252727",
        active: "field_10252728",
        sortOrder: "field_10252729",
      },
      settlements: {
        settlementId: "field_10252736",
        name: "field_10252737",
        municipality: "field_10252738",
        active: "field_10252739",
        sortOrder: "field_10252740",
      },
    },
  },
};

let ARR_CURRENT_AREA = "default";
let ARR_TABLE = ARR_AREAS.default.tables;
let ARR_F = ARR_AREAS.default.fields;

function arrUseArea(areaKey = "default") {
  const key = String(areaKey || "default").trim().toLowerCase();
  const area = ARR_AREAS[key];

  if (!area) {
    throw new Error(`Ukjent Arrangementer-område: ${areaKey}`);
  }

  ARR_CURRENT_AREA = key;
  ARR_TABLE = area.tables;
  ARR_F = area.fields;
  return area;
}

function arrGetAreaConfig(areaKey = ARR_CURRENT_AREA) {
  const key = String(areaKey || "default").trim().toLowerCase();
  const area = ARR_AREAS[key];
  if (!area) throw new Error(`Ukjent Arrangementer-område: ${areaKey}`);
  return area;
}

const ARR_NORWEGIAN_MONTHS = {
  januar:1, februar:2, mars:3, april:4, mai:5, juni:6,
  juli:7, august:8, september:9, oktober:10, november:11, desember:12,
};

function arrApiBase(env) {
  // V245: tilbake til den samme API-base-logikken som V241, som var bekreftet
  // fungerende mot Arrangementskalender-tokenet. Batch-importen beholdes.
  return String(env.BASEROW_API_BASE || "https://api.baserow.io").replace(/\/$/, "");
}

function arrHeaders(env, jsonBody=false) {
  const h = {Authorization:`Token ${env.ARRANGEMENT_BASEROW_TOKEN}`, Accept:"application/json"};
  if (jsonBody) h["Content-Type"] = "application/json";
  return h;
}


function arrSafeEqual(a,b) {
  if (!a || !b || a.length !== b.length) return false;
  let x=0;
  for (let i=0;i<a.length;i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

async function arrListAllRows(env, tableId) {
  const out = [];
  let page = 1;

  while (true) {
    const url = `${arrApiBase(env)}/api/database/rows/table/${tableId}/?size=200&page=${page}`;
    const r = await fetch(url, {headers:arrHeaders(env)});
    if (!r.ok) throw new Error(`Baserow GET ${tableId} page ${page}: ${r.status} ${await r.text()}`);

    const data = await r.json();
    const rows = Array.isArray(data.results) ? data.results : [];
    out.push(...rows);

    if (!data.next || rows.length === 0) break;
    page += 1;
  }

  return out;
}

async function arrListRowsFilteredEqual(env, tableId, fieldId, value) {
  const out = [];
  const size = 200;
  let page = 1;

  while (page <= 100) {
    const u =
      `${arrApiBase(env)}/api/database/rows/table/${tableId}/` +
      `?size=${size}&page=${page}` +
      `&filter__field_${fieldId}__equal=${encodeURIComponent(String(value ?? ""))}`;

    const res = await fetch(u,{headers:arrHeaders(env)});
    if (!res.ok) {
      throw new Error(
        `Baserow filtered GET ${tableId} field ${fieldId}: ${res.status} ${await res.text()}`
      );
    }

    const data = await res.json();
    const rows = Array.isArray(data.results) ? data.results : [];
    out.push(...rows);

    if (!data.next || rows.length === 0) break;
    page++;
  }

  return out;
}

async function arrListRowsDateBefore(env, tableId, fieldId, isoDate, size=200) {
  const u =
    `${arrApiBase(env)}/api/database/rows/table/${tableId}/` +
    `?size=${Math.max(1,Math.min(200,Number(size)||200))}&page=1` +
    `&filter__field_${fieldId}__date_before=${encodeURIComponent(String(isoDate || ""))}`;

  const res = await fetch(u,{headers:arrHeaders(env)});
  if (!res.ok) {
    throw new Error(
      `Baserow date-before GET ${tableId} field ${fieldId}: ${res.status} ${await res.text()}`
    );
  }

  const data = await res.json();
  return {
    count:Number(data.count || 0),
    rows:Array.isArray(data.results) ? data.results : []
  };
}


async function arrCreateRow(env, tableId, body) {
  const r = await fetch(`${arrApiBase(env)}/api/database/rows/table/${tableId}/`, {
    method:"POST", headers:arrHeaders(env,true), body:JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Baserow POST ${tableId}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function arrUpdateRow(env, tableId, rowId, body) {
  const r = await fetch(`${arrApiBase(env)}/api/database/rows/table/${tableId}/${rowId}/`, {
    method:"PATCH", headers:arrHeaders(env,true), body:JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Baserow PATCH ${tableId}/${rowId}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function arrCreateRowsBatch(env, tableId, items, chunkSize=100) {
  const input = Array.isArray(items) ? items.filter(Boolean) : [];
  const created = [];
  for (let i=0; i<input.length; i+=chunkSize) {
    const chunk = input.slice(i, i+chunkSize);
    if (!chunk.length) continue;
    const r = await fetch(`${arrApiBase(env)}/api/database/rows/table/${tableId}/batch/?user_field_names=false`, {
      method:"POST", headers:arrHeaders(env,true), body:JSON.stringify({items:chunk}),
    });
    if (!r.ok) throw new Error(`Baserow BATCH POST ${tableId}: ${r.status} ${await r.text()}`);
    const data = await r.json();
    if (Array.isArray(data)) created.push(...data);
    else if (Array.isArray(data.items)) created.push(...data.items);
    else if (Array.isArray(data.results)) created.push(...data.results);
  }
  return created;
}

async function arrUpdateRowsBatch(env, tableId, items, chunkSize=100) {
  // V249: Baserow batch PATCH krever at hver row-id forekommer maks én gang.
  // Samme arrangement kan bli truffet flere ganger i én kildeimport (f.eks.
  // duplikate kalenderforekomster). Slå derfor sammen alle oppdateringer per id
  // før vi sender batchen. Senere feltverdier vinner.
  const mergedById = new Map();
  for (const item of (Array.isArray(items) ? items : [])) {
    if (!item) continue;
    const id = Number(item.id);
    if (!Number.isInteger(id) || id < 1) continue;
    const previous = mergedById.get(id) || {id};
    mergedById.set(id, {...previous, ...item, id});
  }

  const input = Array.from(mergedById.values());
  const updated = [];
  for (let i=0; i<input.length; i+=chunkSize) {
    const chunk = input.slice(i, i+chunkSize);
    if (!chunk.length) continue;
    const r = await fetch(`${arrApiBase(env)}/api/database/rows/table/${tableId}/batch/?user_field_names=false`, {
      method:"PATCH", headers:arrHeaders(env,true), body:JSON.stringify({items:chunk}),
    });
    if (!r.ok) throw new Error(`Baserow BATCH PATCH ${tableId}: ${r.status} ${await r.text()}`);
    const data = await r.json();
    if (Array.isArray(data)) updated.push(...data);
    else if (Array.isArray(data.items)) updated.push(...data.items);
    else if (Array.isArray(data.results)) updated.push(...data.results);
  }
  return updated;
}

async function arrDeleteRowsBatch(env, tableId, rowIds, chunkSize=200) {
  const ids = [...new Set(
    (Array.isArray(rowIds) ? rowIds : [])
      .map(id => Number(id))
      .filter(id => Number.isInteger(id) && id > 0)
  )];

  let deleted = 0;
  for (let i=0; i<ids.length; i+=chunkSize) {
    const chunk = ids.slice(i, i+chunkSize);
    if (!chunk.length) continue;

    const r = await fetch(
      `${arrApiBase(env)}/api/database/rows/table/${tableId}/batch-delete/`,
      {
        method:"POST",
        headers:arrHeaders(env,true),
        body:JSON.stringify({items:chunk}),
      }
    );

    if (!r.ok) {
      const detail = await r.text();
      throw new Error(
        `Baserow BATCH DELETE ${tableId}: ${r.status} ${detail}. ` +
        `Database-tokenet må ha Delete-tillatelse for Events-tabellen.`
      );
    }
    deleted += chunk.length;
  }
  return deleted;
}


function arrCellValue(v) {
  if (v == null) return "";
  if (typeof v === "object" && !Array.isArray(v)) return v.value ?? v.name ?? "";
  return v;
}

function arrLinkedIds(v) {
  if (!Array.isArray(v)) return [];
  return v.map(x => typeof x === "number" ? x : x?.id).filter(Number.isFinite);
}

function arrLinkedNames(v) {
  if (!Array.isArray(v)) return [];
  return v.map(x => typeof x === "string" ? x : x?.value ?? x?.name).filter(Boolean);
}

function arrSortedLinkedIds(v) {
  return [...new Set(arrLinkedIds(v).map(Number).filter(Number.isFinite))]
    .sort((a,b) => a-b);
}

function arrSameIds(a,b) {
  const aa = [...new Set((a || []).map(Number).filter(Number.isFinite))].sort((x,y)=>x-y);
  const bb = [...new Set((b || []).map(Number).filter(Number.isFinite))].sort((x,y)=>x-y);
  return aa.length === bb.length && aa.every((v,i) => v === bb[i]);
}

function arrRecordSandnesWriteVerification(result, requestItem, responseRow) {
  const diag = result?.diagnostics?.linkWriteVerification;
  if (!diag || diag.checked >= 24 || !requestItem || !responseRow) return;

  const requestedSettlementIds =
    Array.isArray(requestItem[ARR_F.events.settlement])
      ? requestItem[ARR_F.events.settlement].map(Number).filter(Number.isFinite)
      : [];

  const requestedMeetingTypeIds =
    Array.isArray(requestItem[ARR_F.events.meetingType])
      ? requestItem[ARR_F.events.meetingType].map(Number).filter(Number.isFinite)
      : [];

  const actualSettlementIds =
    arrSortedLinkedIds(responseRow[ARR_F.events.settlement]);

  const actualMeetingTypeIds =
    arrSortedLinkedIds(responseRow[ARR_F.events.meetingType]);

  const settlementMatch =
    arrSameIds(requestedSettlementIds, actualSettlementIds);

  const meetingTypeMatch =
    arrSameIds(requestedMeetingTypeIds, actualMeetingTypeIds);

  diag.checked++;
  if (settlementMatch) diag.settlementMatches++;
  else diag.settlementMismatches++;

  if (meetingTypeMatch) diag.meetingTypeMatches++;
  else diag.meetingTypeMismatches++;

  diag.samples.push({
    rowId: Number(responseRow.id || requestItem.id || 0),
    title: String(
      responseRow[ARR_F.events.title] ??
      requestItem[ARR_F.events.title] ??
      ""
    ),
    requestedSettlementIds,
    actualSettlementIds,
    requestedMeetingTypeIds,
    actualMeetingTypeIds,
    rawSettlementReturned:
      responseRow[ARR_F.events.settlement] ?? null,
    rawMeetingTypeReturned:
      responseRow[ARR_F.events.meetingType] ?? null,
    returnedKeys: Object.keys(responseRow).filter(
      key =>
        key === ARR_F.events.settlement ||
        key === ARR_F.events.meetingType ||
        /10252565|10252555|settlement|meeting/i.test(key)
    )
  });
}


async function arrPurgeOldEventPage(env) {
  const cutoffDate = new Date(Date.now() - 7 * 86400000);
  // date_before works reliably with a date value in Baserow.
  const cutoff = cutoffDate.toISOString().slice(0,10);

  const found = await arrListRowsDateBefore(
    env,
    ARR_TABLE.EVENTS,
    ARR_F.events.startTime,
    cutoff,
    200
  );

  const ids = found.rows.map(r => r.id);
  const deleted = ids.length
    ? await arrDeleteRowsBatch(env, ARR_TABLE.EVENTS, ids)
    : 0;

  return {
    cutoff,
    remainingBeforeDelete:found.count,
    matched:ids.length,
    deleted
  };
}











function arrResolveHaaFellesraadOrganizer(title, organizer) {
  const current = arrClean(organizer || "");

  if (arrNormalize(current) !== arrNormalize("Hå Kyrkjelege Fellesråd")) {
    return current;
  }

  const normalizedTitle = arrNormalize(title || "");

  // V325: Hå Kyrkjelege Fellesråd skal aldri være slutt-arrangør.
  // Eksakte Title-regler fra Baserow-oppryddingen:
  // Samleregel: alle titler som inneholder "speider" skal til Varhaug sokn.
  // Sammenligningen er case-insensitiv fordi normalizedTitle er normalisert.
  if (normalizedTitle.includes("speider")) {
    return "Varhaug sokn";
  }

  const titleRules = [
    ["Klang av jul med Valen Vokalensemble & SSO", "Nærbø sokn"],
    ["Kyrkjelydsfest", "Varhaug sokn"],
    ["Med Jesus på jobb - lokalt og globalt", "Varhaug sokn"],
    ["Pilegrimsvandring Holmane - Ogna", "Ogna sokn"],
    ["Spød&Drøs", "Varhaug sokn"],
    ["Temakveld: Synd – Verdens minst populære og mest frigjørende ide", "Ogna sokn"],
  ];

  for (const [ruleTitle, targetOrganizer] of titleRules) {
    if (normalizedTitle === arrNormalize(ruleTitle)) {
      return targetOrganizer;
    }
  }

  // Avtalt fallback: alle andre Hå Kyrkjelege Fellesråd-arrangement
  // flyttes til Varhaug sokn.
  return "Varhaug sokn";
}

async function arrImportAllSources(env, options={}) {
  const areaKey = String(options.area || "default").trim().toLowerCase();
  arrUseArea(areaKey);
  const requestedSourceIds = new Set((options.sourceIds || []).map(x => String(x || '').trim()).filter(Boolean));
  const doCleanup = options.cleanup !== false;
  const includeDisabled = options.includeDisabled === true;
  if (!env.ARRANGEMENT_BASEROW_TOKEN) throw new Error("Missing ARRANGEMENT_BASEROW_TOKEN");

  // V242: Hent grunnlagsdata én gang. Selve event-skrivingen gjøres deretter
  // med Baserow batch-endepunkter for å holde oss under Cloudflare Free-grensen
  // på eksterne subrequests per Worker-invocation.
  // V243: hent tabellene sekvensielt. Dette unngår at flere parallelle
  // Baserow-kall ved starten av importen kan gi et svar uten godkjent
  // Authorization-header i Worker-kjøringen.
  const sources = await arrListAllRows(env,ARR_TABLE.SOURCES);
  const meetingTypes = await arrListAllRows(env,ARR_TABLE.MEETING_TYPES);
  const settlements = await arrListAllRows(env,ARR_TABLE.SETTLEMENTS);

  const activeSources = sources.filter(r => {
    const sourceId = String(r[ARR_F.sources.sourceId] || '').trim();
    const requested = !requestedSourceIds.size || requestedSourceIds.has(sourceId);
    if (!requested) return false;
    if (r[ARR_F.sources.enabled] !== false) return true;
    return includeDisabled && requestedSourceIds.has(sourceId);
  });

  // V302: Ved kilde-for-kilde-import henter vi bare eksisterende Events for
  // akkurat den/de kildene. Tidligere lastet hver import HELE Events-tabellen,
  // og dette traff Worker resource limits når databasen ble stor.
  let existingEvents = [];

  if (requestedSourceIds.size) {
    for (const source of activeSources) {
      const sourceName = arrClean(source[ARR_F.sources.name] || "");
      const sourceId = arrClean(source[ARR_F.sources.sourceId] || "");


      if (sourceName) {
        existingEvents.push(
          ...await arrListRowsFilteredEqual(
            env,
            ARR_TABLE.EVENTS,
            ARR_F.events.source,
            sourceName
          )
        );
      }

      // Eldre rader kan i noen versjoner ha Source satt til SRC-xxxx.
      if (sourceId && sourceId !== sourceName) {
        existingEvents.push(
          ...await arrListRowsFilteredEqual(
            env,
            ARR_TABLE.EVENTS,
            ARR_F.events.source,
            sourceId
          )
        );
      }
    }

    const byRowId = new Map();
    for (const row of existingEvents) byRowId.set(Number(row.id),row);
    existingEvents = [...byRowId.values()];
  } else {
    existingEvents = await arrListAllRows(env,ARR_TABLE.EVENTS);
  }

  // V269: Arrangementskalenderen skal bare beholde 7 dager historikk.
  // Eldre arrangementer slettes fysisk fra Baserow før ny import slik at
  // radene faktisk frigjøres og Free-workspace holder seg under radgrensen.
  const historyCutoff = new Date(Date.now() - 7 * 86400000);
  const expiredEventIds = doCleanup
    ? existingEvents
        .filter(r => {
          const start = new Date(r[ARR_F.events.startTime]);
          return !Number.isNaN(start.getTime()) && start < historyCutoff;
        })
        .map(r => r.id)
    : [];

  const cleanupDeleted = expiredEventIds.length
    ? await arrDeleteRowsBatch(env, ARR_TABLE.EVENTS, expiredEventIds)
    : 0;

  if (cleanupDeleted) {
    const deletedSet = new Set(expiredEventIds.map(Number));
    existingEvents = existingEvents.filter(r => !deletedSet.has(Number(r.id)));
  }

  const typeRules = arrBuildTypeRules(meetingTypes);
  const settlementRules = arrBuildSettlementRules(settlements);
  const allSettlementRules = arrBuildSettlementRules(settlements, true);
  const activeSettlementIds = new Set(settlementRules.map(r => Number(r.rowId)));
  const existingBySourceEventId = new Map();
  const existingVarhaugBySemanticKey = new Map();
  for (const r of existingEvents) {
    const key = String(r[ARR_F.events.sourceEventId] || "").trim();
    if (key) existingBySourceEventId.set(key,r);

    const eventSource = arrNormalize(r[ARR_F.events.source] || "");
    if (
      eventSource === arrNormalize("Varhaug Misjonshus") ||
      eventSource === arrNormalize("SRC-0006")
    ) {
      const semanticKey = arrVarhaugSemanticKey(
        r[ARR_F.events.title],
        r[ARR_F.events.startTime]
      );
      if (semanticKey && !existingVarhaugBySemanticKey.has(semanticKey)) {
        existingVarhaugBySemanticKey.set(semanticKey,r);
      }
    }
  }

  const result = {
    ok:true,
    area:areaKey,
    areaName:arrGetAreaConfig(areaKey).name,
    startedAt:new Date().toISOString(),
    sources:[],
    created:0,
    updated:0,
    errors:0,
    requestedSourceIds:[...requestedSourceIds],
    includeDisabled,
    diagnostics: areaKey === "sandnes" ? {
      tables: {
        events: ARR_TABLE.EVENTS,
        sources: ARR_TABLE.SOURCES,
        meetingTypes: ARR_TABLE.MEETING_TYPES,
        settlements: ARR_TABLE.SETTLEMENTS
      },
      rowsRead: {
        sources: sources.length,
        activeSources: activeSources.length,
        meetingTypes: meetingTypes.length,
        settlements: settlements.length,
        activeSettlements: settlementRules.length
      },
      linkWriteVerification: {
        checked: 0,
        settlementMatches: 0,
        settlementMismatches: 0,
        meetingTypeMatches: 0,
        meetingTypeMismatches: 0,
        samples: []
      },
      settlementRows: settlementRules.slice(0, 50).map(rule => ({
        rowId: rule.rowId,
        name: rule.name,
        municipality: rule.municipalityNormalized,
        sortOrder: rule.sortOrder
      })),
      sources: []
    } : null,
    cleanup:{
      enabled:doCleanup,
      keepHistoryDays:7,
      cutoff:historyCutoff.toISOString(),
      deleted:cleanupDeleted,
    }
  };

  for (const source of activeSources) {
    const sourceResult = {sourceId:source[ARR_F.sources.sourceId], name:source[ARR_F.sources.name], created:0, updated:0, skipped:0, error:null};
    const now = new Date().toISOString();

    const sourceDiagnostic = areaKey === "sandnes" ? {
      sourceId: arrClean(source[ARR_F.sources.sourceId] || ""),
      name: arrClean(source[ARR_F.sources.name] || ""),
      rawDefaultSettlement: source[ARR_F.sources.defaultSettlement] ?? null,
      extractedDefaultSettlementIds: arrLinkedIds(
        source[ARR_F.sources.defaultSettlement]
      ).map(Number).filter(Number.isFinite),
      sampleEvents: []
    } : null;

    if (sourceDiagnostic && result.diagnostics) {
      result.diagnostics.sources.push(sourceDiagnostic);
    }

    try {
      const parsedRaw = await arrLoadSourceEvents(source);
      const mergeOnly = parsedRaw && parsedRaw._mergeOnly === true;

      // V313: Felles tidsfilter så tidlig som mulig etter at en kilde har
      // levert sine rå/normaliserte events, før klassifisering og Baserow-arbeid.
      // Kildespesifikke parsere skal fortsatt filtrere enda tidligere der det
      // er mulig; dette er siste felles sikkerhetsnett.
      const parsed = arrFilterParsedEventWindow(parsedRaw);

      const seenKeys = new Set();
      const createItems = [];
      const createKeys = [];
      const updateItems = [];

      // V260: Fredheim Arena gikk først via en upresis HTML-parser og senere via
      // korrekt Google Calendar/iCal. De to metodene lager ulike Source Event ID-er,
      // så gamle feilaktige rader kan bli hengende igjen som aktive.
      //
      // For SRC-0009 gjør vi derfor en kontrollert "reset" ved hver vellykket import:
      // alle tidligere Fredheim-rader markeres inaktive først. De arrangementene som
      // faktisk finnes i den nåværende iCal-feeden oppdateres lenger nede i samme
      // batch og får Active=true igjen. Dette krever ikke delete-rettighet i Baserow.
      if (String(source[ARR_F.sources.sourceId] || "") === "SRC-0009") {
        const sourceNameText = arrClean(source[ARR_F.sources.name] || "");
        const sourceIdText = arrClean(source[ARR_F.sources.sourceId] || "");
        for (const r of existingEvents) {
          if (r[ARR_F.events.manuallyEdited] === true) continue;
          const eventSourceText = arrClean(r[ARR_F.events.source] || "");
          if (eventSourceText !== sourceNameText && eventSourceText !== sourceIdText) continue;
          updateItems.push({id:r.id,[ARR_F.events.active]:false});
        }
      }

      for (const item of parsed) {
        if (!item.title || !item.startTime) {
          sourceResult.skipped++;
          continue;
        }

        const sourceEventId = item.sourceEventId || await arrStableKey(source[ARR_F.sources.sourceId], item.startTime, item.title);
        seenKeys.add(sourceEventId);

        const typeIds = arrClassifyMeetingTypes(item, typeRules);
        const settlementIds = arrResolveSettlementIds(
          item,
          source,
          settlementRules,
          allSettlementRules,
          activeSettlementIds
        );

        if (
          sourceDiagnostic &&
          sourceDiagnostic.sampleEvents.length < 12
        ) {
          const resolvedRules = Array.isArray(settlementIds)
            ? settlementIds.map(id => {
                const rule = allSettlementRules.find(
                  candidate => Number(candidate.rowId) === Number(id)
                );
                return {
                  rowId: Number(id),
                  name: rule?.name || "",
                  municipality: rule?.municipalityNormalized || ""
                };
              })
            : null;

          sourceDiagnostic.sampleEvents.push({
            title: arrClean(item.title || ""),
            location: arrClean(item.location || ""),
            settlementHint: arrClean(item.settlementHint || ""),
            municipalityHint: arrClean(item.municipalityHint || ""),
            meetingTypeHint: arrClean(item.meetingTypeHint || ""),
            resolvedSettlementIds: settlementIds,
            resolvedSettlements: resolvedRules,
            classifiedMeetingTypeIds: typeIds
          });
        }

        // Settlement.Active = false fungerer som geografisk av/på-bryter.
        if (settlementIds === null) {
          sourceResult.skipped++;
          continue;
        }

        const payload = {
          [ARR_F.events.title]: arrClean(item.title),
          [ARR_F.events.startTime]: arrIsoOrNull(item.startTime),
          [ARR_F.events.endTime]: arrIsoOrNull(item.endTime),
          [ARR_F.events.meetingType]: typeIds,
          [ARR_F.events.organizer]: arrResolveHaaFellesraadOrganizer(
            item.title,
            item.organizer || source[ARR_F.sources.name]
          ),
          [ARR_F.events.location]: arrClean(item.location || source[ARR_F.sources.name]),
          [ARR_F.events.description]: arrClean(item.description || ""),
          [ARR_F.events.source]: arrClean(source[ARR_F.sources.name] || source[ARR_F.sources.sourceId] || ""),
          [ARR_F.events.sourceUrl]: arrClean(item.sourceUrl || source[ARR_F.sources.calendarUrl] || source[ARR_F.sources.website] || ""),
          [ARR_F.events.sourceEventId]: sourceEventId,
          [ARR_F.events.lastSeen]: now,
          [ARR_F.events.active]: true,
          [ARR_F.events.settlement]: settlementIds.slice(0,1),
        };

        let existing = existingBySourceEventId.get(sourceEventId);

        // V334: Varhaug har samme møte både i årsplanen og på forsiden.
        // De to visningene kan ha ulik tegnsetting, ekstra datotekst og historisk
        // feil tegnkoding. Match derfor eksisterende rad også på en stabil,
        // Varhaug-spesifikk semantisk nøkkel. Dette hindrer nye dubletter når
        // Source Event ID endres etter at teksten blir reparert.
        if (!existing && arrIsVarhaugSource(source)) {
          const semanticKey = arrVarhaugSemanticKey(item.title,item.startTime);
          const semanticExisting = semanticKey ? existingVarhaugBySemanticKey.get(semanticKey) : null;
          if (semanticExisting) {
            existing = semanticExisting;
            const oldKey = String(semanticExisting[ARR_F.events.sourceEventId] || "").trim();
            if (oldKey) seenKeys.add(oldKey);
          }
        }

        if (existing) {
          if (existing[ARR_F.events.manuallyEdited] === true) {
            updateItems.push({
              id:existing.id,
              [ARR_F.events.lastSeen]:now,
              [ARR_F.events.active]:true,
            });
          } else {
            updateItems.push({id:existing.id, ...payload});
          }
        } else {
          payload[ARR_F.events.eventId] = `EVT-${(await arrSha256(sourceEventId)).slice(0,12).toUpperCase()}`;
          createItems.push(payload);
          createKeys.push(sourceEventId);

          if (arrIsVarhaugSource(source)) {
            const semanticKey = arrVarhaugSemanticKey(item.title,item.startTime);
            if (semanticKey) existingVarhaugBySemanticKey.set(semanticKey,payload);
          }
        }
      }

      // V314 sikkerhetsnett:
      // En parser-/kildeendring skal aldri kunne "tømme" en Source ved et uhell.
      // Hvis den nye importen plutselig finner dramatisk færre fremtidige Events
      // enn vi allerede har aktive for samme Source, avbryt Source-importen før
      // noen eksisterende rader deaktiveres.
      const sourceNameTextForGuard = arrClean(source[ARR_F.sources.name] || "");
      const sourceIdTextForGuard = arrClean(source[ARR_F.sources.sourceId] || "");
      const existingActiveFuture = existingEvents.filter(r => {
        if (r[ARR_F.events.active] === false) return false;
        const eventSourceText = arrClean(r[ARR_F.events.source] || "");
        if (eventSourceText !== sourceNameTextForGuard && eventSourceText !== sourceIdTextForGuard) return false;
        const d = new Date(r[ARR_F.events.startTime]);
        return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now() - 86400000;
      }).length;

      if (
        !mergeOnly &&
        existingActiveFuture >= 10 &&
        parsed.length < Math.max(3, Math.floor(existingActiveFuture * 0.35))
      ) {
        throw new Error(
          `Kildevern: ${sourceNameTextForGuard || sourceIdTextForGuard} ga bare ` +
          `${parsed.length} arrangementer mot ${existingActiveFuture} aktive fra før. ` +
          `Eksisterende data beholdes.`
        );
      }

      // Deaktiver arrangementer som har forsvunnet fra en vellykket kilde.
      // Også dette batches sammen med øvrige oppdateringer.
      if (parsed.length && !mergeOnly) {
        const sourceNameText = arrClean(source[ARR_F.sources.name] || "");
        const sourceIdText = arrClean(source[ARR_F.sources.sourceId] || "");
        const cutoff = new Date(Date.now()-86400000);

        for (const r of existingEvents) {
          if (r[ARR_F.events.manuallyEdited] === true) continue;
          const eventSourceText = arrClean(r[ARR_F.events.source] || "");
          if (eventSourceText !== sourceNameText && eventSourceText !== sourceIdText) continue;
          const key = String(r[ARR_F.events.sourceEventId] || "");
          const start = new Date(r[ARR_F.events.startTime]);
          if (key && !seenKeys.has(key) && !Number.isNaN(start.getTime()) && start >= cutoff) {
            updateItems.push({id:r.id,[ARR_F.events.active]:false});
          }
        }
      }

      const createdRows = await arrCreateRowsBatch(env, ARR_TABLE.EVENTS, createItems);
      for (let i=0; i<createdRows.length; i++) {
        const key = createKeys[i];
        if (key) existingBySourceEventId.set(key, createdRows[i]);

        if (areaKey === "sandnes") {
          arrRecordSandnesWriteVerification(
            result,
            createItems[i],
            createdRows[i]
          );
        }
      }

      if (updateItems.length) {
        const updatedRows = await arrUpdateRowsBatch(
          env,
          ARR_TABLE.EVENTS,
          updateItems
        );

        if (areaKey === "sandnes") {
          const requestById = new Map(
            updateItems.map(item => [Number(item.id), item])
          );

          for (const row of updatedRows) {
            arrRecordSandnesWriteVerification(
              result,
              requestById.get(Number(row.id)),
              row
            );
          }
        }
      }

      sourceResult.created = createItems.length;
      sourceResult.updated = updateItems.filter(item => Object.keys(item).length > 2 || item[ARR_F.events.lastSeen]).length;
      result.created += createItems.length;
      result.updated += sourceResult.updated;

      await arrUpdateRow(env,ARR_TABLE.SOURCES,source.id,{
        [ARR_F.sources.lastImport]:now,
        [ARR_F.sources.importStatus]:`OK – ${parsed.length} lest, ${sourceResult.created} nye, ${sourceResult.updated} oppdatert`,
      });
    } catch (err) {
      sourceResult.error = String(err?.message || err);
      const pending = sourceResult.error.startsWith("VENTER –");
      if (!pending) result.errors++;
      try {
        await arrUpdateRow(env,ARR_TABLE.SOURCES,source.id,{
          [ARR_F.sources.lastImport]:new Date().toISOString(),
          [ARR_F.sources.importStatus]:(pending ? sourceResult.error : `FEIL – ${sourceResult.error}`).slice(0,1000),
        });
      } catch (_) {}
    }

    result.sources.push(sourceResult);
  }

  result.finishedAt = new Date().toISOString();
  result.ok = result.errors === 0;
  return result;
}

function arrBuildTypeRules(rows) {
  return rows.filter(r => r[ARR_F.meetingTypes.active] !== false).map(r => ({
    rowId:r.id,
    name:String(r[ARR_F.meetingTypes.name] || ""),
    priority:Number(r[ARR_F.meetingTypes.priority] || 0),
    keywords:String(r[ARR_F.meetingTypes.keywords] || "").split(/[;,\n]/).map(x => arrNormalize(x)).filter(Boolean),
  })).sort((a,b) => b.priority-a.priority);
}

function arrClassifyMeetingTypes(item, rules) {
  const text = arrNormalize([item.title,item.description,item.location].filter(Boolean).join(" "));
  const ids = [];
  for (const rule of rules) {
    if (rule.keywords.some(k => text.includes(k))) ids.push(rule.rowId);
  }

  if (!ids.length) {
    const fallback = rules.find(rule => arrNormalize(rule.name) === "annet");
    if (fallback) ids.push(fallback.rowId);
  }

  return [...new Set(ids)];
}

function arrNormalizeMunicipalityName(value) {
  // Structured sources may return values such as "Sandnes kommune",
  // while Settlements.Municipality contains "Sandnes".
  // Normalize only the administrative suffix; do not broaden geography.
  return arrNormalize(value || "")
    .replace(/\s+kommune$/i, "")
    .trim();
}

function arrBuildSettlementRules(rows, includeInactive=false) {
  return rows
    .filter(r => includeInactive || r[ARR_F.settlements.active] !== false)
    .map(r => ({
      rowId:r.id,
      name:String(r[ARR_F.settlements.name] || ""),
      normalized:arrNormalize(r[ARR_F.settlements.name] || ""),
      municipality:String(r[ARR_F.settlements.municipality] || ""),
      municipalityNormalized:arrNormalizeMunicipalityName(r[ARR_F.settlements.municipality] || ""),
      sortOrder:Number(r[ARR_F.settlements.sortOrder] || 0),
      active:r[ARR_F.settlements.active] !== false,
    }))
    .filter(r => r.normalized)
    .sort((a,b) => b.normalized.length-a.normalized.length || a.sortOrder-b.sortOrder);
}

function arrResolveSettlementIds(item, source, settlementRules, allSettlementRules=settlementRules, activeSettlementIds=null) {
  // V288: Strukturerte kilder kan gi korrekt kommune direkte.
  // Den skal være en hard avgrensning slik at f.eks. Ganddal sokn (Sandnes)
  // aldri kan havne under Hå selv om arrangementet er medarrangert av en Hå-enhet.
  const municipalityHint = arrNormalizeMunicipalityName(item.municipalityHint || "");

  const allRulesForMunicipality = municipalityHint
    ? allSettlementRules.filter(rule => rule.municipalityNormalized === municipalityHint)
    : allSettlementRules;

  // V323: Finn først om kilden eksplisitt peker på et deaktivert tettsted.
  // Dette må skje FØR fallback til et annet aktivt tettsted i samme kommune,
  // ellers kunne f.eks. et deaktivert Nærbø-arrangement feilaktig havne på Varhaug.
  const findExplicitRule = (value, rules=allRulesForMunicipality) => {
    const text = arrNormalize(value || "");
    if (!text) return null;

    const candidates = [];
    for (const rule of rules) {
      const needle = rule.normalized;
      if (!needle) continue;
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-z0-9æøå])${escaped}($|[^a-z0-9æøå])`, "i");
      const m = re.exec(text);
      if (m) {
        const start = m.index + (m[1] ? m[1].length : 0);
        candidates.push({rule,start});
      }
    }

    if (!candidates.length) return null;
    candidates.sort((a,b) =>
      a.start-b.start ||
      b.rule.normalized.length-a.rule.normalized.length ||
      a.rule.sortOrder-b.rule.sortOrder
    );
    return candidates[0].rule;
  };

  const explicit =
    findExplicitRule(item.settlementHint) ||
    findExplicitRule(item.location) ||
    findExplicitRule(item.title);

  if (explicit && explicit.active === false) {
    return null; // null = arrangementet ligger i et deaktivert geografisk område.
  }

  const rulesForMunicipality = municipalityHint
    ? settlementRules.filter(rule => rule.municipalityNormalized === municipalityHint)
    : settlementRules;

  const findBest = (value, rules=rulesForMunicipality) => {
    const text = arrNormalize(value || "");
    if (!text) return null;

    const candidates = [];
    for (const rule of rules) {
      const needle = rule.normalized;
      if (!needle) continue;

      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-z0-9æøå])${escaped}($|[^a-z0-9æøå])`, "i");
      const m = re.exec(text);
      if (m) {
        const start = m.index + (m[1] ? m[1].length : 0);
        candidates.push({rule, start});
      }
    }

    if (!candidates.length) return null;
    candidates.sort((a,b) =>
      a.start-b.start ||
      b.rule.normalized.length-a.rule.normalized.length ||
      a.rule.sortOrder-b.rule.sortOrder
    );
    return candidates[0].rule;
  };

  // 1) Strukturert tettsted fra kilden.
  let matched = findBest(item.settlementHint);
  if (matched) return [matched.rowId];

  // 2) Eksplisitt Location, men bare innen riktig kommune når den er kjent.
  matched = findBest(item.location);
  if (matched) return [matched.rowId];

  // 3) Tittel, samme kommunebegrensning.
  matched = findBest(item.title);
  if (matched) return [matched.rowId];

  // 4) Default Settlement kan brukes også når kommunen er kjent,
  // men da bare hvis default-raden faktisk ligger i samme kommune.
  // Dette gjør nye workspaces selvstendige uten å risikere krysskommune-match.
  const defaultIds = arrLinkedIds(source[ARR_F.sources.defaultSettlement])
    .map(Number)
    .filter(Number.isFinite);

  if (defaultIds.length) {
    const allowedDefaultIds = municipalityHint
      ? defaultIds.filter(id =>
          rulesForMunicipality.some(rule => Number(rule.rowId) === id)
        )
      : defaultIds;

    if (allowedDefaultIds.length) {
      const defaultId = Number(allowedDefaultIds[0]);
      if (activeSettlementIds && !activeSettlementIds.has(defaultId)) {
        return null;
      }
      return [defaultId];
    }
  }

  // 5) Hvis kommunen er kjent og vi fortsatt ikke har en konkret match,
  // bruk første aktive settlement i den kommunen som siste strukturerte fallback.
  if (municipalityHint && rulesForMunicipality.length) {
    const municipalityMatch = [...rulesForMunicipality]
      .sort((a,b) => a.sortOrder-b.sortOrder || a.name.localeCompare(b.name))[0];
    if (municipalityMatch) return [municipalityMatch.rowId];
  }

  // 6) Beskrivelse er siste fritekstreserve.
  matched = findBest(item.description);
  if (matched) return [matched.rowId];

  return [];
}


function arrFilterParsedEventWindow(items, nowMs=Date.now()) {
  const fromMs = nowMs - 7 * 86400000;
  const toMs = nowMs + 400 * 86400000;

  return (Array.isArray(items) ? items : []).filter(item => {
    if (!item?.startTime) return false;
    const ts = new Date(item.startTime).getTime();
    return Number.isFinite(ts) && ts >= fromMs && ts <= toMs;
  });
}

async function arrLoadSourceEvents(source) {
  const method = arrNormalize(arrCellValue(source[ARR_F.sources.importMethod]));
  const url = String(source[ARR_F.sources.calendarUrl] || source[ARR_F.sources.website] || "").trim();
  if (!url) throw new Error("Calendar URL mangler");

  // Known sources take precedence over the free-text Import Method field.
  const sourceId = String(source[ARR_F.sources.sourceId] || "").trim();
  const sourceName = arrClean(source[ARR_F.sources.name] || "");

  // V328: Vigrestad Misjonshus er delt opp i separate Sources, én per offentlig
  // Google Calendar/romkalender. Dette gjør at hver kalender kan aktiveres eller
  // deaktiveres uavhengig i Sources-tabellen. Ingen tittel-/nøkkelordfiltrering
  // gjøres her; Enabled på Source er selve av/på-bryteren.
  //
  // Calendar URL for disse radene skal være den direkte Google Calendar ICS-URL-en.
  // Vi normaliserer arrangør og sted slik at Source-navnet (f.eks. «Hovedsal»)
  // ikke blir vist som en egen arrangør i portalen. Source Event ID prefikses med
  // Source ID slik at identiske Google UID-er i to romkalendere ikke kolliderer.
  // V330: Alle separate Vigrestad-romkilder SRC-0016..SRC-0026 behandles likt.
  // Vi bruker Source ID som autoritativ avgrensning slik at navnevarianter som
  // «Festsal og salong» ikke faller ut av spesialimporten. SRC-0027 Årsplaner
  // er bevisst ikke med her (Google Drive/PDF og står deaktivert).
  const vigrestadSplitSource = /^SRC-(?:001[6-9]|002[0-6])$/i.test(sourceId);
  if (vigrestadSplitSource) {
    return arrFetchAndParseVigrestadSource(source, url);
  }

  // V299: Hå har en komplett Agrando-kalender på haa.kyrkja.no.
  // Den inneholder langt flere lokale aktiviteter enn Skjer i kirken.
  // SRC-0003 bruker derfor Hå sin egen kalender; Time/Sandnes fortsetter
  // foreløpig via Skjer i kirken.
  if (sourceId === "SRC-0003") {
    return arrFetchAndParseHaaAgrando("https://haa.kyrkja.no/Kalender");
  }

  // Den norske kirke / Skjer i kirken for Time, Sandnes og generiske kilder.
  if (
    sourceId === "SRC-0012" ||
    sourceId === "SRC-0013" ||
    /skjerikirken\.no\/menighet\//i.test(url)
  ) {
    const slug =
      sourceId === "SRC-0012" ? "time-kyrkjelege-fellesrad" :
      sourceId === "SRC-0013" ? "sandnes-kirkelige-fellesrad" :
      (url.match(/\/menighet\/([^/?#]+)/i)?.[1] || "");

    if (!slug) throw new Error("Skjer i kirken: mangler menighet/fellesråd-slug");
    return arrFetchAndParseKirkenActivities(slug);
  }

  if (/haa\.kyrkja\.no/i.test(url)) {
    return arrFetchAndParseHaaAgrando(url);
  }
  if (/pinsebetel\.no/i.test(url)) return arrFetchAndParseBetel(url);
  if (/narbobedehus\.no/i.test(url)) return arrFetchAndParseNarbo(url);
  if (/ognamisjonsforsamling\.no/i.test(url)) {
    // V241: Ogna publiserer en fast offentlig Google Calendar iCal-feed.
    // Bruk feeden direkte i stedet for å trekke URL-en ut av HTML hver gang.
    return arrFetchAndParseIcal("https://calendar.google.com/calendar/ical/ognamisjonsforsamling%40gmail.com/public/basic.ics");
  }
  if (/varhaug-misjonshus\.no/i.test(url)) {
    const website = String(source[ARR_F.sources.website] || url).trim();
    return arrFetchAndParseVarhaug(website);
  }
  if (/obsbedehus\.no/i.test(url)) {
    return arrFetchAndParseObsBedehus(url);
  }
  if (/bedehuskirken\.no/i.test(url)) {
    return arrFetchAndParseBedehuskirken(url);
  }
  if (/kleppebedehus\.no/i.test(url)) {
    // V313: Ikke bruk den enorme Google ICS-feeden (~1800 historiske VEVENT).
    // Kleppe Bedehus viser kalenderen via WordPress Simple Calendar, så vi
    // bruker pluginens ferdig avgrensede HTML/AJAX-visning direkte.
    return arrFetchAndParseKleppeBedehus(
      "https://kleppebedehus.no/calendar/kalender/"
    );
  }
  if (/klepp\.frikyrkja\.no/i.test(url)) {
    return arrFetchAndParseKleppFrikirke(url);
  }
  if (/brynefrikyrkje\.no/i.test(url)) {
    return arrFetchAndParseBryneFrikirke(url);
  }
  if (/fredheimarena\.no/i.test(url)) {
    // V258: Fredheim Arena bruker en offentlig Google Calendar.
    // Hent den faktiske iCal-feeden direkte i stedet for å parse synlig HTML.
    // Dette gir korrekte datoer/titler og alle publiserte kommende arrangementer,
    // inkludert gjentakende hendelser som ekspanderes av den eksisterende iCal-parseren.
    return arrFetchAndParseIcal(
      "https://calendar.google.com/calendar/ical/fredheimarena.no_05imi8f3cfd98u7i9059oc7lq0%40group.calendar.google.com/public/basic.ics"
    );
  }
  if (/vigrestadmisjonshus\.org/i.test(url)) {
    return arrFetchAndParseVigrestad();
  }
  if (/ebeneser\.no/i.test(url)) {
    return arrFetchAndParseEbeneser();
  }

  // Accept the human-readable values used in the Sources table.
  if (["ical","ics","i cal","i-calendar","ics/ical","ical/ics"].includes(method)) {
    return arrFetchAndParseIcalFromPage(url);
  }

  if (["html parser","html","web page","webpage"].includes(method)) {
    throw new Error(`VENTER – HTML-parser er ikke definert for denne kilden ennå: ${url}`);
  }

  if (["api/feed to be determined","api/feed","dynamic"].includes(method)) {
    throw new Error(`VENTER – API/feed-parser er ikke definert for denne kilden ennå: ${url}`);
  }

  if (!method) {
    if (/calendar\.google\.com\/calendar\/ical\//i.test(url) || /\.ics(?:\?|$)/i.test(url)) {
      return arrFetchAndParseIcalFromPage(url);
    }
  }

  throw new Error(`Import Method støttes ikke ennå: ${arrCellValue(source[ARR_F.sources.importMethod]) || "(tom)"}`);
}


async function arrKirkenGraphql(query) {
  const endpoint = "https://skjeri-api.kirken.no/api/graphql";
  const r = await fetch(endpoint,{
    method:"POST",
    headers:{
      "User-Agent":"Kvimarka92-Arrangementskalender/1.0",
      "Accept":"application/json",
      "Content-Type":"application/json",
      "Origin":"https://skjerikirken.no",
      "Referer":"https://skjerikirken.no/"
    },
    body:JSON.stringify({query})
  });

  const raw = await r.text();
  let data = null;
  try { data = JSON.parse(raw); } catch (_) {}

  if (!r.ok) {
    throw new Error(`Skjer i kirken GraphQL HTTP ${r.status}: ${raw.slice(0,800)}`);
  }
  if (data?.errors?.length) {
    throw new Error(`Skjer i kirken GraphQL: ${data.errors.map(e=>e.message).join(" | ")}`);
  }
  return data?.data || {};
}

function arrKirkenGqlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function arrKirkenLocation(church) {
  const c = church || {};
  const parts = [];

  const name = arrClean(c.locationName || "");
  if (name) parts.push(name);

  const street = arrClean(c.street || "")
    .replace(/\bundefined\b/gi,"")
    .replace(/\s+/g," ")
    .trim();
  if (street && !/^undefined\b/i.test(street)) parts.push(street);

  const postal = [arrClean(c.postalCode || ""), arrClean(c.postalArea || "")]
    .filter(Boolean).join(" ");
  if (postal) parts.push(postal);

  return parts.join(", ");
}


function arrKirkenOrganizerName(item, church) {
  const congregation = arrClean(church?.congregationName || "");
  const coOrganizers = Array.isArray(item?.coOrganizers) ? item.coOrganizers : [];

  // Hvis API-et faktisk oppgir et lokalt sokn, bruk det.
  if (congregation && !/fellesr[aå]d/i.test(congregation)) {
    return congregation;
  }

  // Enkelte aktiviteter kommer fra fellesrådet som hovedarrangør, men har
  // lokalt sokn som medarrangør. Bruk soknet i så fall.
  const localCoOrganizer = coOrganizers
    .map(x => arrClean(x?.name || ""))
    .find(name => name && /\bsokn\b/i.test(name));

  if (localCoOrganizer) {
    return localCoOrganizer;
  }

  // Skjer i kirken returnerer flere lokale arrangementer med f.eks.
  // "Hå Kyrkjelege Fellesråd" som congregationName og ingen medarrangør.
  // Da må arrangøren utledes av selve kirkestedet:
  // "Nærbø kyrkje" -> "Nærbø sokn", "Bryne kyrkje" -> "Bryne sokn" osv.
  const locationName = arrClean(church?.locationName || "");
  const placeMatch = locationName.match(
    /^(.+?)\s+(?:kyrkje|kirke)(?:\s.*)?$/i
  );

  if (placeMatch && placeMatch[1]) {
    const base = arrClean(placeMatch[1])
      .replace(/\s+(?:gamle|nye)$/i, "")
      .trim();

    if (base) {
      return `${base} sokn`;
    }
  }

  // PostalArea er en trygg siste lokal fallback når arrangementet er knyttet
  // til et fellesråd og kirkestedet ikke har et vanlig "... kyrkje/kirke"-navn.
  const postalArea = arrClean(church?.postalArea || "");
  if (postalArea && congregation && /fellesr[aå]d/i.test(congregation)) {
    return `${postalArea} sokn`;
  }

  return (
    congregation ||
    arrClean(coOrganizers?.[0]?.name || "") ||
    "Den norske kirke"
  );
}

async function arrFetchAndParseKirkenActivities(slug) {
  const pageUrl = `https://skjerikirken.no/menighet/${encodeURIComponent(slug)}`;
  const html = await arrFetchText(pageUrl);

  const nextDataMatch = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!nextDataMatch) {
    throw new Error(`Skjer i kirken: fant ikke __NEXT_DATA__ for ${slug}`);
  }

  let nextData;
  try {
    nextData = JSON.parse(nextDataMatch[1]);
  } catch (_) {
    throw new Error(`Skjer i kirken: ugyldig __NEXT_DATA__ for ${slug}`);
  }

  const props = nextData?.props?.pageProps || {};
  const orgNumbers = Array.isArray(props.orgNumbers)
    ? props.orgNumbers.map(Number).filter(Number.isFinite)
    : [];

  // V289: orgNumbers kan også returnere aktiviteter der en enhet fra dette
  // fellesrådet bare er medarrangør. De skal ikke importeres under feil kommune.
  // Kilden er kommune-/fellesrådsspesifikk, så church.municipality må samsvare.
  const expectedMunicipality =
    slug === "ha-kyrkjelege-fellesrad" ? "Hå" :
    slug === "time-kyrkjelege-fellesrad" ? "Time" :
    slug === "sandnes-kirkelige-fellesrad" ? "Sandnes" :
    arrClean(props.municipalityName || "");

  if (!orgNumbers.length) {
    throw new Error(`Skjer i kirken: fant ingen orgNumbers for ${slug}`);
  }

  const startDate = new Date(Date.now() - 7 * 86400000);
  const endDate = new Date(Date.now() + 400 * 86400000);
  const start = startDate.toISOString().slice(0,10);
  const end = endDate.toISOString().slice(0,10);
  const orgs = orgNumbers.join(",");

  const all = [];
  const limit = 100;
  let offset = 0;
  let total = null;

  for (let page=0; page<30; page++) {
    const query = `
      query {
        activities(
          filter:{
            orgNumbers:[${orgs}],
            startTime:${arrKirkenGqlString(start)},
            lessThanStartTime:${arrKirkenGqlString(end)}
          },
          paging:{
            limit:${limit},
            offset:${offset},
            sortByDate:true,
            sortDescending:false
          }
        ){
          limit
          offset
          hasMore
          total
          items{
            id
            sourceId
            seriesId
            title
            description
            slug
            startTime
            endTime
            eventUrl
            homePageUrl
            registrationUrl
            source
            status
            church{
              locationName
              congregationName
              municipality
              county
              street
              postalCode
              postalArea
              contactName
              buildingId
              locationType
            }
            coOrganizers{
              name
              orgNr
              municipalityName
              slug
            }
          }
        }
      }
    `;

    const data = await arrKirkenGraphql(query);
    const result = data?.activities;
    if (!result || !Array.isArray(result.items)) {
      throw new Error(`Skjer i kirken: activities mangler for ${slug}`);
    }

    total = Number(result.total ?? total ?? 0);
    all.push(...result.items);

    if (!result.hasMore || !result.items.length) break;
    offset += result.items.length;
    if (total && offset >= total) break;
  }

  const parsed = [];

  for (const item of all) {
    if (!item?.id || !item?.title || !item?.startTime) continue;
    if (item.status !== null && item.status !== undefined && Number(item.status) !== 1) continue;

    const church = item.church || {};

    // Hard kildefilter: Hå-kilden skal bare gi Hå-arrangementer, Time bare
    // Time og Sandnes bare Sandnes. Dette fjerner f.eks. Ganddal sokn fra Hå.
    const churchMunicipality = arrClean(church.municipality || "");
    if (
      expectedMunicipality &&
      churchMunicipality &&
      arrNormalize(churchMunicipality) !== arrNormalize(expectedMunicipality)
    ) {
      continue;
    }

    const location = arrKirkenLocation(church) || arrClean(church.locationName || "");
    const organizer = arrKirkenOrganizerName(item, church);

    const sourceUrl =
      arrClean(item.eventUrl || "") ||
      (item.slug ? `https://skjerikirken.no/arrangement/${encodeURIComponent(item.slug)}` : pageUrl);

    parsed.push({
      sourceEventId:`kirken-${item.id}`,
      title:arrClean(item.title),
      startTime:arrIsoOrNull(item.startTime),
      endTime:arrIsoOrNull(item.endTime),
      organizer,
      location,
      description:arrClean(item.description || ""),
      sourceUrl,
      settlementHint:arrClean(church.postalArea || ""),
      municipalityHint:arrClean(church.municipality || props.municipalityName || ""),
    });
  }

  if (!parsed.length && total) {
    throw new Error(`Skjer i kirken: ${total} aktiviteter meldt, men ingen kunne parses for ${slug}`);
  }

  return arrDedupeParsed(parsed);
}


async function arrFetchAndParseVigrestadSource(source, url) {
  if (!/calendar\.google\.com\/calendar\/ical\//i.test(url) && !/\.ics(?:\?|$)/i.test(url)) {
    throw new Error("Vigrestad-underkilde må ha direkte Google Calendar ICS-adresse");
  }

  const sourceId = arrClean(source[ARR_F.sources.sourceId] || "vigrestad");
  const parsed = await arrFetchAndParseIcal(url);
  const out = [];

  for (const item of parsed) {
    if (!item?.startTime || !arrClean(item.title || "")) continue;

    const rawId = item.sourceEventId || await arrStableKey(
      "vigrestad-room",
      item.startTime,
      item.title,
      item.endTime || ""
    );

    out.push({
      ...item,
      sourceEventId:`vigrestad-${arrNormalize(sourceId)}-${rawId}`,
      organizer:"Vigrestad Misjonshus",
      location:"Vigrestad Misjonshus",
      sourceUrl:url
    });
  }

  const deduped = arrDedupeParsed(out);

  if (!deduped.length) {
    // V407: Fuglareiret kan legitimt være helt tom.
    // For SRC-0017 skal 0 arrangementer derfor regnes som en gyldig import,
    // men som merge-only slik at eventuelle eldre rader ikke deaktiveres
    // bare fordi kalenderen akkurat nå er tom.
    if (sourceId === "SRC-0017") {
      deduped._mergeOnly = true;
      deduped._importNote =
        "Vigrestad Misjonshus Fuglareiret: kalenderen er tom; dette er gyldig og eksisterende usette rader beholdes.";
      return deduped;
    }

    throw new Error(
      `Vigrestad-underkilde ${sourceId} ga ingen arrangementer i importvinduet`
    );
  }

  return deduped;
}


async function arrFetchAndParseVigrestad() {
  // Vigrestad Misjonshus publiserer separate offentlige Google-kalendere per rom.
  // Første versjon bruker Hovedsal + Fuglareiret, som dekker de mest relevante
  // offentlige aktivitetene uten å importere alle rombestillinger ukritisk.
  const calendars = [
    {
      room:"Hovedsal",
      url:"https://calendar.google.com/calendar/ical/c31ebf75ce40366d5917a6c5660f5f04caa81fe89f14f4f387198d8b973a3969%40group.calendar.google.com/public/basic.ics"
    },
    {
      room:"Fuglareiret",
      url:"https://calendar.google.com/calendar/ical/48036d86b771da59c556435c7a62eefff1ebebefed9ca39a24d4518dfb5ab1a3%40group.calendar.google.com/public/basic.ics"
    }
  ];

  const publicHints = [
    "gudstjeneste","møte","mote","bønn","bonn","bib","misjon","norkirken",
    "fuglareiret","speidar","speider","yngres","unges","barnekor","kor",
    "vi over 60","senior","basar","konsert","fest","samling","søndag","sondag",
    "jule","påske","paske","årsmøte","arsmote","dugnad","kveld","formiddag"
  ];
  const privateHints = [
    "privat","reservert","reservasjon","utleie","utleid","booking","opptatt",
    "bryllup","bursdag","minnesamvær","minnesamver","selskap"
  ];

  const all = [];
  for (const cal of calendars) {
    const parsed = await arrFetchAndParseIcal(cal.url);
    for (const item of parsed) {
      const text = arrNormalize([item.title,item.description,item.location].filter(Boolean).join(" "));
      if (!text) continue;
      if (privateHints.some(h => text.includes(arrNormalize(h)))) continue;

      // Fuglareiret-kalenderen er i seg selv en offentlig aktivitet. For Hovedsal
      // krever vi et tydelig arrangements-signal for å unngå private rombookinger.
      const isPublic = cal.room === "Fuglareiret" || publicHints.some(h => text.includes(arrNormalize(h)));
      if (!isPublic) continue;

      all.push({
        ...item,
        sourceEventId:`vigrestad-${arrNormalize(cal.room)}-${item.sourceEventId || await arrStableKey("vigrestad", item.startTime, item.title)}`,
        location:"Vigrestad Misjonshus",
        sourceUrl:"https://vigrestadmisjonshus.org/kalendere.html?v=2"
      });
    }
  }

  const deduped = arrDedupeParsed(all);
  if (!deduped.length) throw new Error("Vigrestad-parser fant ingen offentlige arrangementer");
  return deduped;
}

async function arrFetchAndParseIcalFromPage(url) {
  if (/calendar\.google\.com\/calendar\/ical\//i.test(url) || /\.ics(?:\?|$)/i.test(url)) {
    return arrFetchAndParseIcal(url);
  }

  const html = await arrFetchText(url);
  const hrefMatches = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(m => arrDecodeEntities(m[1]).replace(/&amp;/g,"&"));
  let icsUrl = hrefMatches.find(h => /calendar\.google\.com\/calendar\/ical\//i.test(h) || /\.ics(?:\?|$)/i.test(h));

  // Some WordPress/calendar plugins print the URL outside a normal href attribute.
  if (!icsUrl) {
    const raw = html.match(/https?:\/\/calendar\.google\.com\/calendar\/ical\/[^\s"'<>]+/i) || html.match(/https?:\/\/[^\s"'<>]+\.ics(?:\?[^\s"'<>]*)?/i);
    if (raw) icsUrl = arrDecodeEntities(raw[0]).replace(/&amp;/g,"&");
  }

  if (!icsUrl) throw new Error(`Fant ingen iCal/ICS-lenke på ${url}`);
  icsUrl = arrClean(String(icsUrl)).replace(/[)>]+$/g,"");
  return arrFetchAndParseIcal(icsUrl);
}

async function arrFetchText(url) {
  const r = await fetch(url,{headers:{"User-Agent":"Kvimarka92-Arrangementskalender/1.0","Accept":"text/html,text/calendar,text/plain;q=0.9,*/*;q=0.5"}});
  if (!r.ok) throw new Error(`Kilde svarte HTTP ${r.status}: ${url}`);
  return r.text();
}

async function arrFetchAndParseIcal(url) {
  const text = await arrFetchText(url);
  return arrParseIcal(text,url);
}

function arrUnfoldIcal(text) {
  return text.replace(/\r?\n[ \t]/g,"");
}

function arrParseIcal(text, sourceUrl) {
  const unfolded = arrUnfoldIcal(text);
  const allBlocks = unfolded.split("BEGIN:VEVENT").slice(1).map(x => x.split("END:VEVENT")[0]);

  const out = [];
  const nowMs = Date.now();
  const fromMs = nowMs - 7 * 86400000;
  const toMs = nowMs + 400 * 86400000;

  // V312: Grovfiltrer VEVENT før arrParseIcalProps().
  // Kleppe Bedehus har rundt 1800 historiske VEVENT-rader. Å fullparse alle
  // disse i Workers Free er unødvendig og har gitt 503/resource-limit.
  //
  // RRULE-mastere beholdes alltid fordi en gammel DTSTART kan ha fremtidige
  // forekomster. Vanlige enkeltarrangement og RECURRENCE-ID-unntak kan derimot
  // forkastes svært billig ut fra YYYYMMDD i DTSTART-linjen.
  const fromDateKey = new Date(fromMs).toISOString().slice(0,10).replace(/-/g,"");
  const toDateKey = new Date(toMs).toISOString().slice(0,10).replace(/-/g,"");

  const blocks = allBlocks.filter(block => {
    if (/^RRULE(?:;|:)/mi.test(block)) return true;

    const dt = block.match(/^DTSTART(?:;[^:]*)?:(\d{8})/mi);
    if (!dt) return true;

    const dateKey = dt[1];
    return dateKey >= fromDateKey && dateKey <= toDateKey;
  });

  const parsedBlocks = blocks.map(block => ({block, props:arrParseIcalProps(block)}));

  // Google Calendar stores recurring events as one VEVENT + RRULE. Earlier versions
  // imported only the original DTSTART, which meant recurring future Ogna events never
  // appeared. Expand the common recurrence rules into concrete occurrences here.
  const exceptionKeys = new Set();
  for (const entry of parsedBlocks) {
    const uid = entry.props.UID?.value || "";
    const recurrenceId = arrParseIcalDate(entry.props["RECURRENCE-ID"]?.value, entry.props["RECURRENCE-ID"]?.params);
    if (uid && recurrenceId) exceptionKeys.add(`${uid}::${recurrenceId}`);
  }

  for (const entry of parsedBlocks) {
    const {block, props} = entry;
    const uid = props.UID?.value || null;
    const start = arrParseIcalDate(props.DTSTART?.value, props.DTSTART?.params);
    if (!start) continue;
    const end = arrParseIcalDate(props.DTEND?.value, props.DTEND?.params);
    const recurrenceId = arrParseIcalDate(props["RECURRENCE-ID"]?.value, props["RECURRENCE-ID"]?.params);
    const title = arrIcalUnescape(props.SUMMARY?.value || "");
    const location = arrIcalUnescape(props.LOCATION?.value || "");
    const description = arrIcalUnescape(props.DESCRIPTION?.value || "");
    const eventUrl = arrIcalUnescape(props.URL?.value || sourceUrl);

    if (recurrenceId) {
      // V308: også enkeltstående unntak i en serie må ligge innenfor
      // importvinduet. Tidligere ble historiske RECURRENCE-ID-rader beholdt.
      const startMs = new Date(start).getTime();
      if (Number.isFinite(startMs) && startMs >= fromMs && startMs <= toMs) {
        out.push({
          sourceEventId:uid ? `${uid}::${recurrenceId}` : null,
          title,
          startTime:start,
          endTime:end,
          location,
          description,
          sourceUrl:eventUrl,
        });
      }
      continue;
    }

    const rrule = props.RRULE?.value || "";
    if (!rrule) {
      // KRITISK V308-FIKS:
      // Tidligere ble ALLE ikke-gjentakende VEVENT-rader importert uansett dato.
      // Kleppe Bedehus sin Google Calendar inneholder rundt 1800 historiske
      // VEVENT-rader. De ble dermed slettet av 7-dagers purge og opprettet på
      // nytt ved hver import, samtidig som kildeimporten ble svært tung.
      //
      // Behold bare 7 dager historikk og 400 dager fremover, samme vindu som
      // allerede brukes for RRULE-ekspansjon.
      const startMs = new Date(start).getTime();
      if (Number.isFinite(startMs) && startMs >= fromMs && startMs <= toMs) {
        out.push({
          sourceEventId:uid,
          title,
          startTime:start,
          endTime:end,
          location,
          description,
          sourceUrl:eventUrl
        });
      }
      continue;
    }

    const durationMs = end ? Math.max(0, new Date(end).getTime() - new Date(start).getTime()) : null;
    const exdates = arrIcalExdateSet(block);
    const occurrences = arrExpandIcalRecurrence(props.DTSTART?.value, props.DTSTART?.params, rrule, fromMs, toMs);

    for (const occurrenceStart of occurrences) {
      if (exdates.has(occurrenceStart)) continue;
      const occurrenceKey = uid ? `${uid}::${occurrenceStart}` : null;
      if (occurrenceKey && exceptionKeys.has(occurrenceKey)) continue;
      const occurrenceEnd = durationMs === null ? null : new Date(new Date(occurrenceStart).getTime() + durationMs).toISOString();
      out.push({
        sourceEventId:occurrenceKey,
        title,
        startTime:occurrenceStart,
        endTime:occurrenceEnd,
        location,
        description,
        sourceUrl:eventUrl,
      });
    }
  }
  return arrDedupeParsed(out);
}

function arrIcalExdateSet(block) {
  const set = new Set();
  for (const line of block.split(/\r?\n/)) {
    if (!/^EXDATE(?:;|:)/i.test(line)) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const left = line.slice(0,idx).split(";");
    left.shift();
    const params = {};
    for (const p of left) {
      const j=p.indexOf("=");
      if (j>0) params[p.slice(0,j).toUpperCase()] = p.slice(j+1);
    }
    for (const raw of line.slice(idx+1).split(",")) {
      const iso = arrParseIcalDate(raw.trim(), params);
      if (iso) set.add(iso);
    }
  }
  return set;
}

function arrParseRrule(value) {
  const out = {};
  for (const part of String(value || "").split(";")) {
    const idx=part.indexOf("=");
    if (idx>0) out[part.slice(0,idx).toUpperCase()] = part.slice(idx+1);
  }
  return out;
}

function arrExpandIcalRecurrence(dtStartValue, dtStartParams, ruleText, fromMs, toMs) {
  const rule = arrParseRrule(ruleText);
  const freq = String(rule.FREQ || "").toUpperCase();
  const interval = Math.max(1, Number(rule.INTERVAL || 1));
  const countLimit = rule.COUNT ? Math.max(1, Number(rule.COUNT)) : Infinity;
  const untilIso = rule.UNTIL ? arrParseIcalDate(rule.UNTIL, {}) : null;
  const untilMs = untilIso ? new Date(untilIso).getTime() : Infinity;
  const maxMs = Math.min(toMs, untilMs);
  const baseIso = arrParseIcalDate(dtStartValue, dtStartParams);
  if (!baseIso || !freq) return baseIso ? [baseIso] : [];

  const local = String(dtStartValue || "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  const isUtc = /Z$/.test(String(dtStartValue || ""));
  const baseDate = new Date(baseIso);
  const results = [];
  let generated = 0;

  const pushIso = iso => {
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms > maxMs || generated >= countLimit) return false;
    generated++;
    if (ms >= fromMs && ms <= toMs) results.push(iso);
    return true;
  };

  function makeLocalIso(y,m,d,h,mi,s) {
    if (isUtc || !local) return new Date(Date.UTC(y,m-1,d,h,mi,s)).toISOString();
    return arrOsloLocalIso(y,m,d,h,mi,s);
  }

  const baseY = local ? Number(local[1]) : baseDate.getUTCFullYear();
  const baseM = local ? Number(local[2]) : baseDate.getUTCMonth()+1;
  const baseD = local ? Number(local[3]) : baseDate.getUTCDate();
  const baseH = local ? Number(local[4]) : baseDate.getUTCHours();
  const baseMin = local ? Number(local[5]) : baseDate.getUTCMinutes();
  const baseS = local ? Number(local[6]) : baseDate.getUTCSeconds();

  if (freq === "DAILY") {
    for (let n=0; generated<countLimit && n<2000; n+=interval) {
      const d = new Date(Date.UTC(baseY,baseM-1,baseD+n));
      const iso = makeLocalIso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),baseH,baseMin,baseS);
      if (new Date(iso).getTime() > maxMs) break;
      if (!pushIso(iso)) break;
    }
    return results;
  }

  if (freq === "WEEKLY") {
    const dayMap={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
    const baseDay = new Date(Date.UTC(baseY,baseM-1,baseD)).getUTCDay();
    const byDays = String(rule.BYDAY || "").split(",").map(x=>x.replace(/^[-+]?\d+/,"")).map(x=>dayMap[x]).filter(x=>Number.isInteger(x));
    const days = byDays.length ? [...new Set(byDays)].sort((a,b)=>a-b) : [baseDay];
    const week0 = new Date(Date.UTC(baseY,baseM-1,baseD - baseDay));
    outer: for (let week=0; week<600 && generated<countLimit; week+=interval) {
      for (const dow of days) {
        const d = new Date(week0.getTime() + (week*7+dow)*86400000);
        if (d < new Date(Date.UTC(baseY,baseM-1,baseD))) continue;
        const iso=makeLocalIso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),baseH,baseMin,baseS);
        if (new Date(iso).getTime() > maxMs) break outer;
        if (!pushIso(iso)) break outer;
      }
    }
    return results;
  }

  if (freq === "MONTHLY") {
    const monthDays = String(rule.BYMONTHDAY || baseD).split(",").map(Number).filter(n=>n>=1 && n<=31);
    outer: for (let n=0; n<240 && generated<countLimit; n+=interval) {
      const first = new Date(Date.UTC(baseY,baseM-1+n,1));
      for (const md of monthDays) {
        const d=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),md));
        if (d.getUTCMonth()!==first.getUTCMonth()) continue;
        if (d < new Date(Date.UTC(baseY,baseM-1,baseD))) continue;
        const iso=makeLocalIso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),baseH,baseMin,baseS);
        if (new Date(iso).getTime()>maxMs) break outer;
        if (!pushIso(iso)) break outer;
      }
    }
    return results;
  }

  if (freq === "YEARLY") {
    for (let n=0;n<20 && generated<countLimit;n+=interval) {
      const iso=makeLocalIso(baseY+n,baseM,baseD,baseH,baseMin,baseS);
      if (new Date(iso).getTime()>maxMs) break;
      if (!pushIso(iso)) break;
    }
    return results;
  }

  return [baseIso];
}

function arrParseIcalProps(block) {
  const o = {};
  for (const line of block.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const left = line.slice(0,idx);
    const value = line.slice(idx+1);
    const parts = left.split(";");
    const name = parts.shift().toUpperCase();
    const params = {};
    for (const p of parts) {
      const j = p.indexOf("=");
      if (j > 0) params[p.slice(0,j).toUpperCase()] = p.slice(j+1);
    }
    o[name] = {value,params};
  }
  return o;
}

function arrParseIcalDate(value, params={}) {
  if (!value) return null;
  if (/^\d{8}$/.test(value)) return `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}T00:00:00+02:00`;
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  const [,y,mo,d,h,mi,s,z] = m;
  if (z === "Z") return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toISOString();
  // Local events are assumed Europe/Oslo. Offset conversion is resolved by JS through explicit offset helper.
  return arrOsloLocalIso(Number(y),Number(mo),Number(d),Number(h),Number(mi),Number(s));
}

function arrBetelAttr(tag, name) {
  const m = String(tag || "").match(new RegExp(`\\b${name}=["']([^"']*)["']`,"i"));
  return m ? arrDecodeEntities(m[1]) : "";
}

function arrBetelStrip(html) {
  return arrClean(
    arrDecodeEntities(
      String(html || "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
        .replace(/<br\s*\/?>/gi," ")
        .replace(/<[^>]+>/g," ")
    ).replace(/\s+/g," ")
  );
}

function arrParseBetelSimpleCalendarHtml(html, sourceUrl) {
  const out = [];
  const blockRe = /<li\b([^>]*\bclass=["'][^"']*\bsimcal-event\b[^"']*["'][^>]*)>([\s\S]*?)<\/li>/gi;
  let m;

  while ((m = blockRe.exec(String(html || ""))) !== null) {
    const attrs = m[1];
    const body = m[2];

    let startSec = Number(arrBetelAttr(attrs,"data-start") || 0);
    let endSec = Number(arrBetelAttr(attrs,"data-end") || 0);
    let eventId = arrBetelAttr(attrs,"data-event-id") || arrBetelAttr(attrs,"data-id");

    if (!startSec) {
      const sm = body.match(/\bdata-event-start=["'](\d{9,13})["']/i);
      if (sm) startSec = Number(sm[1]);
    }
    if (!endSec) {
      const em = body.match(/\bdata-event-end=["'](\d{9,13})["']/i);
      if (em) endSec = Number(em[1]);
    }

    const titleMatch =
      body.match(/<[^>]*class=["'][^"']*\bsimcal-event-title\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i) ||
      body.match(/itemprop=["']name["'][^>]*>([\s\S]*?)<\/[^>]+>/i);

    const title = titleMatch ? arrBetelStrip(titleMatch[1]) : "";
    if (!title || !startSec) continue;

    // Simple Calendar bruker Unix-sekunder i data-attributtene.
    if (startSec > 9999999999) startSec = Math.floor(startSec / 1000);
    if (endSec > 9999999999) endSec = Math.floor(endSec / 1000);

    const locationMatch =
      body.match(/itemprop=["']location["'][^>]*>([\s\S]*?)<\/[^>]+>/i) ||
      body.match(/<[^>]*class=["'][^"']*\bsimcal-event-address\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);

    const descMatch =
      body.match(/<[^>]*class=["'][^"']*\bsimcal-event-description\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);

    out.push({
      sourceEventId:eventId || undefined,
      title,
      startTime:new Date(startSec*1000).toISOString(),
      endTime:endSec ? new Date(endSec*1000).toISOString() : null,
      location:locationMatch ? arrBetelStrip(locationMatch[1]) : "Pinsemenigheten Betel, Nærbø",
      description:descMatch ? arrBetelStrip(descMatch[1]) : "",
      sourceUrl,
    });
  }

  return arrDedupeParsed(out);
}

function arrBetelCalendarMeta(html) {
  const raw = String(html || "");

  const calendarTagMatch = raw.match(
    /<div\b[^>]*class=["'][^"']*\bsimcal-default-calendar-list\b[^"']*["'][^>]*>/i
  );
  const tag = calendarTagMatch ? calendarTagMatch[0] : "";

  const listTagMatch = raw.match(
    /<div\b[^>]*class=["'][^"']*\bsimcal-events-list-container\b[^"']*["'][^>]*>/i
  );
  const listTag = listTagMatch ? listTagMatch[0] : "";

  // V271: Simple Calendar markup varierer litt mellom første side og AJAX-svar.
  // Bruk klassebasert tag først, men fall tilbake til direkte data-attributt-søk.
  const firstNumber = (attr, preferredTag, minDigits=1, maxDigits=13) => {
    const direct = Number(arrBetelAttr(preferredTag || "", attr) || 0);
    if (direct) return direct;
    const re = new RegExp(`\\b${attr}=["'](\\d{${minDigits},${maxDigits}})["']`, "i");
    const mm = raw.match(re);
    return mm ? Number(mm[1]) : 0;
  };

  // Calendar ID is normally a small WordPress post ID. Previous code
  // incorrectly required 9-13 digits, which is suitable for timestamps only.
  const id = firstNumber("data-calendar-id", tag, 1, 10);
  const end = firstNumber("data-calendar-end", tag, 9, 13);
  const next = firstNumber("data-next", listTag, 9, 13);
  const prev = firstNumber("data-prev", listTag, 9, 13);

  const isGrid = /\\bsimcal-default-calendar-grid\\b/i.test(raw);
  const current = firstNumber("data-calendar-current", raw, 9, 13);
  const eventsFirst = firstNumber("data-events-first", raw, 9, 13);

  return {id,end,next,prev,isGrid,current,eventsFirst};
}

async function arrFetchBetelAjaxPage(calendarId, timestamp) {
  const body = new URLSearchParams();
  body.set("action","simcal_default_calendar_draw_list");
  body.set("ts",String(timestamp));
  body.set("id",String(calendarId));

  const res = await fetch("https://pinsebetel.no/wp-admin/admin-ajax.php",{
    method:"POST",
    headers:{
      "User-Agent":"Kvimarka92-Arrangementskalender/1.0",
      "Accept":"application/json",
      "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With":"XMLHttpRequest",
      "Referer":"https://pinsebetel.no/hva-skjer/",
    },
    body:body.toString()
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`Betel AJAX HTTP ${res.status}: ${raw.slice(0,300)}`);

  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error(`Betel AJAX ga ikke JSON: ${raw.slice(0,300)}`); }

  if (!data || data.success === false || typeof data.data !== "string") {
    throw new Error(`Betel AJAX ugyldig svar: ${raw.slice(0,500)}`);
  }
  return data.data;
}


function arrParseKleppeSimpleCalendarHtml(html, sourceUrl) {
  const out = [];
  const raw = String(html || "");

  // Simple Calendar markup. This is deliberately the same narrow event block
  // pattern already proven for Betel, but with Kleppe-specific fallback data.
  const blockRe = /<li\b([^>]*\bclass=["'][^"']*\bsimcal-event\b[^"']*["'][^>]*)>([\s\S]*?)<\/li>/gi;
  let m;

  while ((m = blockRe.exec(raw)) !== null) {
    const attrs = m[1];
    const body = m[2];

    let startSec = Number(arrBetelAttr(attrs,"data-start") || 0);
    let endSec = Number(arrBetelAttr(attrs,"data-end") || 0);
    const eventId =
      arrBetelAttr(attrs,"data-event-id") ||
      arrBetelAttr(attrs,"data-id") ||
      "";

    if (!startSec) {
      const sm = body.match(/\bdata-event-start=["'](\d{9,13})["']/i);
      if (sm) startSec = Number(sm[1]);
    }
    if (!endSec) {
      const em = body.match(/\bdata-event-end=["'](\d{9,13})["']/i);
      if (em) endSec = Number(em[1]);
    }

    if (startSec > 9999999999) startSec = Math.floor(startSec / 1000);
    if (endSec > 9999999999) endSec = Math.floor(endSec / 1000);

    // Tidligste mulige datofilter: forkast blokken før vi parser resten.
    const startMs = startSec ? startSec * 1000 : 0;
    const fromMs = Date.now() - 7 * 86400000;
    const toMs = Date.now() + 400 * 86400000;
    if (startMs && (startMs < fromMs || startMs > toMs)) continue;

    const titleMatch =
      body.match(/<[^>]*class=["'][^"']*\bsimcal-event-title\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i) ||
      body.match(/itemprop=["']name["'][^>]*>([\s\S]*?)<\/[^>]+>/i);

    const title = titleMatch ? arrBetelStrip(titleMatch[1]) : "";
    if (!title || !startSec) continue;

    const locationMatch =
      body.match(/itemprop=["']location["'][^>]*>([\s\S]*?)<\/[^>]+>/i) ||
      body.match(/<[^>]*class=["'][^"']*\bsimcal-event-address\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);

    const descMatch =
      body.match(/<[^>]*class=["'][^"']*\bsimcal-event-description\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);

    const hrefMatch =
      body.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Se flere detaljer|More details)/i);

    const startTime = new Date(startSec*1000).toISOString();

    out.push({
      sourceEventId:
        eventId ||
        `kleppe-${startSec}-${arrNormalize(title).slice(0,60)}`,
      title,
      startTime,
      endTime:endSec ? new Date(endSec*1000).toISOString() : null,
      location:locationMatch
        ? arrBetelStrip(locationMatch[1])
        : "Kleppe Bedehus, Kleppe",
      description:descMatch ? arrBetelStrip(descMatch[1]) : "",
      sourceUrl:hrefMatch
        ? new URL(arrDecodeEntities(hrefMatch[1]),sourceUrl).href
        : sourceUrl,
      settlementHint:"Kleppe",
      municipalityHint:"Klepp"
    });
  }

  return arrDedupeParsed(out);
}

async function arrFetchSimpleCalendarGridPage({
  baseUrl,
  referer,
  calendarId,
  month,
  year
}) {
  const body = new URLSearchParams();
  body.set("action","simcal_default_calendar_draw_grid");
  body.set("month",String(month));
  body.set("year",String(year));
  body.set("id",String(calendarId));

  const res = await fetch(baseUrl,{
    method:"POST",
    headers:{
      "User-Agent":"Kvimarka92-Arrangementskalender/1.0",
      "Accept":"application/json",
      "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With":"XMLHttpRequest",
      "Referer":referer,
    },
    body:body.toString()
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Simple Calendar GRID AJAX HTTP ${res.status}: ${raw.slice(0,300)}`);
  }

  let data;
  try { data = JSON.parse(raw); }
  catch (_) {
    throw new Error(`Simple Calendar GRID AJAX ga ikke JSON: ${raw.slice(0,300)}`);
  }

  if (!data || data.success === false || typeof data.data !== "string") {
    throw new Error(`Simple Calendar GRID AJAX ugyldig svar: ${raw.slice(0,500)}`);
  }

  return data.data;
}

async function arrFetchSimpleCalendarAjaxPage({
  baseUrl,
  referer,
  calendarId,
  timestamp
}) {
  const body = new URLSearchParams();
  body.set("action","simcal_default_calendar_draw_list");
  body.set("ts",String(timestamp));
  body.set("id",String(calendarId));

  const res = await fetch(baseUrl,{
    method:"POST",
    headers:{
      "User-Agent":"Kvimarka92-Arrangementskalender/1.0",
      "Accept":"application/json",
      "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With":"XMLHttpRequest",
      "Referer":referer,
    },
    body:body.toString()
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Simple Calendar AJAX HTTP ${res.status}: ${raw.slice(0,300)}`);
  }

  let data;
  try { data = JSON.parse(raw); }
  catch (_) {
    throw new Error(`Simple Calendar AJAX ga ikke JSON: ${raw.slice(0,300)}`);
  }

  if (!data || data.success === false || typeof data.data !== "string") {
    throw new Error(`Simple Calendar AJAX ugyldig svar: ${raw.slice(0,500)}`);
  }

  return data.data;
}

async function arrFetchAndParseKleppeBedehus(url) {
  const calendarUrl = "https://kleppebedehus.no/calendar/kalender/";
  const html = await arrFetchText(calendarUrl);
  const meta = arrBetelCalendarMeta(html);

  const out = [...arrParseKleppeSimpleCalendarHtml(html,calendarUrl)];

  if (!meta.id) {
    throw new Error(
      `Kleppe Bedehus: fant ikke calendarId i Simple Calendar-markup ` +
      `(events=${out.length}, isGrid=${meta.isGrid ? "yes" : "no"})`
    );
  }

  const ajaxUrl = "https://kleppebedehus.no/wp-admin/admin-ajax.php";

  {
    // V318: Kleppe Bedehus er bekreftet månedskalender/grid.
    // Ikke stol på generisk class-detection her; siden eksponerer calendarId,
    // current og eventsFirst, men class-navnet matcher ikke vår generiske test.
    // Offisiell plugin-JS bruker:
    // action=simcal_default_calendar_draw_grid + month + year + id.
    //
    // Vi trenger ikke data-next. Vi går direkte måned for måned fra neste
    // måned og stopper ved 400-dagersgrensen / calendar-end.
    const now = new Date();
    const hardEndMs = Math.min(
      Date.now() + 400 * 86400000,
      meta.end ? meta.end * 1000 : Number.POSITIVE_INFINITY
    );

    let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    for (let i=0; i<14 && cursor.getTime() <= hardEndMs; i++) {
      const month = cursor.getUTCMonth() + 1;
      const year = cursor.getUTCFullYear();

      const pageHtml = await arrFetchSimpleCalendarGridPage({
        baseUrl:ajaxUrl,
        referer:calendarUrl,
        calendarId:meta.id,
        month,
        year
      });

      out.push(...arrParseKleppeSimpleCalendarHtml(pageHtml,calendarUrl));
      cursor = new Date(Date.UTC(year, month, 1));
    }
  }

  const filtered = arrFilterParsedEventWindow(arrDedupeParsed(out));

  if (!filtered.length) {
    throw new Error(
      `Kleppe Bedehus-parser fant ingen arrangementer ` +
      `(calendarId=${meta.id || 0}, grid=${meta.isGrid ? "yes" : "no"})`
    );
  }

  return filtered;
}

async function arrFetchAndParseBetel(url) {
  // V267: Betel bruker Simple Calendar. Pluginens egen JS navigerer listevisningen
  // via POST til admin-ajax.php med action=simcal_default_calendar_draw_list,
  // ts=<neste timestamp> og id=<calendar id>. Vi gjør nøyaktig det samme.
  const html = await arrFetchText(url);
  const meta = arrBetelCalendarMeta(html);

  if (!meta.id) {
    // Sikker fallback til den gamle korte HTML-parseren.
    const lines = arrHtmlToLines(html).split("\n").map(arrClean).filter(Boolean);
    const out = [];
    let currentDate = null;
    const yearGuess = new Date().getFullYear();

    for (const line of lines) {
      const dm = line.match(/^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s+(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)(?:\s+(\d{4}))?$/i);
      if (dm) {
        let year = Number(dm[4] || yearGuess);
        const month = ARR_NORWEGIAN_MONTHS[arrNormalize(dm[3])];
        const day = Number(dm[2]);
        const now = new Date();
        if (!dm[4] && month < now.getMonth()+1-6) year++;
        currentDate = {year,month,day};
        continue;
      }
      if (!currentDate) continue;
      const em = line.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
      if (em) {
        out.push({
          title:arrClean(em[3]),
          startTime:arrOsloLocalIso(currentDate.year,currentDate.month,currentDate.day,Number(em[1]),Number(em[2]),0),
          location:"Pinsemenigheten Betel, Nærbø",
          sourceUrl:url,
        });
      }
    }
    if (!out.length) throw new Error("Betel-parser fant ingen arrangementer");
    return arrDedupeParsed(out);
  }

  const out = [...arrParseBetelSimpleCalendarHtml(html,url)];
  const visited = new Set();
  let next = meta.next;
  const hardEnd = meta.end || Math.floor((Date.now()+400*86400000)/1000);

  // Typisk viser hver AJAX-side omtrent én måned. 18 hopp gir god margin
  // samtidig som vi holder Worker-subrequests nede.
  for (let i=0; i<18; i++) {
    if (!next || visited.has(next) || next >= hardEnd) break;
    visited.add(next);

    const pageHtml = await arrFetchBetelAjaxPage(meta.id,next);
    out.push(...arrParseBetelSimpleCalendarHtml(pageHtml,url));

    const pageMeta = arrBetelCalendarMeta(
      `<div class="simcal-default-calendar-list" data-calendar-id="${meta.id}" data-calendar-end="${hardEnd}"></div>${pageHtml}`
    );
    const newNext = pageMeta.next;

    if (!newNext || newNext === next) break;
    next = newNext;
  }

  const deduped = arrDedupeParsed(out);
  if (!deduped.length) throw new Error("Betel Simple Calendar-parser fant ingen arrangementer");
  return deduped;
}

function arrCornerstoneServiceDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const n = value < 100000000000 ? value * 1000 : value;
    const d = new Date(n);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(value).trim();
  const dotNet = s.match(/^\/Date\((\d+)(?:[+-]\d+)?\)\/$/);
  if (dotNet) {
    const d = new Date(Number(dotNet[1]));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (/^\d{10,13}$/.test(s)) {
    let n = Number(s);
    if (s.length === 10) n *= 1000;
    const d = new Date(n);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function arrCornerstoneItems(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of ["events","results","data","items","calendar"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

async function arrFetchCornerstoneCalendarService(calendarUrl, sourcePrefix, fallbackLocation) {
  const html = await arrFetchText(calendarUrl);

  // Cornerstone skriver normalt serviceLink direkte i inline JavaScript.
  const serviceMatch =
    html.match(/var\s+serviceLink\s*=\s*["']([^"']+events_service[^"']*)["']/i) ||
    html.match(/serviceLink\s*[:=]\s*["']([^"']+events_service[^"']*)["']/i);

  if (!serviceMatch) {
    throw new Error("Cornerstone serviceLink ble ikke funnet i kalendersiden");
  }

  const rawServiceLink = arrDecodeEntities(serviceMatch[1]).replace(/\\\//g,"/");
  const serviceLink = new URL(rawServiceLink, calendarUrl).href;

  // serviceLink inneholder normalt:
  // .../events_service/start/:start-time/end/:end-time/url/<route>/view_id/<id>
  const parsed = serviceLink.match(
    /^(.*?\/events_service)\/start\/[^/]+\/end\/[^/]+\/url\/([^/]+)\/view_id\/([^/?#]+)/i
  );
  if (!parsed) {
    throw new Error(`Cornerstone serviceLink-format ukjent: ${serviceLink}`);
  }

  const serviceBase = parsed[1];
  const detailRoute = parsed[2];
  const viewId = parsed[3];

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 14);
  rangeStart.setHours(0,0,0,0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);

  function ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  const variants = [
    [String(rangeStart.getTime()), String(rangeEnd.getTime())],
    [String(Math.floor(rangeStart.getTime()/1000)), String(Math.floor(rangeEnd.getTime()/1000))],
    [ymd(rangeStart), ymd(rangeEnd)],
    [rangeStart.toISOString(), rangeEnd.toISOString()],
  ];

  let lastError = null;

  for (const [startValue,endValue] of variants) {
    const u =
      `${serviceBase}/start/${encodeURIComponent(startValue)}` +
      `/end/${encodeURIComponent(endValue)}` +
      `/url/${detailRoute}/view_id/${viewId}`;

    try {
      const responseText = await arrFetchText(u);
      let data;
      try {
        data = JSON.parse(responseText);
        if (typeof data === "string") data = JSON.parse(data);
      } catch (_) {
        data = null;
      }

      const items = arrCornerstoneItems(data);
      if (!items.length) continue;

      const out = [];
      for (const item of items) {
        const title = arrClean(item.title || item.name || item.summary || "");
        const startTime = arrCornerstoneServiceDate(
          item.start || item.startTime || item.start_time || item.dateStart
        );
        if (!title || !startTime) continue;

        const endTime = arrCornerstoneServiceDate(
          item.end || item.endTime || item.end_time || item.dateEnd
        );
        const rawUrl = arrClean(item.url || item.href || item.link || "");
        const id = String(item.id || item.event_id || item.eventId || "").trim();

        out.push({
          sourceEventId:id
            ? `${sourcePrefix}-${id}`
            : `${sourcePrefix}-${await arrStableKey(sourcePrefix,startTime,title)}`,
          title,
          startTime,
          endTime,
          location:arrClean(item.location || fallbackLocation),
          description:arrClean(item.description || item.details || ""),
          sourceUrl:rawUrl ? new URL(rawUrl, calendarUrl).href : calendarUrl,
        });
      }

      if (out.length) {
        return {
          events:arrDedupeParsed(out),
          serviceLink,
          serviceBase,
          detailRoute,
          viewId,
          workingUrl:u,
        };
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Cornerstone service svarte uten arrangementer");
}

async function arrFetchAndParseObsBedehus(url) {
  // V406: OBS Bedehus.
  //
  // De tre Wix-embedene viser at OBS bruker offentlige Google-kalendere.
  // Vi går derfor direkte på Google Calendar iCal-feedene i stedet for å
  // forsøke å parse Wix/filesusr-HTML.
  //
  // Kalender-ID-er hentet fra de offentlige iframe-ene:
  //   Brusand: brusand@obsbedehus.no
  //   Sirevåg: sirevagbedehus@gmail.com
  //   Felles:  felles@obsbedehus.no
  //   Ogna:    ogna@obsbedehus.no
  //
  // Dersom alle feedene kan leses, behandles dette som en komplett import.
  // Hvis én feed feiler, bruker vi de andre som merge-only slik at eksisterende
  // OBS-rader aldri deaktiveres på grunn av en midlertidig kildefeil.

  const calendars = [
    {
      key: "brusand",
      name: "Brusand",
      calendarId: "brusand@obsbedehus.no",
      location: "Brusand Bedehus"
    },
    {
      key: "sirevag",
      name: "Sirevåg",
      calendarId: "sirevagbedehus@gmail.com",
      location: "Sirevåg Bedehus"
    },
    {
      key: "felles",
      name: "Felles",
      calendarId: "felles@obsbedehus.no",
      location: "OBS Bedehus"
    },
    {
      key: "ogna",
      name: "Ogna",
      calendarId: "ogna@obsbedehus.no",
      location: "Ogna Bedehus"
    }
  ];

  const all = [];
  const failedCalendars = [];

  for (const cal of calendars) {
    const icsUrl =
      "https://calendar.google.com/calendar/ical/" +
      encodeURIComponent(cal.calendarId) +
      "/public/basic.ics";

    try {
      const parsed = await arrFetchAndParseIcal(icsUrl);

      for (const item of parsed) {
        if (!item?.startTime || !arrClean(item.title || "")) {
          continue;
        }

        const rawId =
          item.sourceEventId ||
          await arrStableKey(
            "obs",
            cal.key,
            item.startTime,
            item.title,
            item.endTime || ""
          );

        all.push({
          ...item,
          sourceEventId: `obs-${cal.key}-${rawId}`,
          location: arrClean(item.location || cal.location),
          sourceUrl: icsUrl
        });
      }
    } catch (error) {
      failedCalendars.push({
        key: cal.key,
        name: cal.name,
        error: String(error?.message || error || "ukjent feil")
      });
    }
  }

  const filtered = arrFilterParsedEventWindow(
    arrDedupeParsed(all)
  );

  if (!filtered.length) {
    const details = failedCalendars.length
      ? ` Feilede kalendere: ${failedCalendars
          .map(x => `${x.name}: ${x.error}`)
          .join(" | ")}`
      : "";

    throw new Error(
      `OBS Bedehus: Google Calendar-feedene ga ingen kommende arrangementer.${details}`
    );
  }

  if (failedCalendars.length) {
    filtered._mergeOnly = true;
    filtered._importNote =
      "OBS Bedehus: delvis Google Calendar-import; eksisterende usette rader beholdes. " +
      "Feilet: " +
      failedCalendars.map(x => x.name).join(", ");
  }

  return filtered;
}

async function arrFetchAndParseBedehuskirken(url) {
  // V404: Bedehuskirken.
  //
  // Bedehuskirken bruker Cornerstone. Den offentlige kalenderen og forsiden
  // viser fortsatt "Kommende eventer", men fullkalender-tjenesten kan returnere
  // data som ikke gir noen arrangementer i vårt importvindu.
  //
  // Vi gjør derfor:
  //   1) prøv komplett Cornerstone-kalender,
  //   2) godta den bare dersom den faktisk inneholder arrangementer
  //      innen importvinduet,
  //   3) ellers bruk offentlig HTML som kontrollert merge-only fallback.
  //
  // Merge-only er viktig fordi HTML-listen bare viser et kort kommende-utdrag
  // og derfor aldri må få lov til å deaktivere eksisterende Bedehuskirken-rader.

  const calendarUrl = "https://bedehuskirken.no/kalender";
  const homeUrl = "https://bedehuskirken.no/";

  try {
    const result = await arrFetchCornerstoneCalendarService(
      calendarUrl,
      "bedehuskirken",
      "Bedehuskirken, Bryne"
    );

    const events = Array.isArray(result?.events) ? result.events : [];
    const inImportWindow = arrFilterParsedEventWindow(events);

    if (inImportWindow.length) {
      return events;
    }
  } catch (_) {
    // Fortsett til HTML-fallback.
  }

  const out = [];
  const seen = new Set();

  async function addEvent({
    title,
    year,
    month,
    day,
    hour,
    minute,
    endHour,
    endMinute,
    description,
    sourceUrl,
    eventNo
  }) {
    if (!title || !month) return;

    const startTime = arrOsloLocalIso(
      year,
      month,
      day,
      hour,
      minute,
      0
    );

    const endTime =
      Number.isFinite(endHour) &&
      Number.isFinite(endMinute)
        ? arrOsloLocalIso(
            year,
            month,
            day,
            endHour,
            endMinute,
            0
          )
        : null;

    const sourceEventId = eventNo
      ? `bedehuskirken-${eventNo}`
      : `bedehuskirken-html-${await arrStableKey(
          "SRC-0011",
          startTime,
          title
        )}`;

    if (seen.has(sourceEventId)) return;
    seen.add(sourceEventId);

    out.push({
      sourceEventId,
      title: arrClean(title),
      startTime,
      endTime,
      location: "Bedehuskirken, Bryne",
      description: arrClean(description || ""),
      sourceUrl: sourceUrl || calendarUrl
    });
  }

  async function parseHtmlPage(html, pageUrl) {
    // Først prøver vi event-lenker med eksplisitt Cornerstone-ID.
    const linkRe =
      /<a\b[^>]*href=["']([^"']*\/kalender\/arrangement\/calendar_event\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let m;

    while ((m = linkRe.exec(html)) !== null) {
      const eventNo = String(m[2] || "").trim();

      const label = arrClean(
        arrHtmlToLines(m[3]).replace(/\s+/g, " ")
      );

      const dm = label.match(
        /^(.+?)\s+(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s+(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember),?\s+(20\d{2})\s*(?:\|\s*)?(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(\d{1,2}):(\d{2}))?(?:\s+(.*))?$/i
      );

      if (!dm) continue;

      const month =
        ARR_NORWEGIAN_MONTHS[
          arrNormalize(dm[4])
        ];

      await addEvent({
        eventNo,
        title: dm[1],
        day: Number(dm[3]),
        month,
        year: Number(dm[5]),
        hour: Number(dm[6]),
        minute: Number(dm[7]),
        endHour: dm[8] ? Number(dm[8]) : NaN,
        endMinute: dm[9] ? Number(dm[9]) : NaN,
        description: dm[10] || "",
        sourceUrl: new URL(m[1], pageUrl).href
      });
    }

    // Deretter ren tekst fra "Kommende eventer".
    // Dagens side viser blant annet:
    // "Kveldsgudstjeneste søndag 9 august 2026 | 19:00"
    // "GN Fredag fredag 14 august 2026 | 20:00"
    const lines = arrHtmlToLines(html)
      .split("\n")
      .map(arrClean)
      .filter(Boolean);

    for (const line of lines) {
      const dm = line.match(
        /^(.+?)\s+(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s+(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember),?\s+(20\d{2})\s*(?:\|\s*)?(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(\d{1,2}):(\d{2}))?(?:\s+(.*))?$/i
      );

      if (!dm) continue;

      const month =
        ARR_NORWEGIAN_MONTHS[
          arrNormalize(dm[4])
        ];

      await addEvent({
        title: dm[1],
        day: Number(dm[3]),
        month,
        year: Number(dm[5]),
        hour: Number(dm[6]),
        minute: Number(dm[7]),
        endHour: dm[8] ? Number(dm[8]) : NaN,
        endMinute: dm[9] ? Number(dm[9]) : NaN,
        description: dm[10] || "",
        sourceUrl: pageUrl
      });
    }
  }

  for (const pageUrl of [calendarUrl, homeUrl]) {
    try {
      const html = await arrFetchText(pageUrl);
      await parseHtmlPage(html, pageUrl);
    } catch (_) {}
  }

  if (!out.length) {
    throw new Error(
      "Bedehuskirken-parser fant ingen arrangementer i offentlig HTML"
    );
  }

  const result = arrDedupeParsed(out);

  // Offentlig HTML viser bare et kort kommende-utdrag.
  // Oppdater/legg til det vi ser, men behold eksisterende usette rader.
  result._mergeOnly = true;
  result._importNote =
    "Bedehuskirken: offentlig Kommende eventer-fallback; eksisterende usette rader beholdes.";

  return result;
}

async function arrFetchAndParseKleppFrikirke(url) {
  // V403: Klepp Frikyrkje.
  //
  // Klepp bruker Cornerstone. Den offentlige forsiden viser fortsatt
  // "Komande hendingar", mens /kalender kan være tom i vanlig HTML.
  //
  // Vi gjør derfor:
  //   1) prøv komplett Cornerstone-kalender,
  //   2) godta den bare dersom den faktisk inneholder arrangementer
  //      innen importvinduet,
  //   3) ellers bruk forsiden som kontrollert merge-only fallback.
  //
  // Merge-only er viktig fordi forsiden bare viser et lite utsnitt og derfor
  // aldri må få lov til å deaktivere de eksisterende Klepp-radene i Baserow.

  const calendarUrl = "https://klepp.frikyrkja.no/kalender";
  const homeUrl = "https://klepp.frikyrkja.no/";

  try {
    const result = await arrFetchCornerstoneCalendarService(
      calendarUrl,
      "klepp-frikirke",
      "Klepp Frikyrkje, Kleppe"
    );

    const events = Array.isArray(result?.events) ? result.events : [];
    const inImportWindow = arrFilterParsedEventWindow(events);

    if (inImportWindow.length) {
      return events;
    }
  } catch (_) {
    // Fortsett til HTML-fallback.
  }

  const html = await arrFetchText(homeUrl);
  const out = [];
  const seen = new Set();

  async function addEvent({
    title,
    year,
    month,
    day,
    hour,
    minute,
    endHour,
    endMinute,
    description,
    sourceUrl,
    eventNo
  }) {
    if (!title || !month) return;

    const startTime = arrOsloLocalIso(
      year,
      month,
      day,
      hour,
      minute,
      0
    );

    const endTime =
      Number.isFinite(endHour) &&
      Number.isFinite(endMinute)
        ? arrOsloLocalIso(
            year,
            month,
            day,
            endHour,
            endMinute,
            0
          )
        : null;

    const sourceEventId = eventNo
      ? `klepp-frikirke-${eventNo}`
      : `klepp-frikirke-html-${await arrStableKey(
          "SRC-0014",
          startTime,
          title
        )}`;

    if (seen.has(sourceEventId)) return;
    seen.add(sourceEventId);

    out.push({
      sourceEventId,
      title: arrClean(title),
      startTime,
      endTime,
      location: "Klepp Frikyrkje, Kleppe",
      description: arrClean(description || ""),
      sourceUrl: sourceUrl || homeUrl
    });
  }

  // Først prøver vi event-lenker med eksplisitt Cornerstone-ID.
  const linkRe =
    /<a\b[^>]*href=["']([^"']*\/kalender\/kalender-detalj\/calendar_event\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let m;

  while ((m = linkRe.exec(html)) !== null) {
    const eventNo = String(m[2] || "").trim();

    const label = arrClean(
      arrHtmlToLines(m[3]).replace(/\s+/g, " ")
    );

    const dm = label.match(
      /^(.+?)\s+(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s+(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember),?\s+(20\d{2})\s*(?:\|\s*)?(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(\d{1,2}):(\d{2}))?(?:\s+(.*))?$/i
    );

    if (!dm) continue;

    const month =
      ARR_NORWEGIAN_MONTHS[
        arrNormalize(dm[4])
      ];

    await addEvent({
      eventNo,
      title: dm[1],
      day: Number(dm[3]),
      month,
      year: Number(dm[5]),
      hour: Number(dm[6]),
      minute: Number(dm[7]),
      endHour: dm[8] ? Number(dm[8]) : NaN,
      endMinute: dm[9] ? Number(dm[9]) : NaN,
      description: dm[10] || "",
      sourceUrl: new URL(m[1], homeUrl).href
    });
  }

  // Deretter ren tekst fra "Komande hendingar".
  // Eksempel på dagens side:
  // "Kveldsmøte søndag 9 august 2026| 19:00"
  const lines = arrHtmlToLines(html)
    .split("\n")
    .map(arrClean)
    .filter(Boolean);

  for (const line of lines) {
    const dm = line.match(
      /^(.+?)\s+(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s+(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember),?\s+(20\d{2})\s*(?:\|\s*)?(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(\d{1,2}):(\d{2}))?(?:\s+(.*))?$/i
    );

    if (!dm) continue;

    const month =
      ARR_NORWEGIAN_MONTHS[
        arrNormalize(dm[4])
      ];

    await addEvent({
      title: dm[1],
      day: Number(dm[3]),
      month,
      year: Number(dm[5]),
      hour: Number(dm[6]),
      minute: Number(dm[7]),
      endHour: dm[8] ? Number(dm[8]) : NaN,
      endMinute: dm[9] ? Number(dm[9]) : NaN,
      description: dm[10] || "",
      sourceUrl: homeUrl
    });
  }

  if (!out.length) {
    throw new Error(
      "Klepp Frikyrkje-parser fant ingen arrangementer på forsiden"
    );
  }

  const result = arrDedupeParsed(out);

  // Forsiden viser bare kommende utdrag. Oppdater/legg til det vi ser,
  // men behold alle eksisterende usette Klepp-rader.
  result._mergeOnly = true;
  result._importNote =
    "Klepp Frikyrkje: offentlig Komande hendingar-fallback; eksisterende usette rader beholdes.";

  return result;
}

async function arrFetchAndParseBryneFrikirke(url) {
  // V401: Bryne Frikyrkje.
  //
  // Rotårsak 19.08.2026:
  // Cornerstone events_service som tidligere ga hele kalenderen returnerer ikke
  // lenger brukbare event-data. Den offentlige forsiden viser derimot fortsatt
  // "Kommende hendelser". Vi bruker derfor:
  //   1) events_service dersom den igjen virker,
  //   2) offentlig HTML som kontrollert fallback.
  //
  // Fallbacken merkes som merge-only slik at en kort "Kommende hendelser"-liste
  // ALDRI kan deaktivere de mange eksisterende Bryne-radene i Baserow.
  const serviceBase = "https://brynefrikyrkje.no/_service/397657/events_service";
  const detailRoute = "L2thbGVuZGVyL2thbGVuZGVyLWRldGFsaS9jYWxlbmRhcl9ldmVudC86aWQ%3D";
  const viewId = "4306263";

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 14);
  rangeStart.setHours(0,0,0,0);

  const rangeEnd = new Date(rangeStart);
  rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }

  const rangeVariants = [
    [String(rangeStart.getTime()), String(rangeEnd.getTime())],
    [String(Math.floor(rangeStart.getTime()/1000)), String(Math.floor(rangeEnd.getTime()/1000))],
    [ymd(rangeStart), ymd(rangeEnd)],
    [rangeStart.toISOString(), rangeEnd.toISOString()],
  ];

  function parseServiceDate(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") {
      const n = value < 100000000000 ? value * 1000 : value;
      const d = new Date(n);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    const s = String(value).trim();
    const dotNet = s.match(/^\/Date\((\d+)(?:[+-]\d+)?\)\/$/);
    if (dotNet) {
      const d = new Date(Number(dotNet[1]));
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (/^\d{10,13}$/.test(s)) {
      let n = Number(s);
      if (s.length === 10) n *= 1000;
      const d = new Date(n);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  function normalizeServicePayload(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    for (const key of ["events","results","data","items","calendar"]) {
      if (Array.isArray(data[key])) return data[key];
    }
    return [];
  }

  for (const [startValue,endValue] of rangeVariants) {
    const serviceUrl =
      `${serviceBase}/start/${encodeURIComponent(startValue)}` +
      `/end/${encodeURIComponent(endValue)}` +
      `/url/${detailRoute}/view_id/${viewId}`;

    try {
      const responseText = await arrFetchText(serviceUrl);
      let data;
      try {
        data = JSON.parse(responseText);
        if (typeof data === "string") data = JSON.parse(data);
      } catch (_) {
        data = null;
      }

      const items = normalizeServicePayload(data);
      if (!items.length) continue;

      const out = [];
      for (const item of items) {
        const title = arrClean(item.title || item.name || item.summary || "");
        const startTime = parseServiceDate(item.start || item.startTime || item.start_time || item.dateStart);
        if (!title || !startTime) continue;

        const endTime = parseServiceDate(item.end || item.endTime || item.end_time || item.dateEnd);
        const rawUrl = arrClean(item.url || item.href || item.link || "");
        const id = String(item.id || item.event_id || item.eventId || "").trim();
        const sourceEventId = id
          ? `bryne-${id}`
          : `bryne-service-${await arrStableKey("SRC-0008",startTime,title)}`;

        out.push({
          sourceEventId,
          title,
          startTime,
          endTime,
          location:arrClean(item.location || "Bryne Frikyrkje"),
          description:arrClean(item.description || item.details || ""),
          sourceUrl:rawUrl
            ? new URL(rawUrl, "https://brynefrikyrkje.no/").href
            : "https://brynefrikyrkje.no/kalender",
        });
      }

      if (out.length) {
        const deduped = arrDedupeParsed(out);

        // Cornerstone-endepunktet kan returnere data som finnes teknisk,
        // men som bare består av gamle/historiske arrangementer.
        // Da må vi IKKE godta dette som en vellykket fullkalender-import,
        // fordi det senere tidsfilteret ellers gir 0 og utløser kildevernet.
        // Fortsett i stedet til HTML-fallbacken nedenfor.
        const inImportWindow = arrFilterParsedEventWindow(deduped);
        if (inImportWindow.length) {
          return deduped;
        }
      }
    } catch (_) {}
  }

  // Offentlig HTML-fallback.
  // Nettsiden viser poster som:
  // "Gudstjeneste - ... søndag 2 august 2026| 11:00 Beskrivelse ..."
  // Gammel parser krevde slutt rett etter klokkeslett og fant derfor 0.
  const urls = [
    "https://brynefrikyrkje.no/",
    "https://brynefrikyrkje.no/kalender/kalender-detalj/calendar_event/frikirken.no",
  ];

  const out = [];
  const seen = new Set();

  async function addParsedEvent({title,year,month,day,hour,minute,endHour,endMinute,description,sourceUrl,eventNo}) {
    if (!title || !month) return;

    const startTime = arrOsloLocalIso(year,month,day,hour,minute,0);
    const endTime = Number.isFinite(endHour) && Number.isFinite(endMinute)
      ? arrOsloLocalIso(year,month,day,endHour,endMinute,0)
      : null;

    const sourceEventId = eventNo
      ? `bryne-${eventNo}`
      : `bryne-html-${await arrStableKey("SRC-0008",startTime,title)}`;

    if (seen.has(sourceEventId)) return;
    seen.add(sourceEventId);

    out.push({
      sourceEventId,
      title:arrClean(title),
      startTime,
      endTime,
      location:"Bryne Frikyrkje",
      description:arrClean(description || ""),
      sourceUrl:sourceUrl || "https://brynefrikyrkje.no/",
    });
  }

  async function addFromHtml(html, sourcePageUrl) {
    const linkRe = /<a\b[^>]*href=["']([^"']*\/kalender\/kalender-detalj\/calendar_event\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      const eventNo = String(m[2] || "").trim();
      const label = arrClean(arrHtmlToLines(m[3]).replace(/\s+/g," "));
      const dm = label.match(/^(.+?)\s+(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s+(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember),?\s+(20\d{2})\s*(?:\|\s*)?(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(\d{1,2}):(\d{2}))?(?:\s+(.*))?$/i);
      if (!dm) continue;

      const month = ARR_NORWEGIAN_MONTHS[arrNormalize(dm[4])];
      await addParsedEvent({
        eventNo,
        title:dm[1],
        day:Number(dm[3]),
        month,
        year:Number(dm[5]),
        hour:Number(dm[6]),
        minute:Number(dm[7]),
        endHour:dm[8] ? Number(dm[8]) : NaN,
        endMinute:dm[9] ? Number(dm[9]) : NaN,
        description:dm[10] || "",
        sourceUrl:`https://brynefrikyrkje.no/kalender/kalender-detalj/calendar_event/${eventNo}`,
      });
    }

    const lines = arrHtmlToLines(html).split("\n").map(arrClean).filter(Boolean);
    for (const line of lines) {
      const dm = line.match(/^(.+?)\s+(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s+(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember),?\s+(20\d{2})\s*(?:\|\s*)?(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(\d{1,2}):(\d{2}))?(?:\s+(.*))?$/i);
      if (!dm) continue;

      const month = ARR_NORWEGIAN_MONTHS[arrNormalize(dm[4])];
      await addParsedEvent({
        title:dm[1],
        day:Number(dm[3]),
        month,
        year:Number(dm[5]),
        hour:Number(dm[6]),
        minute:Number(dm[7]),
        endHour:dm[8] ? Number(dm[8]) : NaN,
        endMinute:dm[9] ? Number(dm[9]) : NaN,
        description:dm[10] || "",
        sourceUrl:sourcePageUrl,
      });
    }
  }

  for (const sourcePageUrl of urls) {
    try {
      const html = await arrFetchText(sourcePageUrl);
      await addFromHtml(html, sourcePageUrl);
    } catch (_) {}
  }

  if (!out.length) {
    throw new Error("Bryne Frikyrkje-parser fant ingen arrangementer");
  }

  const result = arrDedupeParsed(out);
  result._mergeOnly = true;
  result._importNote = "Bryne Frikyrkje: offentlig Kommende hendelser-fallback; eksisterende usette rader beholdes.";
  return result;
}

function arrCsvRows(csv) {
  const rows=[]; let row=[],cell="",quoted=false;
  csv=String(csv||"").replace(/^\uFEFF/,"");
  for(let i=0;i<csv.length;i++){
    const ch=csv[i];
    if(quoted){
      if(ch==='"' && csv[i+1]==='"'){cell+='"';i++;}
      else if(ch==='"')quoted=false;
      else cell+=ch;
    } else {
      if(ch==='"')quoted=true;
      else if(ch===','){row.push(cell);cell="";}
      else if(ch==='\n'){row.push(cell.replace(/\r$/,""));rows.push(row);row=[];cell="";}
      else cell+=ch;
    }
  }
  if(cell.length||row.length){row.push(cell.replace(/\r$/,""));rows.push(row);}
  return rows;
}

function arrEbeneserClock(value) {
  const s=arrClean(value||"").replace(/\s+/g,"").replace(/^kl\.?/i,"");
  if(!s)return null;
  const parts=s.split(/[–—-]/);
  const one=v=>{
    let m=String(v||"").match(/^(\d{1,2})[:.](\d{2})$/);
    if(m)return {h:Number(m[1]),min:Number(m[2])};
    m=String(v||"").match(/^(\d{3,4})$/);
    if(m){
      const d=m[1].padStart(4,"0");
      return {h:Number(d.slice(0,2)),min:Number(d.slice(2))};
    }
    m=String(v||"").match(/^(\d{1,2})$/);
    return m?{h:Number(m[1]),min:0}:null;
  };
  const start=one(parts[0]);
  const end=parts[1]?one(parts[1]):null;
  if(!start || start.h>23 || start.min>59)return null;
  return {start,end:end&&end.h<=23&&end.min<=59?end:null};
}

function arrEbeneserInferMonth(rows, header, dateCol, year) {
  const weekdayMap={"søn":0,"son":0,"man":1,"tir":2,"ons":3,"tor":4,"fre":5,"lør":6,"lor":6};
  const samples=[];
  for(let r=header+1;r<rows.length;r++){
    const dayMatch=arrClean(rows[r][dateCol]||"").match(/(\d{1,2})/);
    if(!dayMatch)continue;
    const wd=weekdayMap[arrNormalize(rows[r][Math.max(0,dateCol-1)]||"").slice(0,3)];
    if(wd===undefined)continue;
    samples.push({day:Number(dayMatch[1]),wd});
  }
  let bestMonth=null,bestScore=-1,bestValid=-1;
  for(let m=1;m<=12;m++){
    let score=0,valid=0;
    for(const s of samples){
      const dt=new Date(Date.UTC(year,m-1,s.day));
      if(dt.getUTCMonth()!==m-1)continue;
      valid++;
      if(dt.getUTCDay()===s.wd)score++;
    }
    if(score>bestScore || (score===bestScore && valid>bestValid)){
      bestMonth=m;bestScore=score;bestValid=valid;
    }
  }
  return samples.length && bestScore >= Math.max(3,Math.floor(samples.length*0.75))
    ? bestMonth : null;
}

async function arrDiscoverEbeneserGids() {
  const id="1B7KHSH0YT9oY5LRNI0zBmSZhfHVr1ZLVk6fuoOtnVSc";
  const urls=[
    `https://docs.google.com/spreadsheets/d/${id}/htmlview`,
    `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`
  ];
  const gids=new Set(["0"]);
  const diagnostics=[];

  for(const u of urls){
    try{
      const html=await arrFetchText(u);
      const found=[...html.matchAll(/(?:[?&#]|\\u0026)gid(?:=|%3D)(\d+)/gi)].map(m=>m[1]);
      found.forEach(g=>gids.add(g));
      diagnostics.push({url:u,htmlLength:html.length,gids:[...new Set(found)].slice(0,100)});
    }catch(error){
      diagnostics.push({url:u,error:String(error?.message||error)});
    }
  }
  return {gids:[...gids],diagnostics};
}

async function arrParseEbeneserGid(gid) {
  const id="1B7KHSH0YT9oY5LRNI0zBmSZhfHVr1ZLVk6fuoOtnVSc";
  const csv=await arrFetchText(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`);
  const rows=arrCsvRows(csv);

  let header=-1,dateCol=-1,timeCol=-1,activityCol=-1,year=2026;
  for(let r=0;r<Math.min(rows.length,25);r++){
    const n=rows[r].map(arrNormalize);
    const d=n.indexOf("dato");
    const k=n.findIndex(v=>v==="kl"||v==="kl.");
    const a=n.indexOf("aktivitet");
    if(d>=0&&k>=0&&a>=0){
      header=r;dateCol=d;timeCol=k;activityCol=a;
      const ym=rows[r].join(" ").match(/\b(20\d{2})\b/);
      if(ym)year=Number(ym[1]);
      break;
    }
  }
  if(header<0)return {gid,rows,month:null,events:[]};

  const month=arrEbeneserInferMonth(rows,header,dateCol,year);
  if(!month)return {gid,rows,month:null,events:[]};

  const events=[];
  for(let r=header+1;r<rows.length;r++){
    const row=rows[r];
    const dm=arrClean(row[dateCol]||"").match(/(\d{1,2})/);
    const title=arrClean(row[activityCol]||"");
    const time=arrEbeneserClock(row[timeCol]||"");
    if(!dm||!title||!time)continue;
    if(/^(utleie|reservert|privat)\b/i.test(arrNormalize(title)))continue;

    const day=Number(dm[1]);
    const startTime=arrOsloLocalIso(year,month,day,time.start.h,time.start.min,0);
    const endTime=time.end?arrOsloLocalIso(year,month,day,time.end.h,time.end.min,0):null;
    events.push({
      sourceEventId:`ebeneser-${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}-${String(time.start.h).padStart(2,"0")}${String(time.start.min).padStart(2,"0")}-${arrNormalize(title).replace(/[^a-z0-9æøå]+/g,"-").replace(/^-|-$/g,"").slice(0,60)}`,
      title,startTime,endTime,
      location:"Ebeneser Misjonsforsamling, Sandnes",
      sourceUrl:"https://www.ebeneser.no/program"
    });
  }
  return {gid,rows,month,events};
}

async function arrFetchAndParseEbeneser() {
  const discovered=await arrDiscoverEbeneserGids();
  const out=[];
  for(const gid of discovered.gids){
    try{out.push(...(await arrParseEbeneserGid(gid)).events);}catch(_){}
  }
  const floor=Date.now()-86400000;
  const events=arrDedupeParsed(out).filter(e=>{
    const t=new Date(e.startTime).getTime();
    return Number.isNaN(t)||t>=floor;
  });
  if(!events.length){
    throw new Error(`Ebeneser-parser fant ingen framtidige arrangementer. Oppdaget GID: ${discovered.gids.join(",")}`);
  }
  return events;
}


async function arrFetchAndParseFredheimArena(url) {
  // Fredheim Arena publiserer arrangementer på /hva-skjer og egne /event/...-sider.
  // Parseren leser arrangementskortene direkte fra HTML og er bevisst tolerant for
  // både norsk datoformat og CMS-formatet som brukes på detaljsidene.
  const pages = [
    "https://fredheimarena.no/hva-skjer",
    "https://www.fredheimarena.no/hva-skjer",
    "https://fredheimarena.no/",
  ];
  const out = [];
  const seen = new Set();

  function parseDateText(text) {
    const clean = arrClean(String(text || "").replace(/\s+/g," "));
    let m = clean.match(/(?:Starter:?\s*)?(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\s+(\d{1,2}):(\d{2})/i);
    if (m) {
      let year = Number(m[3]); if (year < 100) year += 2000;
      return {start:arrOsloLocalIso(year,Number(m[2]),Number(m[1]),Number(m[4]),Number(m[5]),0)};
    }
    m = clean.match(/(?:Starter:?\s*)?(Jan(?:uar)?|Feb(?:ruar)?|Mar(?:s)?|Apr(?:il)?|Mai|May|Jun(?:i|e)?|Jul(?:i|y)?|Aug(?:ust)?|Sep(?:tember)?|Okt(?:ober)?|Oct(?:ober)?|Nov(?:ember)?|Des(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d{2})[^0-9]+(\d{1,2}):(\d{2})/i);
    if (m) {
      const monthMap={jan:1,januar:1,feb:2,februar:2,mar:3,mars:3,apr:4,april:4,mai:5,may:5,jun:6,juni:6,june:6,jul:7,juli:7,july:7,aug:8,august:8,sep:9,september:9,okt:10,oktober:10,oct:10,october:10,nov:11,november:11,des:12,desember:12,dec:12,december:12};
      const key=arrNormalize(m[1]).replace(/[^a-zæøå]/g,"");
      const mo=monthMap[key] || monthMap[key.slice(0,3)];
      if (mo) return {start:arrOsloLocalIso(Number(m[3]),mo,Number(m[2]),Number(m[4]),Number(m[5]),0)};
    }
    m = clean.match(/(?:mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)?\s*(\d{1,2})\.?\s+(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember),?\s+(20\d{2})[^0-9]+(\d{1,2}):(\d{2})/i);
    if (m) {
      const mo=ARR_NORWEGIAN_MONTHS[arrNormalize(m[2])];
      if (mo) return {start:arrOsloLocalIso(Number(m[3]),mo,Number(m[1]),Number(m[4]),Number(m[5]),0)};
    }
    return null;
  }

  function addEvent(slug, title, context, sourcePage) {
    slug=String(slug||"").replace(/^\/+|\/+$/g,"");
    title=arrClean(title || "");
    if (!slug || !title) return;
    const key=`fredheim-${slug}`;
    if (seen.has(key)) return;
    const parsed=parseDateText(context);
    if (!parsed?.start) return;

    let endTime=null;
    const endMatch=String(context||"").match(/Slutter:?\s*(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\s+(\d{1,2}):(\d{2})/i);
    if (endMatch) {
      let y=Number(endMatch[3]); if (y<100) y+=2000;
      endTime=arrOsloLocalIso(y,Number(endMatch[2]),Number(endMatch[1]),Number(endMatch[4]),Number(endMatch[5]),0);
    }

    seen.add(key);
    out.push({
      sourceEventId:key,
      title,
      startTime:parsed.start,
      endTime,
      location:"Fredheim Arena, Sandnes",
      description:"",
      sourceUrl:`https://fredheimarena.no/event/${slug}`,
    });
  }

  for (const pageUrl of pages) {
    let html;
    try { html=await arrFetchText(pageUrl); } catch (_) { continue; }

    // Finn alle lenker til /event/... og bruk teksten rundt lenken som datokontekst.
    const linkRe=/<a\b[^>]*href=["'](?:https?:\/\/[^"']+)?\/event\/([^"'?#]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m=linkRe.exec(html))!==null) {
      const slug=arrClean(m[1]);
      const label=arrClean(arrHtmlToLines(m[2]).replace(/\s+/g," "));
      const start=Math.max(0,m.index-1800), end=Math.min(html.length,linkRe.lastIndex+1800);
      const context=arrHtmlToLines(html.slice(start,end)).replace(/\s+/g," ");
      let title=label;
      if (!title || /^(les mer|read more|se arrangement|vis arrangement)$/i.test(title)) {
        const lines=arrHtmlToLines(html.slice(start,end)).split("\n").map(arrClean).filter(Boolean);
        title=lines.find(x => x.length<180 && !/^(starter|slutter|les mer|read more|\d{1,2}[:.])/i.test(x)) || slug.replace(/-/g," ");
      }
      addEvent(slug,title,context,pageUrl);
    }

    // Enkel tekstfallback hvis CMS-et endrer anchor-markup, men fortsatt skriver
    // arrangementer med /event/<slug> i HTML eller JSON.
    const rawUrls=[...html.matchAll(/(?:https?:\\?\/\\?\/[^"'<> ]+)?\\?\/event\\?\/([a-z0-9æøå_-]+)/gi)];
    for (const rm of rawUrls) {
      const slug=String(rm[1]||"").replace(/\\/g,"");
      if (!slug || seen.has(`fredheim-${slug}`)) continue;
      const start=Math.max(0,rm.index-2200), end=Math.min(html.length,rm.index+2200);
      const context=arrHtmlToLines(html.slice(start,end)).replace(/\s+/g," ");
      const lines=arrHtmlToLines(html.slice(start,end)).split("\n").map(arrClean).filter(Boolean);
      const title=lines.find(x=>x.length>2 && x.length<160 && !/^(starter|slutter|hva skjer|fredheim arena)$/i.test(x));
      addEvent(slug,title,context,pageUrl);
    }
  }

  const deduped=arrDedupeParsed(out);
  if (!deduped.length) throw new Error("Fredheim Arena-parser fant ingen arrangementer");
  return deduped;
}

async function arrFetchVarhaugText(url) {
  const r = await fetch(url,{
    headers:{
      "User-Agent":"Kvimarka92-Arrangementskalender/1.0",
      "Accept":"text/html,text/plain;q=0.9,*/*;q=0.5"
    }
  });
  if (!r.ok) throw new Error(`Kilde svarte HTTP ${r.status}: ${url}`);

  const bytes = await r.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(bytes);

  // Varhaug-siden har historisk gitt replacement-tegn ved vanlig UTF-8-dekoding.
  // Hvis det skjer, prøv Windows-1252/Latin-1 før vi faller tilbake til UTF-8.
  if (utf8.includes("\uFFFD")) {
    for (const enc of ["windows-1252","iso-8859-1"]) {
      try {
        const candidate = new TextDecoder(enc).decode(bytes);
        const badUtf8 = (utf8.match(/\uFFFD/g) || []).length;
        const badCandidate = (candidate.match(/\uFFFD/g) || []).length;
        if (badCandidate < badUtf8) return candidate;
      } catch (_) {}
    }
  }
  return utf8;
}

function arrFixVarhaugText(value) {
  let s = arrClean(value || "");
  if (!s) return "";

  // Sikkerhetsnett for gamle/ufullstendig deklarerte tegnsett.
  const replacements = [
    [/M\uFFFDte/g,"Møte"], [/m\uFFFDte/g,"møte"],
    [/M\uFFFDtesal/g,"Møtesal"], [/m\uFFFDtesal/g,"møtesal"],
    [/Kj\uFFFDkken/g,"Kjøkken"], [/kj\uFFFDkken/g,"kjøkken"],
    [/H\uFFFDgtid/g,"Høgtid"], [/\uFFFDrsf/g,"Årsf"],
    [/\uFFFDrsm/g,"Årsm"], [/\uFFFDving/g,"Øving"]
  ];
  for (const [re,to] of replacements) s = s.replace(re,to);
  return s;
}

function arrVarhaugCanonicalTitle(value) {
  let s = arrNormalize(arrFixVarhaugText(value))
    .replace(/[«»“”„"'`´]/g," ")
    .replace(/\bs\s*u\s*n\s*d\s*a\s*g\b/g,"sundag")
    .replace(/\bgudstjeneste\b/g,"gudsteneste")
    .replace(/\bsemesterstart\b/g," ")
    .replace(/\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/g," ")
    .replace(/\b\d{1,2}\.?\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\b/g," ")
    .replace(/[^a-z0-9æøå]+/g," ")
    .replace(/\s+/g," ")
    .trim();

  return s;
}

function arrVarhaugSemanticKey(title,startTime) {
  const start = arrIsoOrNull(startTime);
  const titleKey = arrVarhaugCanonicalTitle(title);
  return start && titleKey ? `${start}|${titleKey}` : "";
}

function arrVarhaugSameEvent(a,b) {
  if (arrIsoOrNull(a?.startTime) !== arrIsoOrNull(b?.startTime)) return false;
  const aa = arrVarhaugCanonicalTitle(a?.title);
  const bb = arrVarhaugCanonicalTitle(b?.title);
  if (!aa || !bb) return false;
  return aa === bb || (Math.min(aa.length,bb.length) >= 6 && (aa.includes(bb) || bb.includes(aa)));
}

function arrIsVarhaugSource(source) {
  const sourceId = arrClean(source?.[ARR_F.sources.sourceId] || "");
  const name = arrNormalize(source?.[ARR_F.sources.name] || "");
  return sourceId === "SRC-0006" || name === arrNormalize("Varhaug Misjonshus");
}

async function arrFetchAndParseVarhaug(url) {
  // V334:
  // - årsplanen er autoritativ langtidskilde
  // - forsiden er kun supplement for nye/endret publisering
  // - korrekt tegnsett forsøkes før parsering
  // - samme møte fra årsplan + forside dedupliseres semantisk
  const primary = [];
  const supplement = [];
  const year = 2026;
  const longTermUrl = "https://www.varhaug-misjonshus.no/2026singl.html";

  function stripCell(html) {
    return arrFixVarhaugText(arrHtmlToLines(String(html || "")).replace(/\s+/g," "));
  }

  function parseClock(raw) {
    const s = arrClean(raw || "").toLowerCase().replace(/\s+/g,"");
    if (!s || /^(kveld|dagtid|til\d+)/i.test(s)) return null;
    let m = s.match(/^(\d{1,2})[:.]?(\d{2})?(?:[–—-](\d{1,2})[:.]?(\d{2})?)?$/);
    if (!m) return null;
    const sh = Number(m[1]), sm = Number(m[2] || 0);
    const eh = m[3] ? Number(m[3]) : null, em = m[3] ? Number(m[4] || 0) : null;
    if (sh > 23 || sm > 59 || (eh !== null && (eh > 23 || em > 59))) return null;
    return {sh,sm,eh,em};
  }

  function parseDateSpec(raw) {
    const s = arrClean(raw || "").replace(/\s+/g,"");
    let m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (m) return [{day:Number(m[1]),month:Number(m[2])}];

    m = s.match(/^(\d{1,2})-(\d{1,2})\/(\d{1,2})$/);
    if (m) {
      const d1=Number(m[1]), d2=Number(m[2]), month=Number(m[3]);
      const result=[];
      for (let d=d1; d<=d2 && d-d1<14; d++) result.push({day:d,month});
      return result;
    }

    m = s.match(/^(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{1,2})$/);
    if (m) {
      const d1=Number(m[1]), m1=Number(m[2]), d2=Number(m[3]), m2=Number(m[4]);
      const result=[];
      const start=new Date(Date.UTC(year,m1-1,d1));
      const end=new Date(Date.UTC(year,m2-1,d2));
      for (let d=new Date(start), guard=0; d<=end && guard<14; d.setUTCDate(d.getUTCDate()+1),guard++) {
        result.push({day:d.getUTCDate(),month:d.getUTCMonth()+1});
      }
      return result;
    }
    return [];
  }

  function rowLooksPublic(title, subOrganizer) {
    const t = arrNormalize(title);
    const o = arrNormalize(subOrganizer);
    if (!t) return false;
    if (/\b(styremøte|konfirmantundervisning|pynt til|begravelse|privat|utleie)\b/.test(t)) return false;
    if (o === ">>>" && !/\b(møte|møteveke|lys over land|basar|gudstjeneste|gudsteneste|samling)\b/.test(t)) return false;
    return true;
  }

  try {
    const html = await arrFetchVarhaugText(longTermUrl);
    const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let tr;
    while ((tr = trRe.exec(html)) !== null) {
      const cells = [];
      const tdRe = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let td;
      while ((td = tdRe.exec(tr[1])) !== null) cells.push(stripCell(td[1]));
      if (cells.length < 5) continue;

      const dateText = cells[1] || "";
      const subOrganizer = arrFixVarhaugText(cells[2] || "");
      const title = arrFixVarhaugText(cells[3] || "");
      const timeText = cells[4] || "";
      const room = arrFixVarhaugText(cells[5] || "");

      const dates = parseDateSpec(dateText);
      const clock = parseClock(timeText);
      if (!dates.length || !clock || !rowLooksPublic(title, subOrganizer)) continue;

      for (const d of dates) {
        const startTime = arrOsloLocalIso(year,d.month,d.day,clock.sh,clock.sm,0);
        const endTime = clock.eh !== null
          ? arrOsloLocalIso(year,d.month,d.day,clock.eh,clock.em,0)
          : null;
        const canonical = arrVarhaugCanonicalTitle(title);
        primary.push({
          sourceEventId:`varhaug-${year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}-${String(clock.sh).padStart(2,"0")}${String(clock.sm).padStart(2,"0")}-${canonical.replace(/\s+/g,"-").slice(0,70)}`,
          title,
          startTime,
          endTime,
          location:"Varhaug Misjonshus",
          description:[subOrganizer && `Arrangør: ${subOrganizer}`, room && `Rom: ${room}`].filter(Boolean).join(". "),
          sourceUrl:longTermUrl,
        });
      }
    }
  } catch (_) {}

  try {
    const website = String(url || "https://www.varhaug-misjonshus.no/").trim();
    const html = await arrFetchVarhaugText(website);
    const lines = arrHtmlToLines(html).split("\n").map(x => arrFixVarhaugText(x)).filter(Boolean);
    let inUpcoming=false, pendingTitle=null;
    for (const line of lines) {
      if (/^kva skjer:?$/i.test(line)) { inUpcoming=true; pendingTitle=null; continue; }
      if (!inUpcoming) continue;
      if (/^(sentrum menighet|misjonshusbladet|log in|søk etter:|kategorier|arkiv)$/i.test(line)) break;

      const m=line.match(/^(\d{1,2})\.(\d{1,2})\.(20\d{2})\s+kl\.?\s*(\d{1,2})[:.](\d{2})(?:\s*[–—-]\s*(\d{1,2})[:.](\d{2}))?$/i);
      if (m && pendingTitle) {
        const item = {
          title:pendingTitle,
          startTime:arrOsloLocalIso(Number(m[3]),Number(m[2]),Number(m[1]),Number(m[4]),Number(m[5]),0),
          endTime:m[6] ? arrOsloLocalIso(Number(m[3]),Number(m[2]),Number(m[1]),Number(m[6]),Number(m[7]),0) : null,
          location:"Varhaug Misjonshus",
          sourceUrl:website,
        };

        // Årsplanen vinner dersom forsiden beskriver samme møte.
        if (!primary.some(p => arrVarhaugSameEvent(p,item))) supplement.push(item);
        pendingTitle=null;
        continue;
      }
      if (line.length<=220 && !/^\d/.test(line) && !/^©/.test(line)) pendingTitle=line;
    }
  } catch (_) {}

  // Dedupe også internt i hver del med Varhaug-nøkkelen, ikke bare rå tittel.
  const merged = [];
  const seen = new Set();
  for (const item of [...primary,...supplement]) {
    const key = arrVarhaugSemanticKey(item.title,item.startTime);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  if (!merged.length) throw new Error("Varhaug-parser fant ingen arrangementer");
  return merged;
}


function arrExtractJavascriptObjectAfterMarker(raw, markerText) {
  const source = String(raw || "");
  const markerIndex = source.indexOf(markerText);
  if (markerIndex < 0) return null;

  const start = source.indexOf("{", markerIndex + markerText.length);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let i=start; i<source.length; i++) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        inString = false;
        quote = "";
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  return null;
}

function arrStripHtmlInline(value) {
  return arrClean(
    arrDecodeEntities(
      String(value || "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function arrHaaOrganizerFromLocation(location) {
  const loc = arrClean(location || "");

  const church = loc.match(/^(.+?)\s+(?:kyrkje|kirke)(?:\s*,.*)?$/i);
  if (church && church[1]) {
    return `${arrClean(church[1])} sokn`;
  }

  if (/stokkalandsmarka/i.test(loc)) return "Ogna sokn";
  if (/vigrestad/i.test(loc)) return "Varhaug sokn";
  if (/nærbø/i.test(loc)) return "Nærbø sokn";
  if (/varhaug/i.test(loc)) return "Varhaug sokn";
  if (/ogna/i.test(loc)) return "Ogna sokn";

  return "Hå Kyrkjelege Fellesråd";
}

function arrHaaSettlementHintFromLocation(location) {
  const loc = arrClean(location || "");
  if (/nærbø/i.test(loc)) return "Nærbø";
  if (/varhaug/i.test(loc)) return "Varhaug";
  if (/vigrestad/i.test(loc)) return "Vigrestad";
  if (/ogna/i.test(loc)) return "Ogna";
  if (/brusand/i.test(loc)) return "Brusand";
  if (/sirevåg/i.test(loc)) return "Sirevåg";
  if (/stokkalandsmarka/i.test(loc)) return "Ogna";
  return "";
}

async function arrFetchAndParseHaaAgrando(url) {
  const calendarUrl = "https://haa.kyrkja.no/Kalender";
  const html = await arrFetchText(calendarUrl);

  // Agrando legger hele den ferdigrendrede kalenderen inn som JSON-data i
  // et inline script og kaller OutputCalendar(data,...,'Months').
  // Dermed trenger vi ikke simulere nettleseren eller bruke et skjult API.
  const objectText =
    arrExtractJavascriptObjectAfterMarker(html, "var data =") ||
    arrExtractJavascriptObjectAfterMarker(html, "var data=");

  if (!objectText) {
    throw new Error("Hå Agrando: fant ikke innebygd kalenderdata (var data)");
  }

  let data;
  try {
    data = JSON.parse(objectText);
  } catch (error) {
    throw new Error(`Hå Agrando: ugyldig kalender-JSON: ${String(error?.message || error)}`);
  }

  let calendarHtml = "";

  if (typeof data.Months === "string") {
    calendarHtml = data.Months;
  } else {
    // Gjør parseren robust dersom Agrando endrer property-navn.
    for (const value of Object.values(data || {})) {
      if (
        typeof value === "string" &&
        /calendar-(?:item|event|date)/i.test(value) &&
        /EventId=/i.test(value)
      ) {
        calendarHtml = value;
        break;
      }
    }
  }

  if (!calendarHtml) {
    throw new Error("Hå Agrando: fant ikke Months/kalender-HTML i dataobjektet");
  }

  const out = [];
  const now = new Date();
  let year = now.getFullYear();
  let previousMonth = null;

  // Del på hver datoblokk. Datoene står i kronologisk rekkefølge.
  const dateRe = /<div[^>]*class=["'][^"']*calendar-date[^"']*["'][^>]*>\s*(\d{1,2})\.(\d{1,2})\s*<\/div>/gi;
  const dateMatches = [...calendarHtml.matchAll(dateRe)];

  for (let i=0; i<dateMatches.length; i++) {
    const dm = dateMatches[i];
    const day = Number(dm[1]);
    const month = Number(dm[2]);

    if (previousMonth != null && month < previousMonth) {
      year += 1;
    }
    previousMonth = month;

    const blockStart = dm.index + dm[0].length;
    const blockEnd = i + 1 < dateMatches.length
      ? dateMatches[i + 1].index
      : calendarHtml.length;
    const block = calendarHtml.slice(blockStart, blockEnd);

    // Ett datofelt kan inneholde flere arrangementer.
    const eventRe = /<div[^>]*class=["'][^"']*\bevent\b[^"']*["'][^>]*>[\s\S]*?<div[^>]*class=["'][^"']*event-time[^"']*["'][^>]*>\s*(?:kl\.?\s*)?(\d{1,2})[.:](\d{2})(?:\s*[–—-]\s*(?:kl\.?\s*)?(\d{1,2})[.:](\d{2}))?\s*<\/div>[\s\S]*?<p[^>]*class=["'][^"']*info-text[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']*EventId=([^&"']+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<span[^>]*class=["'][^"']*calendar-label[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]*class=["'][^"']*calendar-location[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;

    for (const em of block.matchAll(eventRe)) {
      const startHour = Number(em[1]);
      const startMinute = Number(em[2]);
      const endHour = em[3] ? Number(em[3]) : null;
      const endMinute = em[4] ? Number(em[4]) : null;
      const relativeHref = arrDecodeEntities(em[5] || "");
      const eventId = arrClean(em[6] || "");
      const title = arrStripHtmlInline(em[7]);
      const category = arrStripHtmlInline(em[8]);
      const location = arrStripHtmlInline(em[9]);

      if (!title || !eventId) continue;

      const startTime = arrOsloLocalIso(year, month, day, startHour, startMinute, 0);
      const endTime = endHour != null
        ? arrOsloLocalIso(year, month, day, endHour, endMinute || 0, 0)
        : null;

      let sourceUrl = calendarUrl;
      try {
        sourceUrl = new URL(
          relativeHref.replace(/^CalendarPage/i, "/Kalenderdetaljer"),
          calendarUrl
        ).href;
      } catch (_) {}

      // Agrando gjenbruker samme EventId for flere forekomster av samme
      // aktivitet. Source Event ID må derfor være unik per forekomst.
      // Tidligere brukte vi bare haa-<EventId>; da overskrev senere datoer
      // tidligere datoer i Baserow (f.eks. Reload / Etter skoletid).
      const occurrenceKey = `${eventId}|${startTime}`;

      out.push({
        sourceEventId:`haa-${eventId}-${(await arrSha256(occurrenceKey)).slice(0,12)}`,
        title,
        startTime,
        endTime,
        organizer:arrHaaOrganizerFromLocation(location),
        location,
        description:"",
        sourceUrl,
        settlementHint:arrHaaSettlementHintFromLocation(location),
        municipalityHint:"Hå",
        meetingTypeHint:category
      });
    }
  }

  // Kun relevant tidsvindu; siden kan inneholde litt eldre/nyere data.
  const minTs = Date.now() - 7 * 86400000;
  const maxTs = Date.now() + 400 * 86400000;
  const filtered = out.filter(item => {
    const ts = new Date(item.startTime).getTime();
    return Number.isFinite(ts) && ts >= minTs && ts <= maxTs;
  });

  if (!filtered.length) {
    throw new Error(`Hå Agrando-parser fant ingen arrangementer (rå=${out.length})`);
  }

  return arrDedupeParsed(filtered);
}

async function arrFetchAndParseHaa(url) {
  const html = await arrFetchText(url);
  const lines = arrHtmlToLines(html).split("\n").map(arrClean).filter(Boolean);
  const out = [];
  let explicitYear = null;
  let currentDate = null;
  let currentTime = null;
  let pendingTitle = null;

  for (let i=0;i<lines.length;i++) {
    const line = lines[i];

    if (/^20\d{2}$/.test(line)) {
      explicitYear = Number(line);
      continue;
    }

    // Handles both "16.08" and lines containing weekday + date.
    const dm = line.match(/(?:^|\s)(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](20\d{2}))?(?:$|\s)/);
    if (dm) {
      const day = Number(dm[1]);
      const month = Number(dm[2]);
      let year = Number(dm[3] || explicitYear || new Date().getFullYear());
      if (!dm[3] && !explicitYear) {
        const now = new Date();
        const candidate = new Date(year,month-1,day,12,0,0);
        if (candidate.getTime() < now.getTime()-180*86400000) year += 1;
      }
      currentDate = {year,month,day};
    }

    const tm = line.match(/(?:kl\.?\s*)?(\d{1,2})[.:](\d{2})(?:\s*[–-]\s*(?:kl\.?\s*)?(\d{1,2})[.:](\d{2}))?/i);
    if (tm && currentDate) {
      currentTime = {h:Number(tm[1]),m:Number(tm[2]),eh:tm[3] ? Number(tm[3]) : null,em:tm[4] ? Number(tm[4]) : null};

      // Sometimes title/location are on the same line after the time.
      const tail = arrClean(line.slice((tm.index || 0) + tm[0].length).replace(/^[-–—:\s]+/,""));
      if (tail && !/^\d/.test(tail)) pendingTitle = tail;
      continue;
    }

    if (!currentDate || !currentTime) continue;

    if (!pendingTitle && arrLooksLikeHaaTitle(line)) {
      pendingTitle = line;
      continue;
    }

    if (pendingTitle && arrLooksLikeHaaLocation(line)) {
      const startTime = arrOsloLocalIso(currentDate.year,currentDate.month,currentDate.day,currentTime.h,currentTime.m,0);
      const endTime = currentTime.eh != null
        ? arrOsloLocalIso(currentDate.year,currentDate.month,currentDate.day,currentTime.eh,currentTime.em || 0,0)
        : null;
      out.push({
        title:pendingTitle,
        startTime,
        endTime,
        location:line,
        sourceUrl:url,
      });
      pendingTitle = null;
      currentTime = null;
      continue;
    }

    // If the next event starts without a separate location, keep it instead of losing it.
    if (pendingTitle && arrLooksLikeHaaTitle(line) && !arrLooksLikeHaaNavigation(line)) {
      const startTime = arrOsloLocalIso(currentDate.year,currentDate.month,currentDate.day,currentTime.h,currentTime.m,0);
      out.push({title:pendingTitle,startTime,location:"",sourceUrl:url});
      pendingTitle = line;
      currentTime = null;
    }
  }

  if (pendingTitle && currentDate && currentTime) {
    out.push({
      title:pendingTitle,
      startTime:arrOsloLocalIso(currentDate.year,currentDate.month,currentDate.day,currentTime.h,currentTime.m,0),
      location:"",
      sourceUrl:url,
    });
  }

  if (!out.length) throw new Error("Hå kyrkje-parser fant ingen arrangementer");
  return arrDedupeParsed(out);
}

function arrLooksLikeHaaLocation(line) {
  return /\b(kyrkje|kirke|kapell|kyrkjestove|menighetshus|bedehus)\b/i.test(line) && line.length <= 120;
}

function arrLooksLikeHaaNavigation(line) {
  return /^(dåp|vigsel|gravplass|kyrkjelydane|fellesrådet|kontakt|søk|logg inn|alt fellesrådet)$/i.test(arrClean(line));
}

function arrLooksLikeHaaTitle(line) {
  const text = arrClean(line);
  if (!text || text.length > 220) return false;
  if (arrLooksLikeHaaNavigation(text) || arrLooksLikeHaaLocation(text)) return false;
  if (/^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)$/i.test(text)) return false;
  if (/^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)$/i.test(text)) return false;
  if (/^20\d{2}$/.test(text) || /^\d{1,2}[.\/-]\d{1,2}/.test(text) || /^(?:kl\.?\s*)?\d{1,2}[.:]\d{2}/i.test(text)) return false;
  return true;
}

function arrParseNarboHtml(html, sourceUrl) {
  const lines = arrHtmlToLines(html).split("\n").map(arrClean).filter(Boolean);
  const out = [];

  const detailRe = /^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s*,?\s*(\d{1,2})\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\s+(20\d{2})\s+(\d{1,2}):(\d{2})(?:\s*[–—-]\s*(\d{1,2}):(\d{2}))?$/i;
  const dateHeadingRe = /^(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)\s*,?\s*\d{1,2}\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\s*(20\d{2})?$/i;
  const calendarJunkRe = /^(listevisning|kalendervisning|bruk kalendervisning for å se mer!?|man|tir|ons|tor|fre|lør|søn|august 20\d{2}|september 20\d{2}|oktober 20\d{2}|november 20\d{2}|desember 20\d{2})$/i;

  function titleCandidate(line) {
    const t = arrClean(line);
    if (!t) return false;
    if (arrLooksLikeNarboNoise(t)) return false;
    if (dateHeadingRe.test(t) || detailRe.test(t) || calendarJunkRe.test(t)) return false;
    if (/^[\d\s|•.-]+$/.test(t)) return false;
    if (t.length > 220) return false;
    return true;
  }

  for (let i=0; i<lines.length; i++) {
    const m = lines[i].match(detailRe);
    if (!m) continue;

    // Finn nærmeste meningsfulle tekstlinje før dato/tid-linjen.
    // På Nærbø-siden ligger det vanligvis:
    //   [datooverskrift] -> [arrangementstittel] -> [dato + klokkeslett]
    let title = "";
    for (let j=i-1; j>=0 && j>=i-8; j--) {
      if (titleCandidate(lines[j])) {
        title = lines[j];
        break;
      }
    }
    if (!title) continue;

    const month = ARR_NORWEGIAN_MONTHS[arrNormalize(m[3])];
    const year = Number(m[4]);
    const day = Number(m[2]);
    if (!month) continue;

    out.push({
      title,
      startTime:arrOsloLocalIso(year,month,day,Number(m[5]),Number(m[6]),0),
      endTime:m[7] ? arrOsloLocalIso(year,month,day,Number(m[7]),Number(m[8]),0) : null,
      location:"Nærbø bedehus",
      sourceUrl,
    });
  }

  return arrDedupeParsed(out);
}

async function arrFetchAndParseNarbo(url) {
  // V264: De samlede kalenderlistene er bevisst korte. Nærbø publiserer derimot
  // lange arrangementsserier på de enkelte aktivitetssidene. Vi bruker derfor:
  // - Møter-kalenderen
  // - Glad Sang (publisert langt inn i 2027)
  // - Kvisten barnelag (publisert langt inn i 2027)
  // og beholder den samlede aktivitetssiden som supplement.
  const urls = [
    "https://narbobedehus.no/calendar/moter/",
    "https://narbobedehus.no/glad-sang/",
    "https://narbobedehus.no/kvisten-barnelag/",
    "https://narbobedehus.no/barnelag-og-kor/",
  ];

  const out = [];
  for (const sourceUrl of urls) {
    try {
      const html = await arrFetchText(sourceUrl);
      out.push(...arrParseNarboHtml(html, sourceUrl));
    } catch (_) {}
  }

  const deduped = arrDedupeParsed(out);
  if (!deduped.length) throw new Error("Nærbø-parser fant ingen arrangementer");
  return deduped;
}

function arrLooksLikeNarboNoise(line) {
  return /^(alle arrangementer|kalendere?|møter|aktiviteter|kor og lag|publisert|stikkord:|i|av)$/i.test(arrClean(line)) || /^©/.test(line);
}

function arrHtmlToLines(html) {
  return arrDecodeEntities(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"\n")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"\n")
    .replace(/<br\s*\/?>/gi,"\n")
    .replace(/<\/p>|<\/li>|<\/div>|<\/h[1-6]>|<\/tr>/gi,"\n")
    .replace(/<[^>]+>/g," ")
    .replace(/\r/g,""))
    .split("\n").map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean).join("\n");
}

function arrDecodeEntities(s) {
  return s
    .replace(/&nbsp;|&#160;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&aring;/gi,"å").replace(/&oslash;/gi,"ø").replace(/&aelig;/gi,"æ")
    .replace(/&Aring;/g,"Å").replace(/&Oslash;/g,"Ø").replace(/&AElig;/g,"Æ")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
}

function arrDedupeParsed(rows) {
  const seen = new Set();
  return rows.filter(r => {
    const k = `${r.startTime}|${arrNormalize(r.title)}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

function arrClean(v) { return String(v ?? "").replace(/\s+/g," ").trim(); }
function arrNormalize(v) { return arrClean(v).toLocaleLowerCase("no"); }
function arrIsoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function arrIcalUnescape(v) {
  return String(v || "").replace(/\\n/gi,"\n").replace(/\\,/g,",").replace(/\\;/g,";").replace(/\\\\/g,"\\");
}

async function arrStableKey(sourceId, start, title) {
  return `${sourceId || "SRC"}:${(await arrSha256(`${start}|${arrNormalize(title)}`)).slice(0,24)}`;
}
async function arrSha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

function arrOsloLocalIso(year,month,day,hour=0,minute=0,second=0) {
  // Determine Europe/Oslo offset using Intl, including DST.
  const approx = new Date(Date.UTC(year,month-1,day,hour,minute,second));
  const parts = new Intl.DateTimeFormat("en-CA",{
    timeZone:"Europe/Oslo",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
  }).formatToParts(approx).reduce((o,p)=>(o[p.type]=p.value,o),{});
  const represented = Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));
  const offsetMinutes = Math.round((represented-approx.getTime())/60000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const off = `${sign}${String(Math.floor(abs/60)).padStart(2,"0")}:${String(abs%60).padStart(2,"0")}`;
  return `${String(year).padStart(4,"0")}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:${String(second).padStart(2,"0")}${off}`;
}


async function arrGetImportPlan(env) {
  const rows = await arrListAllRows(env, ARR_TABLE.SOURCES);

  return {
    sources:rows
      .filter(r => r[ARR_F.sources.enabled] !== false)
      .map(r => ({
        sourceId:arrClean(r[ARR_F.sources.sourceId] || ""),
        name:arrClean(r[ARR_F.sources.name] || "")
      }))
      .filter(r => r.sourceId)
  };
}

function arrVigrestadSemanticKey(title,startTime) {
  const normalizedTitle = arrNormalize(title || "");
  const iso = arrIsoOrNull(startTime);
  if (!normalizedTitle || !iso) return "";
  return `${iso}|${normalizedTitle}`;
}

async function arrRecoverVigrestadDuplicateRows(env) {
  const rows = await arrListRowsFilteredEqual(
    env,
    ARR_TABLE.EVENTS,
    ARR_F.events.organizer,
    "Vigrestad Misjonshus"
  );

  const byKey = new Map();
  for (const row of rows) {
    const key = arrVigrestadSemanticKey(
      row[ARR_F.events.title],
      row[ARR_F.events.startTime]
    );
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(row);
  }

  const reactivate = [];
  for (const items of byKey.values()) {
    const hasActive = items.some(r => r[ARR_F.events.active] !== false);
    if (!hasActive) continue;

    for (const row of items) {
      if (row[ARR_F.events.active] === false) {
        reactivate.push({
          id: row.id,
          [ARR_F.events.active]: true
        });
      }
    }
  }

  if (reactivate.length) {
    await arrUpdateRowsBatch(env, ARR_TABLE.EVENTS, reactivate);
  }

  return {
    ok:true,
    organizer:"Vigrestad Misjonshus",
    reactivated:reactivate.length
  };
}

async function arrDedupeExistingVigrestad(env) {
  const rows = await arrListRowsFilteredEqual(
    env,
    ARR_TABLE.EVENTS,
    ARR_F.events.organizer,
    "Vigrestad Misjonshus"
  );

  const groups = new Map();
  for (const row of rows) {
    if (row[ARR_F.events.active] === false) continue;

    const key = arrVigrestadSemanticKey(
      row[ARR_F.events.title],
      row[ARR_F.events.startTime]
    );
    if (!key) continue;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const updates = [];
  let duplicateGroups = 0;

  const score = row => {
    let n = 0;
    if (row[ARR_F.events.manuallyEdited] === true) n += 100000;
    if (arrClean(row[ARR_F.events.description] || "")) n += 100;
    if (arrClean(row[ARR_F.events.sourceUrl] || "")) n += 10;
    if (arrClean(row[ARR_F.events.location] || "")) n += 5;
    return n;
  };

  for (const items of groups.values()) {
    if (items.length < 2) continue;
    duplicateGroups++;

    const ordered = [...items].sort((a,b) => {
      const d = score(b) - score(a);
      return d || Number(a.id || 0) - Number(b.id || 0);
    });

    // Behold én keeper. Manuelt redigerte rader blir aldri deaktivert.
    const keeper = ordered[0];

    for (const row of ordered.slice(1)) {
      if (row[ARR_F.events.manuallyEdited] === true) continue;
      updates.push({
        id:row.id,
        [ARR_F.events.active]:false
      });
    }
  }

  if (updates.length) {
    await arrUpdateRowsBatch(env, ARR_TABLE.EVENTS, updates);
  }

  return {
    ok:true,
    organizer:"Vigrestad Misjonshus",
    duplicateGroups,
    deactivated:updates.length
  };
}







export {
  ARRANGEMENT_ENGINE_VERSION,
  ARR_AREAS,
  ARR_TABLE,
  ARR_F,
  arrUseArea,
  arrGetAreaConfig,
  arrApiBase,
  arrHeaders,
  arrListAllRows,
  arrUpdateRowsBatch,
  arrImportAllSources,
  arrDedupeExistingVigrestad,
  arrClean,
  arrNormalize,
  arrResolveHaaFellesraadOrganizer
};
