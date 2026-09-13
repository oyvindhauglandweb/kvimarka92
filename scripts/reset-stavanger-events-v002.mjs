import {
  ARRANGEMENT_ENGINE_VERSION,
  ARR_TABLE,
  ARR_F,
  arrUseArea,
  arrListAllRows,
  arrDeleteRowsBatch,
  arrImportAllSources,
  arrClean
} from "./arrangementer-engine.mjs";

const env = {
  ARRANGEMENT_BASEROW_TOKEN:
    process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_DEFAULT:
    process.env.ARRANGEMENT_BASEROW_TOKEN || "",
  ARRANGEMENT_BASEROW_TOKEN_STAVANGER:
    process.env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER || "",
  BASEROW_API_BASE:
    process.env.BASEROW_API_BASE || "https://api.baserow.io"
};

if (!env.ARRANGEMENT_BASEROW_TOKEN) {
  throw new Error("ARRANGEMENT_BASEROW_TOKEN mangler.");
}

if (!env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER) {
  throw new Error("ARRANGEMENT_BASEROW_TOKEN_STAVANGER mangler.");
}

// Stavanger-tabellene skal bruke Stavanger-tokenet.
// Felles tabeller som Organizations/Event Rules leses fortsatt med
// ARRANGEMENT_BASEROW_TOKEN_DEFAULT inne i engine.
const stavangerEnv = {
  ...env,
  ARRANGEMENT_BASEROW_TOKEN:
    env.ARRANGEMENT_BASEROW_TOKEN_STAVANGER
};

arrUseArea("stavanger");

console.log(`Engine: ${ARRANGEMENT_ENGINE_VERSION}`);
console.log(`Stavanger Events table: ${ARR_TABLE.EVENTS}`);

const before = await arrListAllRows(
  stavangerEnv,
  ARR_TABLE.EVENTS
);

console.log(`Rader før sletting: ${before.length}`);

if (before.length) {
  const deleted = await arrDeleteRowsBatch(
    stavangerEnv,
    ARR_TABLE.EVENTS,
    before.map(row => row.id)
  );

  console.log(`Slettet: ${deleted}`);
}

const afterDelete = await arrListAllRows(
  stavangerEnv,
  ARR_TABLE.EVENTS
);

if (afterDelete.length !== 0) {
  throw new Error(
    `Events-tabellen er ikke tom etter sletting. Gjenstår ${afterDelete.length} rader.`
  );
}

console.log("Events-tabellen er tom.");
console.log("Starter ren Stavanger-import...");

const result = await arrImportAllSources(
  stavangerEnv,
  {
    cleanup: false,
    area: "stavanger"
  }
);

const afterImport = await arrListAllRows(
  stavangerEnv,
  ARR_TABLE.EVENTS
);

const activeRows = afterImport.filter(
  row => row[ARR_F.events.active] !== false
);

const inactiveRows = afterImport.filter(
  row => row[ARR_F.events.active] === false
);

const sourceCounts = new Map();

for (const row of activeRows) {
  const source = arrClean(
    row[ARR_F.events.source] || "(uten Source)"
  );

  sourceCounts.set(
    source,
    (sourceCounts.get(source) || 0) + 1
  );
}

console.log("\nRen import ferdig.");
console.log(`Rader etter import: ${afterImport.length}`);
console.log(`Aktive: ${activeRows.length}`);
console.log(`Inaktive: ${inactiveRows.length}`);
console.log("Aktive per Source:");

for (const [source, count] of [...sourceCounts.entries()]
  .sort((a, b) => a[0].localeCompare(b[0], "nb"))) {
  console.log(`  ${source}: ${count}`);
}

console.log("\nImportresultat:");
console.log(JSON.stringify(result, null, 2));
