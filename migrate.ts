import { db } from "./lib/db/index.js";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("Starting manual migration...");
  
  try {
    // 3. Create crm_opportunities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "crm_opportunities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE cascade,
        "title" varchar(255) NOT NULL,
        "estimated_value" integer NOT NULL,
        "probability" integer DEFAULT 50 NOT NULL,
        "weighted_value" integer NOT NULL,
        "expected_close_date" timestamp,
        "stage" varchar(50) NOT NULL,
        "assigned_to" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Created crm_opportunities table");

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

runMigration();
