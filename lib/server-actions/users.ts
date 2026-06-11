"use server";

import { db } from "@/lib/db";
import { crmUsers, crmAuditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
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
    await requireRole(["root_dev", "admin", "super_admin", "director_comercial"]);

    const users = await db.select().from(crmUsers);
    return { success: true, data: users };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al obtener lista de usuarios." };
  }
}

export async function updateCrmUserAction(userId: string, data: { fullName?: string; role?: string }): Promise<ActionResult<typeof crmUsers.$inferSelect>> {
  try {
    const currentUser = await requireRole(["root_dev", "admin", "super_admin", "director", "director_comercial", "vendedor", "comercial", "tecnico", "ingeniero"]);

    const isSelf = currentUser.id === userId;
    const isAuthorizedAdmin = ["admin", "super_admin", "root_dev"].includes(currentUser.role);

    if (!isSelf && !isAuthorizedAdmin) {
      return { success: false, error: "Acceso denegado. No tienes permisos para modificar otros usuarios." };
    }

    if (data.role && !isAuthorizedAdmin) {
      return { success: false, error: "Acceso denegado. Solo administradores pueden cambiar roles." };
    }

    const reqHeaders = headers();
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const updated = await db.transaction(async (tx) => {
      // 1. Fetch current target state
      const [targetUser] = await tx.select().from(crmUsers).where(eq(crmUsers.id, userId));
      if (!targetUser) {
        throw new Error("Usuario no encontrado.");
      }

      // 2. Role Partition security checks
      if (targetUser.role === "root_dev" && currentUser.role !== "root_dev") {
        throw new Error("Acceso denegado. Solo un root_dev puede modificar a otro root_dev.");
      }

      if (data.role === "root_dev" && currentUser.role !== "root_dev") {
        throw new Error("Acceso denegado. Solo un root_dev puede asignar el rol de root_dev.");
      }

      // 3. Perform update
      const [up] = await tx.update(crmUsers)
        .set({ 
          ...(data.fullName ? { fullName: data.fullName } : {}),
          ...(data.role ? { role: data.role } : {})
        })
        .where(eq(crmUsers.id, userId))
        .returning();

      if (!up) {
        throw new Error("No se pudo actualizar el perfil.");
      }

      // 4. Log role change
      if (data.role && targetUser.role !== data.role) {
        await tx.insert(crmAuditLogs).values({
          actorId: currentUser.id,
          action: "update_user_role",
          entityAffected: `crm_users:${userId}`,
          metadata: {
            previousRole: targetUser.role,
            newRole: data.role,
            userId: userId,
          },
          ipAddress,
          userAgent,
        });
      }

      return up;
    });

    revalidatePath("/crm/ajustes");
    revalidatePath("/crm/usuarios");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar usuario." };
  }
}

export async function suspendCrmUserAction(userId: string): Promise<ActionResult<typeof crmUsers.$inferSelect>> {
  try {
    const currentUser = await requireRole(["root_dev", "admin", "super_admin"]);

    const reqHeaders = headers();
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const updated = await db.transaction(async (tx) => {
      const [targetUser] = await tx.select().from(crmUsers).where(eq(crmUsers.id, userId));
      if (!targetUser) {
        throw new Error("Usuario no encontrado.");
      }

      if (targetUser.role === "root_dev" && currentUser.role !== "root_dev") {
        throw new Error("Acceso denegado. Un administrador no puede suspender a un root_dev.");
      }

      const [suspended] = await tx.update(crmUsers)
        .set({
          isActive: false,
          suspendedAt: new Date(),
          suspendedBy: currentUser.id,
        })
        .where(eq(crmUsers.id, userId))
        .returning();

      if (!suspended) {
        throw new Error("No se pudo suspender el usuario.");
      }

      await tx.insert(crmAuditLogs).values({
        actorId: currentUser.id,
        action: "suspend_user",
        entityAffected: `crm_users:${userId}`,
        metadata: {
          userId: userId,
          action: "suspend",
        },
        ipAddress,
        userAgent,
      });

      return suspended;
    });

    revalidatePath("/crm/ajustes");
    revalidatePath("/crm/usuarios");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al suspender usuario." };
  }
}

export async function reactivateCrmUserAction(userId: string): Promise<ActionResult<typeof crmUsers.$inferSelect>> {
  try {
    const currentUser = await requireRole(["root_dev", "admin", "super_admin"]);

    const reqHeaders = headers();
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const updated = await db.transaction(async (tx) => {
      const [targetUser] = await tx.select().from(crmUsers).where(eq(crmUsers.id, userId));
      if (!targetUser) {
        throw new Error("Usuario no encontrado.");
      }

      if (targetUser.role === "root_dev" && currentUser.role !== "root_dev") {
        throw new Error("Acceso denegado. Un administrador no puede reactivar a un root_dev.");
      }

      const [reactivated] = await tx.update(crmUsers)
        .set({
          isActive: true,
          suspendedAt: null,
          suspendedBy: null,
        })
        .where(eq(crmUsers.id, userId))
        .returning();

      if (!reactivated) {
        throw new Error("No se pudo reactivar el usuario.");
      }

      await tx.insert(crmAuditLogs).values({
        actorId: currentUser.id,
        action: "reactivate_user",
        entityAffected: `crm_users:${userId}`,
        metadata: {
          userId: userId,
          action: "reactivate",
        },
        ipAddress,
        userAgent,
      });

      return reactivated;
    });

    revalidatePath("/crm/ajustes");
    revalidatePath("/crm/usuarios");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al reactivar usuario." };
  }
}

export async function deleteCrmUserAction(userId: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const currentUser = await requireRole(["root_dev"]);

    const reqHeaders = headers();
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await db.transaction(async (tx) => {
      const [targetUser] = await tx.select().from(crmUsers).where(eq(crmUsers.id, userId));
      if (!targetUser) {
        throw new Error("Usuario no encontrado.");
      }

      // Log permanent deletion first before profile row is deleted
      await tx.insert(crmAuditLogs).values({
        actorId: currentUser.id,
        action: "delete_user_permanent",
        entityAffected: `crm_users:${userId}`,
        metadata: {
          userId: userId,
          email: targetUser.email,
        },
        ipAddress,
        userAgent,
      });

      await tx.delete(crmUsers).where(eq(crmUsers.id, userId));
    });

    revalidatePath("/crm/ajustes");
    revalidatePath("/crm/usuarios");
    return { success: true, data: { success: true } };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al eliminar usuario." };
  }
}
