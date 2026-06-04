import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const supabaseUrl = "https://soqjlmnphdubaxvhfvpj.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWpsbW5waGR1YmF4dmhmdnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA2ODkzNCwiZXhwIjoyMDk1NjQ0OTM0fQ.BAZ0P3zRYfYDBBLv06l-WNWVLmukSiQfnHL5OC9kGQ4";
const dbUrl = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const sql = postgres(dbUrl, { prepare: false });

async function createAdmin() {
  console.log("Creando usuario admin en Supabase Auth...");
  
  const email = "admin@cyh.com";
  const password = "AdminCYH2026*";

  // Crear usuario
  const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "CYH Super Admin" }
  });

  if (authError) {
    if (authError.message.includes("already exists")) {
      console.log("El usuario ya existe, actualizando la contraseña...");
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);
      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, { password });
        console.log("Contraseña actualizada con éxito.");
        await ensureRole(existingUser.id, email);
      }
    } else {
      console.error("Error al crear usuario:", authError);
    }
  } else if (user) {
    console.log("Usuario creado en Supabase Auth con ID:", user.id);
    await ensureRole(user.id, email);
  }
  
  await sql.end();
}

async function ensureRole(id, email) {
  console.log("Asegurando rol en crm_users...");
  const exists = await sql`SELECT * FROM crm_users WHERE id = ${id}`;
  if (exists.length === 0) {
    await sql`INSERT INTO crm_users (id, email, full_name, role) VALUES (${id}, ${email}, 'CYH Super Admin', 'super_admin')`;
    console.log("Perfil super_admin creado en crm_users.");
  } else {
    await sql`UPDATE crm_users SET role = 'super_admin' WHERE id = ${id}`;
    console.log("Rol actualizado a super_admin en crm_users.");
  }
}

createAdmin().catch(console.error);
