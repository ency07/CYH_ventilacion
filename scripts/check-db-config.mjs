import postgres from "postgres";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
let databaseUrl = process.env.DATABASE_URL;

try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key === "DATABASE_URL") databaseUrl = val;
  }
} catch {}

if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require", max: 1 });

async function checkConfig() {
  console.log("--- crm_users ---");
  const users = await sql`SELECT id, email, role, tenant_id FROM crm_users WHERE email IN ('admin@cyh.com', 'gedeon07@gmail.com', 'cliente.prueba@cyh.com')`;
  console.log(users);

  await sql.end();
}

checkConfig().catch(console.error);
