"use server";

import { getSupabaseServer as createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data?.user) {
    return { error: "No se pudo obtener el usuario autenticado." };
  }

  // Get profile role
  const { data: profile } = await supabase
    .from("crm_users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Acceso Denegado: Su usuario no está registrado en el sistema." };
  }

  const role = profile.role || "cliente";

  revalidatePath("/", "layout");

  if (role === "admin" || role === "super_admin" || role === "director" || role === "director_comercial") {
    redirect("/crm/dashboard");
  } else if (role === "vendedor" || role === "comercial") {
    redirect("/crm/pipeline");
  } else if (role === "tecnico" || role === "ingeniero") {
    redirect("/crm/dashboard/tecnico");
  } else {
    redirect("/portal/inicio");
  }
}

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const company = formData.get("company") as string;
  const position = formData.get("position") as string;

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company,
        position,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Insert en la tabla de perfiles usando service_role o trigger
  // Aquí usamos el cliente autenticado asumiendo que el insert_policy lo permite
  if (data.user) {
    await supabase.from("crm_users").insert({
      id: data.user.id,
      email: email,
      full_name: fullName,
      role: 'cliente' // Default restricted role instead of vendedor
    });

    // Link existing leads with this email to the new user ID in drizzle db
    await db.update(leads)
      .set({ createdBy: data.user.id })
      .where(eq(leads.email, email.toLowerCase()));
  }

  return { success: "Revisa tu correo para confirmar tu cuenta." };
}

export async function recoverPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Instrucciones de recuperación enviadas a tu correo." };
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/login");
}
