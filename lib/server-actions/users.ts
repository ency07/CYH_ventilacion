"use server";

import { db } from "@/lib/db";
import { crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getCurrentUserAction(): Promise<ActionResult<any>> {
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
      // Auto-create profile if missing
      const [newProfile] = await db.insert(crmUsers).values({
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuario",
        role: "asesor_comercial",
      }).returning();
      return { success: true, data: newProfile };
    }
    
    return { success: true, data: profile };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAllCrmUsersAction(): Promise<ActionResult<any[]>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const users = await db.select().from(crmUsers);
    return { success: true, data: users };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateCrmUserAction(userId: string, data: { fullName?: string; role?: string }): Promise<ActionResult<any>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const isSelf = user.id === userId;
    const [currentUserProfile] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    const isAuthorizedAdmin = currentUserProfile && ["admin", "super_admin"].includes(currentUserProfile.role);

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
    return { success: false, error: err.message };
  }
}
