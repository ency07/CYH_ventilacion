// scripts/run-profile-migration.mjs
// Direct migration runner using postgres connection
// Run: node scripts/run-profile-migration.mjs

import postgres from "postgres";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
const env = readFileSync(envPath, "utf8");
for (const line of env.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
  process.env[key] = val;
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function run() {
  try {
    console.log("🔧 Running profile migration...");
    
    await sql`
      ALTER TABLE crm_users 
        ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme":"system","language":"es","notifications":true}'::jsonb,
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS position VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ
    `;
    
    await sql`
      UPDATE crm_users 
      SET preferences = '{"theme":"system","language":"es","notifications":true}'::jsonb
      WHERE preferences IS NULL
    `;
    
    console.log("✅ Migration complete: preferences, phone, position, last_login_at added to crm_users");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
