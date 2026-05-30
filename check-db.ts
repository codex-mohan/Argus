import { Database } from "bun:sqlite";

const db = new Database("apps/backend/argus_state.sqlite");

console.log("=== TABLES ===");
const tables = db
  .query("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all();
for (const t of tables) {
  console.log(" ", t.name);
}

console.log("\n=== model_catalog ===");
try {
  const models = db.query("SELECT * FROM model_catalog").all();
  for (const m of models) {
    console.log(m);
  }
} catch (e) {
  console.log("Error:", e);
}

console.log("\n=== agent_config ===");
try {
  const configs = db.query("SELECT * FROM agent_config").all();
  for (const c of configs) {
    console.log(c);
  }
} catch (e) {
  console.log("Error:", e);
}
