const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found in .env");
    process.exit(1);
  }

  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    const migrationPath = path.join(__dirname, '001_crm_enterprise_migration.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log("Executing Migration...");
    await sql.unsafe(migrationSql);
    console.log("Migration completed successfully.");
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

runMigration();
