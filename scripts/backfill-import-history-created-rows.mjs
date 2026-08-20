import fs from "node:fs/promises";

const API_BASE = String(process.env.BASEROW_API_BASE || "https://api.baserow.io").replace(/\/$/, "");
const HISTORY_PATH = process.env.ARRANGEMENT_HISTORY_PATH || "arrangementer-import-history.json";

const AREAS = {
  default: {
    token: String(process.env.ARRANGEMENT_BASEROW_TOKEN || "").trim(),
    eventsTable: 1137493,
    fields: {
      eventId: "field_10177330",
      title: "field_10177331",
      startTime: "field_10177332",
      endTime: "field_10177333",
      organizer: "field_10177399",
      location: "field_10177400",
      source: "field_10177401",
      sourceEventId: "field_10177403",
      active: "field_10177442"
    }
  },
  sandnes: {
    token: String(process.env.ARRANGEMENT_BASEROW_TOKEN_SANDNES || "").trim(),
    eventsTable: 1144908,
    fields: {
      eventId: "field_10252551",
      title: "field_10252552",
      startTime: "field_10252553",
      endTime: "field_10252554",
      organizer: "field_10252556",
      location: "field_10252557",
      source: "field_10252559",
      sourceEventId: "field_10252561",
      active: "field_10252563"
    }
  }
};

const clean = v => String(v ?? "").trim();
const norm = v => clean(v).replace(/\s+/g," ").toLowerCase();

async function listAllRows(area) {
  const rows=[];
  let page=1;
  while (true) {
    const url = `${API_BASE}/api/database/rows/table/${area.eventsTable}/?user_field_names=false&size=200&page=${page}`;
    const r = await fetch(url,{headers:{Authorization:`Token ${area.token}`,Accept:"application/json"}});
    if(!r.ok) throw new Error(`GET ${area.eventsTable} failed ${r.status}: ${await r.text()}`);
    const data=await r.json();
    rows.push(...(data.results||[]));
    if(!data.next) break;
    page++;
  }
  return rows;
}

function mapRow(row, f) {
  return {
    rowId:Number(row.id||0),
    eventId:clean(row[f.eventId]),
    title:clean(row[f.title]),
    startTime:clean(row[f.startTime]),
    endTime:clean(row[f.endTime]),
    organizer:clean(row[f.organizer]),
    location:clean(row[f.location]),
    source:clean(row[f.source]),
    sourceEventId:clean(row[f.sourceEventId]),
    active:row[f.active] !== false
  };
}

let data;
try {
  data=JSON.parse(await fs.readFile(HISTORY_PATH,"utf8"));
} catch (_) {
  console.log("Ingen historikk å backfille.");
  process.exit(0);
}

const imports=Array.isArray(data?.imports)?data.imports:[];
const latest=imports[0];
if(!latest || !Array.isArray(latest.sourceResults)) {
  console.log("Ingen siste import med sourceResults.");
  process.exit(0);
}

let changed=false;
const rowsByArea=new Map();

for(const sourceResult of latest.sourceResults) {
  const count=Number(sourceResult?.created||0);
  if(count<=0) continue;
  if(Array.isArray(sourceResult.createdEvents) && sourceResult.createdEvents.length) continue;

  const areaKey=String(sourceResult.area||"default");
  const area=AREAS[areaKey];
  if(!area?.token) {
    console.log(`Mangler token for ${areaKey}; hopper over backfill.`);
    continue;
  }

  if(!rowsByArea.has(areaKey)) {
    rowsByArea.set(areaKey, await listAllRows(area));
  }

  const sourceName=norm(sourceResult.name);
  const sourceId=norm(sourceResult.sourceId);
  const rows=rowsByArea.get(areaKey);
  const f=area.fields;

  const matches=rows
    .filter(row=>{
      const source=norm(row[f.source]);
      return source && (source===sourceName || source===sourceId);
    })
    .sort((a,b)=>Number(b.id||0)-Number(a.id||0))
    .slice(0,count)
    .sort((a,b)=>Number(a.id||0)-Number(b.id||0))
    .map(row=>mapRow(row,f));

  sourceResult.createdEvents=matches;
  sourceResult.createdEventsBackfilled=true;
  sourceResult.createdEventsBackfillMethod="highest-row-ids-for-source";
  changed=true;

  console.log(`Backfill ${areaKey}/${sourceResult.name}: ${matches.length}/${count} rader.`);
}

if(changed) {
  await fs.writeFile(HISTORY_PATH,JSON.stringify(data,null,2)+"\n","utf8");
  console.log("Historikken ble backfillet før ny import.");
} else {
  console.log("Ingen historikk trengte backfill.");
}
