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
} catch (e) {}

if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require", max: 1 });

async function list() {
  console.log("--- Clients in crm_users ---");
  const clients = await sql`
    SELECT u.id, u.email, u.full_name, c.name as customer_name
    FROM crm_users u
    LEFT JOIN crm_customer_contacts cc ON cc.user_id = u.id
    LEFT JOIN crm_customers c ON c.id = cc.customer_id
    WHERE u.role = 'cliente'
    LIMIT 10
  `;
  console.log(clients);
  await sql.end();
}

list().catch(console.error);
