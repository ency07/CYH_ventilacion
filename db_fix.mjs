import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Renaming column 'position' to 'cargo' in 'leads' table...");
    await sql`ALTER TABLE leads RENAME COLUMN position TO cargo;`;
    console.log("Success! Column renamed.");
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      console.log("Column 'position' might not exist or already renamed. Checking if 'cargo' exists...");
      try {
        await sql`SELECT cargo FROM leads LIMIT 1;`;
        console.log("'cargo' column already exists!");
      } catch (e) {
        console.error("Error verifying cargo column:", e);
      }
    } else {
      console.error("Error executing SQL:", err);
    }
  } finally {
    await sql.end();
  }
}

run();
