"use server";

import { db } from "@/lib/db";
import { crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/permissions";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getCurrentUserAction(): Promise<ActionResult<typeof crmUsers.$inferSelect>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("cyh-crm-session")?.value;
    
    if (!token) return { success: false, error: "No session found" };
    
    const supabase = getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { success: false, error: error?.message || "User not authenticated" };
    }
    
    const [profile] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    
    if (!profile) {
      console.warn(`[AppSec Warning] Intento de acceso sin perfil registrado en crm_users: ${user.email}`);
      return { success: false, error: "Acceso Denegado: Usuario no registrado." };
    }
    
    return { success: true, data: profile };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al obtener usuario actual." };
  }
}

export async function getAllCrmUsersAction(): Promise<ActionResult<typeof crmUsers.$inferSelect[]>> {
  try {
    await requireRole(["admin", "super_admin", "director_comercial"]);

    const users = await db.select().from(crmUsers);
    return { success: true, data: users };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al obtener lista de usuarios." };
  }
}

export async function updateCrmUserAction(userId: string, data: { fullName?: string; role?: string }): Promise<ActionResult<typeof crmUsers.$inferSelect>> {
  try {
    const currentUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial", "tecnico", "ingeniero"]);

    const isSelf = currentUser.id === userId;
    const isAuthorizedAdmin = ["admin", "super_admin"].includes(currentUser.role);

    if (!isSelf && !isAuthorizedAdmin) {
      return { success: false, error: "Acceso denegado. No tienes permisos para modificar otros usuarios." };
    }

    if (data.role && !isAuthorizedAdmin) {
      return { success: false, error: "Acceso denegado. Solo administradores pueden cambiar roles." };
    }

    const [updated] = await db.update(crmUsers)
      .set({ 
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.role ? { role: data.role } : {})
      })
      .where(eq(crmUsers.id, userId))
      .returning();
      
    revalidatePath("/crm/ajustes");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar usuario." };
  }
}
