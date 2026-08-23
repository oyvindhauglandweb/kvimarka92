import fs from "node:fs/promises";
import {
  ARR_AREAS,
  arrUseArea,
  arrListAllRows,
  arrClean,
  arrNormalize
} from "./arrangementer-engine.mjs";

const envBase = {
  ARRANGEMENT_BASEROW_TOKEN: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_DEFAULT: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_SANDNES: process.env.ARRANGEMENT_BASEROW_TOKEN_SANDNES || "",
  ARRANGEMENT_BASEROW_TOKEN_STAVANGER: process.env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER || "",
  BASEROW_API_BASE: process.env.BASEROW_API_BASE || "https://api.baserow.io"
};

for (const key of [
  "ARRANGEMENT_BASEROW_TOKEN",
  "ARRANGEMENT_BASEROW_TOKEN_SANDNES",
  "ARRANGEMENT_BASEROW_TOKEN_STAVANGER"
]) {
  if (!envBase[key]) throw new Error(`${key} mangler.`);
}

const RULES_TABLE = 1150075;
const ORGANIZATIONS_TABLE = 1151956;

const RF = {
  ruleId: "field_10306627",
  active: "field_10306628",
  priority: "field_10306629",
  sourceIdMatch: "field_10306631",
  sourceNameMatch: "field_10306632",
  sourceNameMatchType: "field_10306633",
  organizationMatch: "field_10326958",
  sourceOrganizationMatch: "field_10328747",
  organizerMatch: "field_10306634",
  organizerMatchType: "field_10306635",
  titleMatch: "field_10306636",
  titleMatchType: "field_10306637",
  descriptionMatch: "field_10306638",
  descriptionMatchType: "field_10306639",
  locationMatch: "field_10306640",
  locationMatchType: "field_10306641",
  addOrganizations: "field_10328278",
  removeOrganizations: "field_10328281",
  replaceOrganizations: "field_10328284"
};

const OF = {
  id: "field_10329028",
  name: "field_10329029",
  aliases: "field_10329030",
  active: "field_10329033"
};

function envForArea(areaKey) {
  if (areaKey === "sandnes") {
    return {...envBase, ARRANGEMENT_BASEROW_TOKEN: envBase.ARRANGEMENT_BASEROW_TOKEN_SANDNES};
  }
  if (areaKey === "stavanger") {
    return {...envBase, ARRANGEMENT_BASEROW_TOKEN: envBase.ARRANGEMENT_BASEROW_TOKEN_STAVANGER};
  }
  return {...envBase, ARRANGEMENT_BASEROW_TOKEN: envBase.ARRANGEMENT_BASEROW_TOKEN};
}

function fieldText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) {
    return value.map(v => fieldText(v)).filter(Boolean).join("; ");
  }
  if (typeof value === "object") {
    return String(value.value ?? value.name ?? value.label ?? value.id ?? "").trim();
  }
  return String(value).trim();
}

function orgIds(value) {
  return [...new Set(
    fieldText(value)
      .split(/[;,]/)
      .map(v => v.trim().toUpperCase())
      .filter(v => /^ORG-\d{4,}$/.test(v))
  )];
}

function matchValue(actual, expected, matchType) {
  const exp = fieldText(expected);
  if (!exp) return true;
  const a = arrNormalize(fieldText(actual));
  const e = arrNormalize(exp);
  const mt = arrNormalize(fieldText(matchType) || "contains");
  if (mt === "exact") return a === e;
  if (mt === "starts with") return a.startsWith(e);
  return a.includes(e);
}

function matchOrgIds(actual, expected) {
  const wanted = orgIds(expected);
  if (!wanted.length) return true;
  const have = new Set(orgIds(actual));
  return wanted.some(id => have.has(id));
}

function sourceNameFromEvent(value) {
  if (Array.isArray(value)) {
    return value.map(fieldText).filter(Boolean)[0] || "";
  }
  return fieldText(value);
}

