import fs from "node:fs/promises";

const API = process.env.BASEROW_API_BASE || "https://api.baserow.io";

const CFG = {
  default: {
    token: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
    tables: { events: 1137493, sources: 1137506 },
    fields: {
      events: { eventId: "field_10177330", title: "field_10177331", source: "field_10177399", active: "field_10177442" },
      sources: { sourceId: "field_10177445", name: "field_10177446", enabled: "field_10177499" }
    }
  },
  time: {
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_TIME || "",
    tables: { events: 1193653, sources: 1193657 },
    fields: {
      events: { eventId: "field_10794694", title: "field_10794696", source: "field_10794703", active: "field_10794707" },
      sources: { sourceId: "field_10794743", name: "field_10794745", enabled: "field_10794749" }
    }
  },
  klepp: {
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_KLEPP || "",
    tables: { events: 1193659, sources: 1193663 },
    fields: {
      events: { eventId: "field_10794765", title: "field_10794767", source: "field_10794774", active: "field_10794778" },
      sources: { sourceId: "field_10794804", name: "field_10794806", enabled: "field_10794810" }
    }
  }
};

function clean(v){ return String(v ?? "").trim(); }
function norm(v){ return clean(v).toLocaleLowerCase("nb-NO"); }

async function apiGet(path, token){
  const r = await fetch(`${API}${path}`, {headers:{Authorization:`Token ${token}`,Accept:"application/json"}});
  const text = await r.text();
  if(!r.ok) throw new Error(`${path} -> HTTP ${r.status}: ${text.slice(0,1500)}`);
  return text ? JSON.parse(text) : {};
}

async function listAllRows(tableId, token){
  const out=[];
  let page=1;
  while(true){
    const data=await apiGet(`/api/database/rows/table/${tableId}/?user_field_names=false&size=200&page=${page}`, token);
    out.push(...(data.results || []));
    if(!data.next) break;
    page += 1;
  }
  return out;
}

function makeSourceIdentitySets(events, sources, fields){
  const eventAnchors=new Set();
  for(const row of events){
    const s=norm(row[fields.events.source]);
    if(s) eventAnchors.add(s);
  }
  const ids=new Set();
  const names=new Set();
  const selectedSources=[];
  for(const row of sources){
    const id=norm(row[fields.sources.sourceId]);
    const name=norm(row[fields.sources.name]);
    if((id && eventAnchors.has(id)) || (name && eventAnchors.has(name))){
      if(id) ids.add(id);
      if(name) names.add(name);
      selectedSources.push({rowId:row.id, sourceId:clean(row[fields.sources.sourceId]), name:clean(row[fields.sources.name]), enabled:row[fields.sources.enabled] !== false});
    }
  }
  return {eventAnchors, ids, names, selectedSources};
}

function sourceMatches(raw, identities){
  const v=norm(raw);
  return Boolean(v && (identities.ids.has(v) || identities.names.has(v)));
}

function analyzeArea(areaKey, targetEvents, targetSources, defaultEvents, defaultSources){
  const target=CFG[areaKey];
  const identities=makeSourceIdentitySets(targetEvents, targetSources, target.fields);
  if(!targetEvents.length) throw new Error(`${areaKey}: målområdet har 0 Events. Dry-run avbrytes.`);
  if(!identities.eventAnchors.size) throw new Error(`${areaKey}: fant ingen Events.Source-ankere. Dry-run avbrytes.`);
  if(!identities.selectedSources.length) throw new Error(`${areaKey}: fant ingen Sources som matcher målområdets Events.Source.`);

  const oldSources=defaultSources.filter(row=>{
    const id=norm(row[CFG.default.fields.sources.sourceId]);
    const name=norm(row[CFG.default.fields.sources.name]);
    return (id && identities.ids.has(id)) || (name && identities.names.has(name));
  });
  const oldEvents=defaultEvents.filter(row=>sourceMatches(row[CFG.default.fields.events.source], identities));
  const activeOldEvents=oldEvents.filter(row=>row[CFG.default.fields.events.active] !== false);

  return {
    area: areaKey,
    target:{eventRows:targetEvents.length, sourceRowsTotal:targetSources.length, sourceAnchorsFromEvents:identities.eventAnchors.size, matchedSources:identities.selectedSources},
    deleteCandidateSummary:{sources:oldSources.length, events:oldEvents.length, activeEvents:activeOldEvents.length, rowsFreedIfDeleted:oldSources.length+oldEvents.length},
    deleteCandidates:{
      sources:oldSources.map(row=>({rowId:row.id, sourceId:clean(row[CFG.default.fields.sources.sourceId]), name:clean(row[CFG.default.fields.sources.name]), enabled:row[CFG.default.fields.sources.enabled] !== false})),
      events:oldEvents.map(row=>({rowId:row.id, eventId:clean(row[CFG.default.fields.events.eventId]), title:clean(row[CFG.default.fields.events.title]), source:clean(row[CFG.default.fields.events.source]), active:row[CFG.default.fields.events.active] !== false}))
    }
  };
}

