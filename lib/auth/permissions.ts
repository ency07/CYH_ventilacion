import { getSupabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
  if (!dbUser) {
    throw new Error("Usuario no encontrado en la base de datos");
  }

  return dbUser;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();

  const validRoles = [
    "admin",
    "super_admin",
    "director",
    "director_comercial",
    "vendedor",
    "comercial",
    "tecnico",
    "ingeniero",
    "cliente"
  ];

  if (!user.role || !validRoles.includes(user.role)) {
    throw new Error("Acceso Denegado: Rol inválido");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Acceso Denegado");
  }

  return user;
}
