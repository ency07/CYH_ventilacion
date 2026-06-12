"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { crmUsers, crmAuditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// ─── Get current user profile ────────────────────────────────────────────────
export async function getProfileAction() {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    if (!dbUser) return { success: false, error: "Usuario no encontrado" };

    // Fetch last 20 audit log entries for this user (access history)
    const auditHistory = await db
      .select()
      .from(crmAuditLogs)
      .where(eq(crmAuditLogs.actorId, user.id))
      .orderBy(desc(crmAuditLogs.createdAt))
      .limit(20);

    return {
      success: true,
      data: {
        user: dbUser,
        authUser: {
          email: user.email,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at,
          emailConfirmed: !!user.email_confirmed_at,
        },
        auditHistory,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Update profile data ──────────────────────────────────────────────────────
export async function updateProfileAction(data: {
  fullName: string;
  phone?: string;
  position?: string;
  avatarUrl?: string;
}) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    await db
      .update(crmUsers)
      .set({
        fullName: data.fullName?.trim() || null,
        phone: data.phone?.trim() || null,
        position: data.position?.trim() || null,
        avatarUrl: data.avatarUrl?.trim() || null,
      })
      .where(eq(crmUsers.id, user.id));

    revalidatePath("/crm/perfil");
    revalidatePath("/crm", "layout");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Update theme preference ──────────────────────────────────────────────────
export async function updateThemePreferenceAction(theme: "dark" | "light" | "system") {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    const currentPrefs = dbUser?.preferences || { theme: "system", language: "es", notifications: true };

    await db
      .update(crmUsers)
      .set({
        preferences: { ...currentPrefs, theme },
      })
      .where(eq(crmUsers.id, user.id));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Update language preference ───────────────────────────────────────────────
export async function updateLanguagePreferenceAction(language: "es" | "en") {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    const currentPrefs = dbUser?.preferences || { theme: "system", language: "es", notifications: true };

    await db
      .update(crmUsers)
      .set({
        preferences: { ...currentPrefs, language },
      })
      .where(eq(crmUsers.id, user.id));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Change password ──────────────────────────────────────────────────────────
export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    // Re-authenticate to verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: data.currentPassword,
    });
    if (signInError) return { success: false, error: "Contraseña actual incorrecta" };

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });
    if (updateError) return { success: false, error: updateError.message };

    // Log the action
    try {
      const hdrs = headers();
      const ip = hdrs.get("x-forwarded-for") || hdrs.get("x-real-ip") || "unknown";
      const ua = hdrs.get("user-agent") || "unknown";
      await db.insert(crmAuditLogs).values({
        actorId: user.id,
        action: "password_changed",
        entityAffected: `user:${user.id}`,
        metadata: { userId: user.id, email: user.email! },
        ipAddress: ip,
        userAgent: ua,
      });
    } catch {} // audit log is non-critical

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Get user's saved theme preference ───────────────────────────────────────
export async function getUserThemePreferenceAction(): Promise<"dark" | "light" | "system"> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "system";

    const [dbUser] = await db.select({ preferences: crmUsers.preferences })
      .from(crmUsers)
      .where(eq(crmUsers.id, user.id));

    return (dbUser?.preferences?.theme as "dark" | "light" | "system") || "system";
  } catch {
    return "system";
  }
}

// ─── Update last_login_at ─────────────────────────────────────────────────────
export async function recordLoginAction(userId: string) {
  try {
    await db
      .update(crmUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(crmUsers.id, userId));
  } catch {} // non-critical
}
