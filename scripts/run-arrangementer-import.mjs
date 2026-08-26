import {
  arrListAllRows,
  arrUpdateRowsBatch
} from "./arrangementer-engine.mjs";

const TABLE = 1150075;
const F = {
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

const env = {
  ARRANGEMENT_BASEROW_TOKEN: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_DEFAULT: process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  BASEROW_API_BASE: process.env.BASEROW_API_BASE || "https://api.baserow.io"
};

function selectValue(v){
  if (v == null) return "";
  if (typeof v === "object") return String(v.value ?? v.name ?? "");
  return String(v);
}

const specs = {
  "RULE-0079": {priority:45,source:"Den norske kirke – Time",title:"UKUF",add:"Ungdom",remove:"",url:"https://www.facebook.com/UKUF2020/"},
  "RULE-0080": {priority:45,source:"Den norske kirke – Time",title:"Åpen Kjellar",add:"Barn",remove:"",url:""},
  "RULE-0081": {priority:45,source:"Den norske kirke – Time",title:"Bønnehus",add:"Bønn",remove:"Sosialt",url:""},
  "RULE-0082": {priority:45,source:"Den norske kirke – Time",title:"Øving greensax",add:"Sang / musikk",remove:"",url:""},
  "RULE-0083": {priority:45,source:"Den norske kirke – Time",title:"Krøllekveld for 3-åringar",add:"Barn",remove:"",url:""},
  "RULE-0084": {priority:45,source:"Den norske kirke – Time",title:"Laust og Fast",add:"Senior",remove:"",url:""},
  "RULE-0085": {priority:90,source:"",title:"Babysong",add:"Barn",remove:"",url:""},
  "RULE-0086": {priority:200,source:"",title:"møte",add:"Møte",remove:"",url:""},
  "RULE-0087": {priority:90,source:"",title:"Strikkekafe",add:"Sosialt",remove:"",url:""},
  "RULE-0088": {priority:90,source:"",title:"Strikkekafé",add:"Sosialt",remove:"",url:""}
};

const rows = await arrListAllRows(env,TABLE);

// Discover existing valid Single-select option IDs from already-working rules.
function findSelectOption(fieldId, wanted){
  for(const r of rows){
    const v=r[fieldId];
    if(v && typeof v==="object" && selectValue(v)===wanted && Number.isInteger(Number(v.id))){
      return Number(v.id);
    }
  }
  throw new Error(`Fant ikke Single select-option '${wanted}' i felt ${fieldId}.`);
}

const classificationId=findSelectOption(F.ruleType,"Classification");
const exactId=findSelectOption(F.sourceNameType,"Exact");
const containsId=findSelectOption(F.titleType,"Contains");

const updates=[];
for(const row of rows){
  const rid=String(row[F.ruleId]||"").trim();
  const s=specs[rid];
  if(!s) continue;
  updates.push({
    id:Number(row.id),
    [F.active]:true,
    [F.priority]:String(s.priority),
    [F.ruleType]:classificationId,
    [F.sourceName]:s.source,
    [F.sourceNameType]:s.source ? exactId : null,
    [F.title]:s.title,
    [F.titleType]:containsId,
    [F.addTypes]:s.add,
    [F.removeTypes]:s.remove,
    [F.replaceTypes]:false,
    [F.sourceUrl]:s.url,
    [F.stop]:false
  });
}

if(updates.length!==10){
  throw new Error(`Forventet 10 regler, fant ${updates.length}.`);
}

await arrUpdateRowsBatch(env,TABLE,updates,20);

const verify=await arrListAllRows(env,TABLE);
const result=verify
  .filter(r=>specs[String(r[F.ruleId]||"").trim()])
  .map(r=>({
    ruleId:r[F.ruleId],
    sourceName:r[F.sourceName],
    sourceNameType:selectValue(r[F.sourceNameType]),
    title:r[F.title],
    titleType:selectValue(r[F.titleType]),
    addTypes:r[F.addTypes],
    removeTypes:r[F.removeTypes],
    sourceUrl:r[F.sourceUrl]
  }));

console.log("=== V457 EVENT RULE REPAIR COMPLETE ===");
console.log(JSON.stringify(result,null,2));