function evaluateRule(rule, event, source, F) {
  const checks = [
    ["Source ID", fieldText(source?.[F.sources.sourceId]), rule[RF.sourceIdMatch], "Exact"],
    ["Source Name", fieldText(source?.[F.sources.name]), rule[RF.sourceNameMatch], rule[RF.sourceNameMatchType]],
    ["Event Organization IDs", event[F.events.organizationIds], rule[RF.organizationMatch], "ORG"],
    ["Source Organization IDs", source?.[F.sources.organizationIds], rule[RF.sourceOrganizationMatch], "ORG"],
    ["Organizer", event[F.events.organizer], rule[RF.organizerMatch], rule[RF.organizerMatchType]],
    ["Title", event[F.events.title], rule[RF.titleMatch], rule[RF.titleMatchType]],
    ["Description", event[F.events.description], rule[RF.descriptionMatch], rule[RF.descriptionMatchType]],
    ["Location", event[F.events.location], rule[RF.locationMatch], rule[RF.locationMatchType]],
  ];

  const detail = [];
  let ok = true;

  for (const [name, actual, expected, type] of checks) {
    const exp = fieldText(expected);
    if (!exp) continue;
    const pass = type === "ORG"
      ? matchOrgIds(actual, expected)
      : matchValue(actual, expected, type);
    detail.push({name, expected: exp, actual: fieldText(actual), pass});
    if (!pass) ok = false;
  }
  return {ok, detail};
}

const centralEnv = {
  ...envBase,
  ARRANGEMENT_BASEROW_TOKEN: envBase.ARRANGEMENT_BASEROW_TOKEN_DEFAULT
};

const [rulesRaw, organizationsRaw] = await Promise.all([
  arrListAllRows(centralEnv, RULES_TABLE),
  arrListAllRows(centralEnv, ORGANIZATIONS_TABLE)
]);

const rules = rulesRaw
  .filter(r => r[RF.active] !== false)
  .filter(r =>
    orgIds(r[RF.addOrganizations]).length ||
    orgIds(r[RF.removeOrganizations]).length ||
    r[RF.replaceOrganizations] === true
  )
  .sort((a,b) =>
    Number(a[RF.priority] || 100) - Number(b[RF.priority] || 100) ||
    fieldText(a[RF.ruleId]).localeCompare(fieldText(b[RF.ruleId]), "nb")
  );

const organizations = organizationsRaw
  .filter(r => r[OF.active] !== false)
  .map(r => ({
    id: fieldText(r[OF.id]).toUpperCase(),
    name: fieldText(r[OF.name]),
    aliases: fieldText(r[OF.aliases])
  }))
  .filter(r => r.id);

const knownOrgIds = new Set(organizations.map(o => o.id));

const report = {
  diagnosticVersion: "V447-read-only-organization-diagnostic",
  generatedAt: new Date().toISOString(),
  central: {
    rulesTable: RULES_TABLE,
    organizationsTable: ORGANIZATIONS_TABLE,
    organizationRulesRead: rules.length,
    organizationsRead: organizations.length,
    organizationRuleSamples: rules.slice(0, 12).map(r => ({
      ruleId: fieldText(r[RF.ruleId]),
      titleMatch: fieldText(r[RF.titleMatch]),
      descriptionMatch: fieldText(r[RF.descriptionMatch]),
      sourceNameMatch: fieldText(r[RF.sourceNameMatch]),
      addOrganizationsRaw: fieldText(r[RF.addOrganizations]),
      addOrganizationIdsParsed: orgIds(r[RF.addOrganizations]),
      unknownAddIds: orgIds(r[RF.addOrganizations]).filter(id => !knownOrgIds.has(id))
    }))
  },
  areas: {}
};

