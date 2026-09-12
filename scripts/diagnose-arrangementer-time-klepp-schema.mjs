import fs from "node:fs/promises";

const API = process.env.BASEROW_API_BASE || "https://api.baserow.io";

const AREAS = {
  time: {
    databaseId: 554837,
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_TIME || "",
    tables: {
      EVENTS: 1193653,
      MEETING_TYPES: 1193654,
      SETTLEMENTS: 1193655,
      SOURCES: 1193657
    }
  },
  klepp: {
    databaseId: 554845,
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_KLEPP || "",
    tables: {
      EVENTS: 1193659,
      MEETING_TYPES: 1193660,
      SETTLEMENTS: 1193662,
      SOURCES: 1193663
    }
  }
};

async function apiGet(path, token) {
  const r = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json"
    }
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) {}
  if (!r.ok) {
    throw new Error(`${path} -> HTTP ${r.status}: ${text.slice(0, 1200)}`);
  }
  return data;
}

async function inspectTable(areaKey, tableName, tableId, token) {
  const [fields, rows] = await Promise.all([
    apiGet(`/api/database/fields/table/${tableId}/`, token),
    apiGet(`/api/database/rows/table/${tableId}/?user_field_names=false&size=1&page=1`, token)
  ]);

  return {
    area: areaKey,
    tableName,
    tableId,
    rowCount: Number(rows?.count || 0),
    fields: (Array.isArray(fields) ? fields : []).map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      primary: Boolean(f.primary),
      linkRowTableId: f.link_row_table_id ?? null,
      selectOptions: Array.isArray(f.select_options)
        ? f.select_options.map(o => ({ id:o.id, value:o.value }))
        : undefined
    }))
  };
}

const report = {
  diagnosticVersion: "v461-time-klepp-schema-read-only-2026-09-12",
  generatedAt: new Date().toISOString(),
  areas: {}
};

for (const [areaKey, area] of Object.entries(AREAS)) {
  if (!area.token) {
    throw new Error(`Mangler ARRANGEMENT_BASEROW_TOKEN_${areaKey.toUpperCase()}`);
  }

  const tables = {};
  for (const [tableName, tableId] of Object.entries(area.tables)) {
    console.log(`Leser ${areaKey}.${tableName} (${tableId}) ...`);
    tables[tableName] = await inspectTable(areaKey, tableName, tableId, area.token);
  }

  report.areas[areaKey] = {
    databaseId: area.databaseId,
    tables
  };
}

await fs.writeFile(
  "arrangementer-time-klepp-schema.json",
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log("\n=== V461 TIME/KLEPP SCHEMA DIAGNOSTIC ===");
console.log(JSON.stringify(report, null, 2));
console.log("\nSkrev arrangementer-time-klepp-schema.json");