for(const [key,cfg] of Object.entries(CFG)) if(!cfg.token) throw new Error(`Mangler token for ${key}`);

console.log("Leser felles/default...");
const [defaultEvents, defaultSources]=await Promise.all([
  listAllRows(CFG.default.tables.events, CFG.default.token),
  listAllRows(CFG.default.tables.sources, CFG.default.token)
]);
console.log("Leser Time...");
const [timeEvents, timeSources]=await Promise.all([
  listAllRows(CFG.time.tables.events, CFG.time.token),
  listAllRows(CFG.time.tables.sources, CFG.time.token)
]);
console.log("Leser Klepp...");
const [kleppEvents, kleppSources]=await Promise.all([
  listAllRows(CFG.klepp.tables.events, CFG.klepp.token),
  listAllRows(CFG.klepp.tables.sources, CFG.klepp.token)
]);

const report={
  version:"v465-time-klepp-default-cleanup-dry-run-2026-09-13",
  mode:"DRY_RUN_ONLY",
  generatedAt:new Date().toISOString(),
  writesPerformed:0,
  defaultBefore:{events:defaultEvents.length,sources:defaultSources.length},
  areas:{
    time:analyzeArea("time",timeEvents,timeSources,defaultEvents,defaultSources),
    klepp:analyzeArea("klepp",kleppEvents,kleppSources,defaultEvents,defaultSources)
  }
};

const ts=new Set(report.areas.time.deleteCandidates.sources.map(x=>x.rowId));
const ks=new Set(report.areas.klepp.deleteCandidates.sources.map(x=>x.rowId));
const te=new Set(report.areas.time.deleteCandidates.events.map(x=>x.rowId));
const ke=new Set(report.areas.klepp.deleteCandidates.events.map(x=>x.rowId));
const overlap={sourceRowIds:[...ts].filter(id=>ks.has(id)),eventRowIds:[...te].filter(id=>ke.has(id))};
report.safety={timeKleppOverlap:overlap,overlapOk:overlap.sourceRowIds.length===0 && overlap.eventRowIds.length===0};
if(!report.safety.overlapOk) throw new Error(`SAFETY STOP: Time/Klepp overlapper i default. Sources=${overlap.sourceRowIds.length}, Events=${overlap.eventRowIds.length}`);

report.totalDeleteCandidates={
  sources:report.areas.time.deleteCandidateSummary.sources+report.areas.klepp.deleteCandidateSummary.sources,
  events:report.areas.time.deleteCandidateSummary.events+report.areas.klepp.deleteCandidateSummary.events,
  rowsFreedIfDeleted:report.areas.time.deleteCandidateSummary.rowsFreedIfDeleted+report.areas.klepp.deleteCandidateSummary.rowsFreedIfDeleted
};

await fs.writeFile("arrangementer-cleanup-dry-run-v465.json",JSON.stringify(report,null,2)+"\n","utf8");
console.log("\n=== V465 CLEANUP DRY RUN ===");
console.log(JSON.stringify({version:report.version,mode:report.mode,defaultBefore:report.defaultBefore,time:report.areas.time.deleteCandidateSummary,klepp:report.areas.klepp.deleteCandidateSummary,totalDeleteCandidates:report.totalDeleteCandidates,safety:report.safety},null,2));
console.log("\nINGEN DATA ER ENDRET ELLER SLETTET.");
