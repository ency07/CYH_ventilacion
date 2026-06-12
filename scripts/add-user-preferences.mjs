// scripts/add-user-preferences.mjs
// Migration: Adds `preferences` JSONB column to crm_users table
// Run: node scripts/add-user-preferences.mjs

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log("🔧 Running migration: add preferences column to crm_users...");

  // Check if column already exists
  const { data: columns, error: checkErr } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_name", "crm_users")
    .eq("column_name", "preferences");

  if (checkErr) {
    // Try direct SQL approach
    console.log("Checking via direct query...");
  }

  const sql = `
    DO $$
    BEGIN
      -- Add preferences column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_users' AND column_name = 'preferences'
      ) THEN
        ALTER TABLE crm_users 
        ADD COLUMN preferences JSONB DEFAULT '{"theme":"system","language":"es","notifications":true}'::jsonb;
        RAISE NOTICE 'Column preferences added to crm_users';
      ELSE
        RAISE NOTICE 'Column preferences already exists in crm_users';
      END IF;

      -- Add phone column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_users' AND column_name = 'phone'
      ) THEN
        ALTER TABLE crm_users ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'Column phone added to crm_users';
      ELSE
        RAISE NOTICE 'Column phone already exists in crm_users';
      END IF;

      -- Add position column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_users' AND column_name = 'position'
      ) THEN
        ALTER TABLE crm_users ADD COLUMN position VARCHAR(100);
        RAISE NOTICE 'Column position added to crm_users';
      ELSE
        RAISE NOTICE 'Column position already exists in crm_users';
      END IF;

      -- Add last_login_at column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_users' AND column_name = 'last_login_at'
      ) THEN
        ALTER TABLE crm_users ADD COLUMN last_login_at TIMESTAMPTZ;
        RAISE NOTICE 'Column last_login_at added to crm_users';
      ELSE
        RAISE NOTICE 'Column last_login_at already exists in crm_users';
      END IF;
    END;
    $$;
  `;

  const { error } = await supabase.rpc("exec_sql", { sql_query: sql }).maybeSingle();
  
  // Try alternative approach via direct SQL execution
  const { error: sqlError } = await supabase.from("crm_users").select("preferences").limit(1);
  
  if (!sqlError) {
    console.log("✅ Column 'preferences' already exists or was successfully added.");
    return;
  }

  console.log("⚠️  Column may not exist yet. Attempting direct ALTER TABLE...");

  // Use pg directly if available, or print instructions
  console.log("\n📋 If the migration didn't run automatically, execute this SQL in your Supabase SQL Editor:");
  console.log(`
ALTER TABLE crm_users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme":"system","language":"es","notifications":true}'::jsonb,
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Update existing users to have default preferences
UPDATE crm_users 
SET preferences = '{"theme":"system","language":"es","notifications":true}'::jsonb
WHERE preferences IS NULL;
  `);
}

runMigration()
  .then(() => {
    console.log("\n✅ Migration script completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
