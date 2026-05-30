import { Database } from "bun:sqlite";

const db = new Database("apps/backend/argus_state.sqlite");

console.log("=== model_catalog (ALL) ===");
try {
  const models = db.query("SELECT * FROM model_catalog").all();
  for (const m of models) {
    const obj = m as Record<string, unknown>;
    console.log(`  ${obj.model_id} (${obj.provider})`);
  }
} catch (e) {
  console.log("Error:", e);
}

console.log("\n=== user_settings ===");
try {
  const settings = db.query("SELECT * FROM user_settings").all();
  for (const s of settings) {
    console.log(s);
  }
} catch (e) {
  console.log("Error:", e);
}

console.log("\n=== agent_config (ALL) ===");
try {
  const configs = db.query("SELECT agent_id, model_id FROM agent_config").all();
  for (const c of configs) {
    const obj = c as Record<string, unknown>;
    console.log(`  ${obj.agent_id}: ${obj.model_id}`);
  }
} catch (e) {
  console.log("Error:", e);
}
