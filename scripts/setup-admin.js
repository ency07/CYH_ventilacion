
const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = postgres(process.env.DATABASE_URL);

async function setupAdmin() {
  const email = 'admin@cyh.com';
  const password = 'AdminCYH2026*';

  try {
    console.log(`Buscando usuario ${email}...`);
    
    // Attempt to create user
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    let userId;

    if (createError) {
      if (createError.message.includes('already exists') || createError.code === 'user_already_exists' || createError.code === 'email_exists') {
        console.log('El usuario ya existe. Forzando actualización de contraseña...');
        
        // Find user by email to get ID
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = usersData.users.find(u => u.email === email);
        if (!existingUser) {
           throw new Error("No se pudo encontrar el usuario en la lista.");
        }
        
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: password, email_confirm: true }
        );
        if (updateError) throw updateError;
        
        userId = existingUser.id;
        console.log('Contraseña actualizada correctamente.');
      } else {
        throw createError;
      }
    } else {
      userId = user.id;
      console.log('Usuario creado exitosamente.');
    }

    // Insert or update in crm_users table
    console.log(`Asegurando que exista en crm_users con ID ${userId}...`);
    await sql`
      INSERT INTO crm_users (id, email, full_name, role)
      VALUES (${userId}, ${email}, 'Admin Principal CYH', 'admin')
      ON CONFLICT (id) DO UPDATE SET role = 'admin';
    `;
    
    console.log("¡Todo listo! Ya puedes ingresar con admin@cyh.com");
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupAdmin();
