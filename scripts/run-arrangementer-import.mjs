import fs from "node:fs/promises";
import {
  ARR_AREAS,
  arrUseArea,
  arrListAllRows,
  arrClean,
  arrNormalize
} from "./arrangementer-engine.mjs";

const env = {
  ARRANGEMENT_BASEROW_TOKEN: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_DEFAULT: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_SANDNES: process.env.ARRANGEMENT_BASEROW_TOKEN_SANDNES || "",
  ARRANGEMENT_BASEROW_TOKEN_STAVANGER: process.env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER || "",
  BASEROW_API_BASE: process.env.BASEROW_API_BASE || "https://api.baserow.io"
};

const RULES_TABLE = 1150075;
const RF = {
  ruleId:"field_10306627",
  active:"field_10306628",
  priority:"field_10306629",
  ruleType:"field_10306630",
  sourceName:"field_10306632",
  sourceNameType:"field_10306633",
  title:"field_10306636",
  titleType:"field_10306637",
  addTypes:"field_10306642",
  removeTypes:"field_10306643",
  replaceTypes:"field_10306644",
  sourceUrl:"field_10306647",
  stop:"field_10306652",
  notes:"field_10306655"
};

function selectText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v.value ?? v.name ?? "");
  return String(v);
}

function match(actual, expected, type) {
  const wanted = arrNormalize(expected || "");
  if (!wanted) return true;
  const text = arrNormalize(actual || "");
  const t = arrNormalize(selectText(type) || "Exact");
  if (t === "contains") return text.includes(wanted);
  if (t === "starts with") return text.startsWith(wanted);
  return text === wanted;
}

const centralEnv = {...env, ARRANGEMENT_BASEROW_TOKEN: env.ARRANGEMENT_BASEROW_TOKEN_DEFAULT};
const rules = await arrListAllRows(centralEnv, RULES_TABLE);

const wantedRuleIds = new Set(Array.from({length:10}, (_,i)=>`RULE-${String(79+i).padStart(4,"0")}`));
const targetRules = rules.filter(r => wantedRuleIds.has(arrClean(r[RF.ruleId])));

arrUseArea("default");
const cfg = ARR_AREAS.default;
const events = await arrListAllRows(env, cfg.tables.EVENTS);
const sources = await arrListAllRows(env, cfg.tables.SOURCES);

const sourceByRowId = new Map(sources.map(s => [Number(s.id), s]));
const targetTitles = [
  "UKUF",
  "Åpen Kjellar",
  "Bønnehus",
  "Øving greensax",
  "Krøllekveld for 3-åringar",
  "Laust og Fast",
  "Babysong"
];

function sourceNameForEvent(row) {
  const raw = row[cfg.fields.events.source];
  const vals = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const id = Number(vals[0]?.id ?? vals[0]);
  const s = sourceByRowId.get(id);
  return s ? arrClean(s[cfg.fields.sources.name]) : "";
}

const samples = events
  .filter(e => targetTitles.some(t => arrNormalize(e[cfg.fields.events.title] || "").includes(arrNormalize(t))))
  .slice(0,80)
  .map(e => {
    const title = arrClean(e[cfg.fields.events.title] || "");
    const sourceName = sourceNameForEvent(e);
    const evaluations = targetRules.map(r => ({
      ruleId: arrClean(r[RF.ruleId]),
      raw: {
        active:r[RF.active],
        ruleType:r[RF.ruleType],
        sourceName:r[RF.sourceName],
        sourceNameType:r[RF.sourceNameType],
        title:r[RF.title],
        titleType:r[RF.titleType],
        addTypes:r[RF.addTypes],
        removeTypes:r[RF.removeTypes],
        replaceTypes:r[RF.replaceTypes],
        sourceUrl:r[RF.sourceUrl],
        stop:r[RF.stop]
      },
      sourcePass: match(sourceName, r[RF.sourceName], r[RF.sourceNameType]),
      titlePass: match(title, r[RF.title], r[RF.titleType]),
      wouldMatch:
        r[RF.active] !== false &&
        match(sourceName, r[RF.sourceName], r[RF.sourceNameType]) &&
        match(title, r[RF.title], r[RF.titleType])
    })).filter(x => x.wouldMatch || x.ruleId.startsWith("RULE-00"));
    return {
      rowId:e.id,
      eventId:e[cfg.fields.events.eventId],
      title,
      sourceName,
      currentMeetingTypes:e[cfg.fields.events.meetingTypes],
      evaluations
    };
  });

const report = {
  diagnosticVersion:"V456-read-only-undheim-rule-diagnostic",
  generatedAt:new Date().toISOString(),
  rulesFound:targetRules.length,
  rules:targetRules.map(r => ({
    rowId:r.id,
    ruleId:arrClean(r[RF.ruleId]),
    active:r[RF.active],
    priority:r[RF.priority],
    ruleType:r[RF.ruleType],
    sourceName:r[RF.sourceName],
    sourceNameType:r[RF.sourceNameType],
    title:r[RF.title],
    titleType:r[RF.titleType],
    addTypes:r[RF.addTypes],
    removeTypes:r[RF.removeTypes],
    replaceTypes:r[RF.replaceTypes],
    sourceUrl:r[RF.sourceUrl],
    stop:r[RF.stop]
  })),
  sampleCount:samples.length,
  samples
};

console.log("=== V456 UNDHEIM RULE DIAGNOSTIC – READ ONLY ===");
console.log(JSON.stringify(report,null,2));
await fs.writeFile("arrangementer-undheim-rule-diagnostic.json", JSON.stringify(report,null,2)+"\n","utf8");
console.log("Diagnostic written to arrangementer-undheim-rule-diagnostic.json");
