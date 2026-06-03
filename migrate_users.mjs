import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Creating crm_users table...");

    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'vendedor' NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log("Table crm_users created successfully.");

    // Check if the current authenticated users exist, if not, we can't reliably backfill without hitting auth.users
    // Supabase auth.users is in auth schema, we have privileges over public.
    console.log("Success! Users table migration completed.");
  } catch (err) {
    console.error("Error executing migration:", err);
  } finally {
    await sql.end();
  }
}

run();