for (const areaKey of ["default", "sandnes", "stavanger"]) {
  const cfg = ARR_AREAS[areaKey];
  const F = cfg.fields;
  const areaEnv = envForArea(areaKey);
  arrUseArea(areaKey);

  const [events, sources] = await Promise.all([
    arrListAllRows(areaEnv, cfg.tables.EVENTS),
    arrListAllRows(areaEnv, cfg.tables.SOURCES)
  ]);

  const sourceByName = new Map();
  const sourceById = new Map();
  for (const s of sources) {
    const n = fieldText(s[F.sources.name]);
    const id = fieldText(s[F.sources.sourceId]);
    if (n) sourceByName.set(arrNormalize(n), s);
    if (id) sourceById.set(arrNormalize(id), s);
  }

  let matchedEvents = 0;
  let eventsWithCurrentOrganizationIds = 0;
  const matches = [];
  const failuresForKnownKeywords = [];

  for (const event of events) {
    const current = fieldText(event[F.events.organizationIds]);
    if (orgIds(current).length) eventsWithCurrentOrganizationIds++;

    const eventSourceText = sourceNameFromEvent(event[F.events.source]);
    const source =
      sourceByName.get(arrNormalize(eventSourceText)) ||
      sourceById.get(arrNormalize(eventSourceText)) ||
      null;

    const eventMatches = [];
    for (const rule of rules) {
      const ev = evaluateRule(rule, event, source, F);
      if (ev.ok) {
        eventMatches.push({
          ruleId: fieldText(rule[RF.ruleId]),
          addRaw: fieldText(rule[RF.addOrganizations]),
          addIds: orgIds(rule[RF.addOrganizations]),
          detail: ev.detail
        });
      }
    }

    if (eventMatches.length) {
      matchedEvents++;
      if (matches.length < 25) {
        matches.push({
          eventId: fieldText(event[F.events.eventId]),
          title: fieldText(event[F.events.title]),
          sourceFieldRaw: fieldText(event[F.events.source]),
          sourceResolved: source ? fieldText(source[F.sources.name]) : "",
          organizer: fieldText(event[F.events.organizer]),
          description: fieldText(event[F.events.description]).slice(0, 250),
          currentOrganizationIds: current,
          matchedRules: eventMatches
        });
      }
    } else {
      const haystack = `${fieldText(event[F.events.title])} ${fieldText(event[F.events.description])}`.toLowerCase();
      if (/(nlm|nms|nll|samemisjon|normisjon|imf|åpne dører|frelsesarmeen|krik)/i.test(haystack)
          && failuresForKnownKeywords.length < 15) {
        const relevant = rules
          .filter(r => {
            const q = `${fieldText(r[RF.titleMatch])} ${fieldText(r[RF.descriptionMatch])}`.toLowerCase();
            return q && [...["nlm","nms","nll","samemisjon","normisjon","imf","åpne dører","frelsesarmeen","krik"]]
              .some(k => haystack.includes(k) && q.includes(k));
          })
          .slice(0,4)
          .map(r => ({
            ruleId: fieldText(r[RF.ruleId]),
            evaluation: evaluateRule(r, event, source, F)
          }));

        failuresForKnownKeywords.push({
          eventId: fieldText(event[F.events.eventId]),
          title: fieldText(event[F.events.title]),
          description: fieldText(event[F.events.description]).slice(0,250),
          sourceFieldRaw: fieldText(event[F.events.source]),
          sourceResolved: source ? fieldText(source[F.sources.name]) : "",
          relevantRuleEvaluations: relevant
        });
      }
    }
  }

  report.areas[areaKey] = {
    name: cfg.name,
    eventsTable: cfg.tables.EVENTS,
    sourcesTable: cfg.tables.SOURCES,
    targetOrganizationField: F.events.organizationIds,
    sourceOrganizationField: F.sources.organizationIds,
    eventsRead: events.length,
    sourcesRead: sources.length,
    eventsWithCurrentOrganizationIds,
    eventsMatchingOrganizationRules: matchedEvents,
    matchSamples: matches,
    knownKeywordFailures: failuresForKnownKeywords
  };
}

const output = process.env.ARRANGEMENT_ORG_DIAGNOSTIC_PATH ||
  "arrangementer-organization-diagnostic.json";

await fs.writeFile(output, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log("=== ORGANIZATION DIAGNOSTIC V447 – READ ONLY ===");
console.log(JSON.stringify(report, null, 2));
console.log(`Diagnostic written to ${output}`);
