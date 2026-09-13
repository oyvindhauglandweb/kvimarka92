import fs from "node:fs/promises";

const API = process.env.BASEROW_API_BASE || "https://api.baserow.io";

const AREAS = {
  default: {
    name: "Felles",
    token: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
    tables: { events: 1137493, sources: 1137506, meetingTypes: 1137511, settlements: 1137544 },
    fields: {
      meetingTypes: { typeId:"field_10177509", name:"field_10177510", active:"field_10177860" },
      events: { active:"field_10177442" },
      sources: { enabled:"field_10177499" }
    }
  },
  sandnes: {
    name: "Sandnes",
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_SANDNES || "",
    tables: { events: 1144908, sources: 1144922, meetingTypes: 1144925, settlements: 1144926 },
    fields: {
      meetingTypes: { typeId:"field_10252536", name:"field_10252537", active:"field_10252541" },
      events: { active:"field_10252557" },
      sources: { enabled:"field_10252532" }
    }
  },
  stavanger: {
    name: "Stavanger",
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER || "",
    tables: { events: 1146207, sources: 1146151, meetingTypes: 1146150, settlements: 1146149 },
    fields: {
      meetingTypes: { typeId:"field_10265697", name:"field_10265698", active:"field_10265702" },
      events: { active:"field_10266389" },
      sources: { enabled:"field_10265712" }
    }
  },
  time: {
    name: "Time",
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_TIME || "",
    tables: { events: 1193653, sources: 1193657, meetingTypes: 1193654, settlements: 1193655 },
    fields: {
      meetingTypes: { typeId:"field_10794713", name:"field_10794715", active:"field_10794719" },
      events: { active:"field_10794707" },
      sources: { enabled:"field_10794749" }
    }
  },
  klepp: {
    name: "Klepp",
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_KLEPP || "",
    tables: { events: 1193659, sources: 1193663, meetingTypes: 1193660, settlements: 1193662 },
    fields: {
      meetingTypes: { typeId:"field_10794782", name:"field_10794784", active:"field_10794788" },
      events: { active:"field_10794778" },
      sources: { enabled:"field_10794810" }
    }
  }
};

async function get(path, token) {
  const r = await fetch(`${API}${path}`, {
    headers: { Authorization:`Token ${token}`, Accept:"application/json" }
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}: ${text.slice(0,1200)}`);
  return text ? JSON.parse(text) : {};
}

async function listAll(tableId, token) {
  const out = [];
  let page = 1;
  while (true) {
    const d = await get(`/api/database/rows/table/${tableId}/?user_field_names=false&size=200&page=${page}`, token);
    out.push(...(d.results || []));
    if (!d.next) break;
    page++;
  }
  return out;
}

function clean(v){ return String(v ?? "").trim(); }
function norm(v){ return clean(v).toLocaleLowerCase("nb-NO"); }

const loaded = {};

for (const [key, a] of Object.entries(AREAS)) {
  if (!a.token) throw new Error(`Mangler token for ${key}`);

  console.log(`Leser ${a.name} ...`);
  const [events, sources, meetingTypes, settlements] = await Promise.all([
    listAll(a.tables.events, a.token),
    listAll(a.tables.sources, a.token),
    listAll(a.tables.meetingTypes, a.token),
    listAll(a.tables.settlements, a.token)
  ]);

  loaded[key] = { events, sources, meetingTypes, settlements };
}

const master = loaded.default.meetingTypes;
const masterById = new Map();
for (const r of master) {
  const id = clean(r[AREAS.default.fields.meetingTypes.typeId]);
  if (id) masterById.set(norm(id), {
    id,
    name: clean(r[AREAS.default.fields.meetingTypes.name]),
    active: r[AREAS.default.fields.meetingTypes.active] !== false
  });
}

const report = {
  version: "v468-meeting-types-row-usage-diagnostic-2026-09-13",
  mode: "READ_ONLY",
  generatedAt: new Date().toISOString(),
  masterCount: masterById.size,
  areas: {}
};

for (const key of ["time","klepp","sandnes","stavanger"]) {
  const a = AREAS[key];
  const d = loaded[key];

  const localById = new Map();
  for (const r of d.meetingTypes) {
    const id = clean(r[a.fields.meetingTypes.typeId]);
    if (id) localById.set(norm(id), {
      rowId: r.id,
      id,
      name: clean(r[a.fields.meetingTypes.name]),
      active: r[a.fields.meetingTypes.active] !== false
    });
  }

  const missing = [];
  for (const [idKey, m] of masterById) {
    if (!localById.has(idKey)) missing.push(m);
  }

  const extra = [];
  for (const [idKey, l] of localById) {
    if (!masterById.has(idKey)) extra.push(l);
  }

  report.areas[key] = {
    name: a.name,
    rowCounts: {
      events: d.events.length,
      activeEvents: d.events.filter(r => r[a.fields.events.active] !== false).length,
      sources: d.sources.length,
      enabledSources: d.sources.filter(r => r[a.fields.sources.enabled] !== false).length,
      meetingTypes: d.meetingTypes.length,
      settlements: d.settlements.length,
      totalKnownRows: d.events.length + d.sources.length + d.meetingTypes.length + d.settlements.length
    },
    meetingTypes: {
      localCount: localById.size,
      missingFromMaster: missing,
      extraVsMaster: extra
    }
  };
}

await fs.writeFile(
  "arrangementer-meeting-types-row-usage-v468.json",
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log("\n=== V468 READ ONLY DIAGNOSTIC ===");
console.log(JSON.stringify(report, null, 2));
console.log("\nIngen data er endret.");
