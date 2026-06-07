import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const supabaseUrl = "https://soqjlmnphdubaxvhfvpj.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWpsbW5waGR1YmF4dmhmdnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA2ODkzNCwiZXhwIjoyMDk1NjQ0OTM0fQ.BAZ0P3zRYfYDBBLv06l-WNWVLmukSiQfnHL5OC9kGQ4";
const dbUrl = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const sql = postgres(dbUrl);

  const usersToCreate = [
    {
      email: "comercial@cyh.com",
      password: "AdminCYH2026*",
      fullName: "Asesor Comercial Test",
      role: "comercial"
    },
    {
      email: "ingeniero@cyh.com",
      password: "AdminCYH2026*",
      fullName: "Ingeniero Preventa Test",
      role: "ingeniero"
    },
    {
      email: "director@cyh.com",
      password: "AdminCYH2026*",
      fullName: "Director Comercial Test",
      role: "director_comercial"
    }
  ];

  console.log("=== CREATING TEST USERS IN AUTH & CRM_USERS ===");

  for (const item of usersToCreate) {
    try {
      console.log(`\nCreating auth user for: ${item.email}...`);

      // 1. Create user in Supabase Auth via Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: item.email,
        password: item.password,
        email_confirm: true,
        user_metadata: { full_name: item.fullName }
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          console.log(`User ${item.email} already exists in Auth. Updating database profile...`);
          // Fetch existing user to get ID
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
          const existingUser = listData?.users?.find(u => u.email === item.email);
          if (existingUser) {
            const userId = existingUser.id;
            console.log(`Existing Auth User ID: ${userId}`);

            // Upsert in public.crm_users
            await sql`
              INSERT INTO "crm_users" ("id", "email", "full_name", "role", "created_at")
              VALUES (${userId}, ${item.email}, ${item.fullName}, ${item.role}, NOW())
              ON CONFLICT ("id") DO UPDATE
              SET "role" = ${item.role}, "full_name" = ${item.fullName};
            `;
            console.log(`Successfully updated profile in public.crm_users.`);
          }
        } else {
          console.error(`Error creating user ${item.email}:`, error.message);
        }
      } else if (data && data.user) {
        const userId = data.user.id;
        console.log(`Auth User created successfully. ID: ${userId}`);

        // 2. Insert profile in public.crm_users
        await sql`
          INSERT INTO "crm_users" ("id", "email", "full_name", "role", "created_at")
          VALUES (${userId}, ${item.email}, ${item.fullName}, ${item.role}, NOW())
          ON CONFLICT ("id") DO UPDATE
          SET "role" = ${item.role}, "full_name" = ${item.fullName};
        `;
        console.log(`Successfully created profile in public.crm_users.`);
      }
    } catch (err) {
      console.error(`Failed for ${item.email}:`, err);
    }
  }

  await sql.end();
  console.log("\n=== PROCESS COMPLETED ===");
}

main();
