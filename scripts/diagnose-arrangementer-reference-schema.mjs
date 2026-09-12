import fs from "node:fs/promises";

const API = process.env.BASEROW_API_BASE || "https://api.baserow.io";

const AREAS = {
  reference: {
    label: "Felles / referanse",
    token: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
    tables: {
      EVENTS: 1137493,
      MEETING_TYPES: 1137511,
      SETTLEMENTS: 1137544,
      SOURCES: 1137506
    }
  },
  time: {
    label: "Time",
    token: process.env.ARRANGEMENT_BASEROW_TOKEN_TIME || "",
    tables: {
      EVENTS: 1193653,
      MEETING_TYPES: 1193654,
      SETTLEMENTS: 1193655,
      SOURCES: 1193657
    }
  },
  klepp: {
    label: "Klepp",
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
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}: ${text.slice(0, 1000)}`);
  return data;
}

function simplifyField(f) {
  return {
    id: f.id,
    name: f.name,
    type: f.type,
    primary: Boolean(f.primary),
    linkRowTableId: f.link_row_table_id ?? null,
    throughTableId: f.through_table_id ?? null,
    linkRowRelatedFieldId: f.link_row_related_field_id ?? null,
    dateIncludeTime: f.date_include_time ?? null,
    dateForceTimezone: f.date_force_timezone ?? null,
    numberDecimalPlaces: f.number_decimal_places ?? null,
    booleanDefault: f.boolean_default ?? null,
    selectOptions: Array.isArray(f.select_options)
      ? f.select_options.map(o => ({id:o.id, value:o.value, color:o.color}))
      : undefined
  };
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
    fields: (Array.isArray(fields) ? fields : []).map(simplifyField)
  };
}

function normalizeName(s) {
  return String(s || "").trim().toLowerCase();
}

function compareTables(reference, target) {
  const refByName = new Map(reference.fields.map(f => [normalizeName(f.name), f]));
  const targetByName = new Map(target.fields.map(f => [normalizeName(f.name), f]));
  const allNames = [...new Set([...refByName.keys(), ...targetByName.keys()])].sort();

  return allNames.map(name => {
    const ref = refByName.get(name) || null;
    const trg = targetByName.get(name) || null;
    const issues = [];
    if (!ref) issues.push("extra_in_target");
    if (!trg) issues.push("missing_in_target");
    if (ref && trg) {
      if (ref.type !== trg.type) issues.push(`type:${ref.type}->${trg.type}`);
      if (Boolean(ref.primary) !== Boolean(trg.primary)) issues.push(`primary:${ref.primary}->${trg.primary}`);
      if (ref.type === "date") {
        if (ref.dateIncludeTime !== trg.dateIncludeTime) issues.push(`dateIncludeTime:${ref.dateIncludeTime}->${trg.dateIncludeTime}`);
      }
      if (ref.type === "single_select") {
        const rv = (ref.selectOptions || []).map(o => o.value).sort().join("|");
        const tv = (trg.selectOptions || []).map(o => o.value).sort().join("|");
        if (rv !== tv) issues.push("select_options_differ");
      }
      if (ref.type === "link_row") {
        // Different target table IDs are expected in cloned workspaces,
        // but target must still be link_row. Keep IDs for manual verification.
        if (!trg.linkRowTableId) issues.push("link_target_missing");
      }
    }
    return {
      field: ref?.name || trg?.name || name,
      reference: ref,
      target: trg,
      ok: issues.length === 0,
      issues
    };
  });
}

const report = {
  diagnosticVersion: "v462-reference-schema-compare-read-only-2026-09-12",
  generatedAt: new Date().toISOString(),
  tables: {},
  comparisons: {}
};

for (const [areaKey, area] of Object.entries(AREAS)) {
  if (!area.token) throw new Error(`Mangler token for ${areaKey}`);
  report.tables[areaKey] = {};
  for (const [tableName, tableId] of Object.entries(area.tables)) {
    console.log(`Leser ${area.label}.${tableName} (${tableId}) ...`);
    report.tables[areaKey][tableName] = await inspectTable(areaKey, tableName, tableId, area.token);
  }
}

for (const targetKey of ["time", "klepp"]) {
  report.comparisons[targetKey] = {};
  for (const tableName of ["EVENTS","MEETING_TYPES","SETTLEMENTS","SOURCES"]) {
    report.comparisons[targetKey][tableName] =
      compareTables(report.tables.reference[tableName], report.tables[targetKey][tableName]);
  }
}

function mismatchSummary(targetKey) {
  const rows = [];
  for (const tableName of ["EVENTS","MEETING_TYPES","SETTLEMENTS","SOURCES"]) {
    for (const c of report.comparisons[targetKey][tableName]) {
      if (!c.ok) rows.push({
        table: tableName,
        field: c.field,
        issues: c.issues
      });
    }
  }
  return rows;
}

report.summary = {
  timeMismatches: mismatchSummary("time"),
  kleppMismatches: mismatchSummary("klepp")
};

await fs.writeFile(
  "arrangementer-reference-schema-compare.json",
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log("\n=== V462 REFERENCE SCHEMA COMPARE ===");
console.log(JSON.stringify(report.summary, null, 2));
console.log("\nFull rapport: arrangementer-reference-schema-compare.json");
