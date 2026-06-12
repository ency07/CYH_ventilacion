// scripts/ensure-critical-users.mjs
// Validates and repairs critical user accounts without recreating passwords.
// Run: node scripts/ensure-critical-users.mjs
// Also called automatically from instrumentation.ts on server startup.

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_KEY || !DATABASE_URL) {
  console.error("❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL");
  process.exit(1);
}

// ─── Critical user definitions ────────────────────────────────────────────────
const CRITICAL_USERS = [
  {
    email: "admin@cyh.com",
    password: "AdminCYH2026*",
    fullName: "Administrador CYH",
    role: "root_dev",
  },
  {
    email: "gedeon07@gmail.com",
    password: "CYH123456!",
    fullName: "Gedeón Root",
    role: "root_dev",
  },
  {
    email: "cliente.prueba@cyh.com",
    password: "ClienteCYH2026*",
    fullName: "Cliente de Prueba",
    role: "cliente",
  },
];

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sql = postgres(DATABASE_URL, { ssl: "require", max: 3 });

async function ensureCriticalUsers() {
  console.log("\n🔐 CYH OS — Auth Seed Validator");
  console.log("=".repeat(50));

  let fixed = 0;
  let ok = 0;
  let created = 0;

  for (const def of CRITICAL_USERS) {
    console.log(`\n→ Checking: ${def.email}`);

    // 1. Check if user exists in Supabase Auth
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error(`  ❌ Cannot list users: ${listError.message}`);
      continue;
    }

    let authUser = listData.users.find(u => u.email?.toLowerCase() === def.email.toLowerCase());

    if (!authUser) {
      // Create in Supabase Auth
      console.log(`  ⚠  Not found in auth.users — Creating...`);
      const { data: created_user, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: def.email,
        password: def.password,
        email_confirm: true,
        user_metadata: { full_name: def.fullName },
      });
      if (createError) {
        console.error(`  ❌ Failed to create auth user: ${createError.message}`);
        continue;
      }
      authUser = created_user.user;
      console.log(`  ✅ Created in auth.users (id: ${authUser.id})`);
      created++;
    } else {
      console.log(`  ✓  Found in auth.users (id: ${authUser.id})`);
      
      // Always enforce the critical password to keep it aligned for tests
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, { 
        password: def.password,
        email_confirm: true 
      });
      console.log(`  🔧 Password and email confirmation enforced`);
    }

    // 2. Check if user exists in crm_users
    const existingRows = await sql`
      SELECT id, role, is_active FROM crm_users WHERE id = ${authUser.id}
    `;

    if (existingRows.length === 0) {
      // Insert into crm_users
      console.log(`  ⚠  Not found in crm_users — Inserting...`);
      await sql`
        INSERT INTO crm_users (id, email, full_name, role, is_active, created_at, preferences)
        VALUES (
          ${authUser.id},
          ${def.email},
          ${def.fullName},
          ${def.role},
          true,
          NOW(),
          ${{ theme: "system", language: "es", notifications: true }}::jsonb
        )
      `;
      console.log(`  ✅ Inserted into crm_users with role: ${def.role}`);
      created++;
    } else {
      const dbUser = existingRows[0];
      let needsFix = false;

      // Fix role if wrong
      if (dbUser.role !== def.role) {
        console.log(`  🔧 Fixing role: ${dbUser.role} → ${def.role}`);
        await sql`UPDATE crm_users SET role = ${def.role} WHERE id = ${authUser.id}`;
        needsFix = true;
      }

      // Fix inactive status
      if (!dbUser.is_active) {
        console.log(`  🔧 Reactivating suspended account`);
        await sql`UPDATE crm_users SET is_active = true, suspended_at = NULL WHERE id = ${authUser.id}`;
        needsFix = true;
      }

      if (needsFix) {
        console.log(`  ✅ Fixed`);
        fixed++;
      }
      
      // 3. For 'cliente' role, ensure B2B customer contact mapping is present
      if (def.role === "cliente") {
        const customerName = "Servicios Industriales del Caribe S.A.S.";

        // Check if company exists in crm_companies
        let companies = await sql`SELECT id FROM crm_companies WHERE name = ${customerName}`;
        let companyId;
        if (companies.length === 0) {
          console.log(`  ⚠  Company '${customerName}' not found — Creating...`);
          const [insertedCompany] = await sql`
            INSERT INTO crm_companies (name, city)
            VALUES (${customerName}, 'Barranquilla')
            RETURNING id
          `;
          companyId = insertedCompany.id;
        } else {
          companyId = companies[0].id;
        }

        // Check if customer exists in crm_customers
        let customers = await sql`SELECT id FROM crm_customers WHERE name = ${customerName}`;
        let customerId;
        if (customers.length === 0) {
          console.log(`  ⚠  Customer '${customerName}' not found — Creating...`);
          const [insertedCustomer] = await sql`
            INSERT INTO crm_customers (name, nit, status, ltv, recurrence_index)
            VALUES (${customerName}, '901.456.789-2', 'activo', 45000000, 85)
            RETURNING id
          `;
          customerId = insertedCustomer.id;
        } else {
          customerId = customers[0].id;
        }

        // Check if contact exists in crm_customer_contacts
        let contacts = await sql`SELECT id, user_id FROM crm_customer_contacts WHERE email = ${def.email}`;
        if (contacts.length === 0) {
          console.log(`  ⚠  Customer contact for '${def.email}' not found — Creating...`);
          await sql`
            INSERT INTO crm_customer_contacts (customer_id, full_name, cargo, phone, email, user_id)
            VALUES (${customerId}, ${def.fullName}, 'Director de Mantenimiento', '+573009998888', ${def.email}, ${authUser.id})
          `;
          console.log(`  ✅ Customer contact linked successfully.`);
        } else {
          const contact = contacts[0];
          if (contact.user_id !== authUser.id) {
            console.log(`  🔧 Linking contact user_id: ${contact.user_id} → ${authUser.id}`);
            await sql`
              UPDATE crm_customer_contacts 
              SET user_id = ${authUser.id}, customer_id = ${customerId}
              WHERE id = ${contact.id}
            `;
            console.log(`  ✅ Customer contact link fixed.`);
          } else {
            console.log(`  ✓  Customer contact linked OK`);
          }
        }
      }
    }
  }

  console.log("\n📦 Ensuring Storage Buckets exist...");
  try {
    const { data: buckets, error: getBucketsError } = await supabaseAdmin.storage.listBuckets();
    if (getBucketsError) throw getBucketsError;
    
    const requiredBuckets = ["branding", "media", "pdfs"];
    for (const b of requiredBuckets) {
      if (!buckets.some(bucket => bucket.id === b)) {
        console.log(`  ⚠ Bucket '${b}' not found — Creating public bucket...`);
        const { error: createBucketError } = await supabaseAdmin.storage.createBucket(b, { public: true });
        if (createBucketError) {
          console.error(`  ❌ Failed to create bucket '${b}': ${createBucketError.message}`);
        } else {
          console.log(`  ✅ Created bucket '${b}'`);
        }
      } else {
        console.log(`  ✓ Bucket '${b}' exists`);
      }
    }
  } catch (storageErr) {
    console.error(`  ❌ Storage buckets check failed: ${storageErr.message || storageErr}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Seed complete: ${ok} OK, ${fixed} fixed, ${created} created`);
  console.log("=".repeat(50) + "\n");

  await sql.end();
}

ensureCriticalUsers().catch(err => {
  console.error("❌ Fatal seed error:", err);
  process.exit(1);
});
