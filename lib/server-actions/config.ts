"use server";

import { db } from "@/lib/db";
import { 
  crmTenantConfig, 
  crmTenantBranding, 
  crmTenantIntegrations, 
  crmMediaLibrary, 
  crmAuditLogs 
} from "@/lib/db/schema";
import { getCurrentUser, requireRole } from "@/lib/auth/permissions";
import { getSupabaseServer } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Retrieves the active tenant, branding, and integrations configuration.
 * Automatically seeds default rows if none exist in the database.
 * Integrations credentials are redacted for non-admin/non-root_dev roles.
 */
export async function getTenantBrandingAction(): Promise<ActionResult<{
  config: typeof crmTenantConfig.$inferSelect;
  branding: typeof crmTenantBranding.$inferSelect;
  integrations: typeof crmTenantIntegrations.$inferSelect | null;
}>> {
  try {
    // 1. Resolve configuration through a self-healing transaction block
    const data = await db.transaction(async (tx) => {
      let [config] = await tx.select().from(crmTenantConfig).limit(1);
      
      if (!config) {
        [config] = await tx.insert(crmTenantConfig).values({
          companyName: "CYH Ventilación",
          nit: "900.000.000-0",
          email: "info@cyhventilacion.com",
          phone: "+5753000000",
          address: "Vía 40 # 73-290, Barranquilla",
          isActive: true,
        }).returning();
      }

      let [branding] = await tx
        .select()
        .from(crmTenantBranding)
        .where(eq(crmTenantBranding.tenantId, config.id))
        .limit(1);

      if (!branding) {
        [branding] = await tx.insert(crmTenantBranding).values({
          tenantId: config.id,
          logoUrl: null,
          primaryColor: "#0f172a",
          secondaryColor: "#0ea5e9",
          customCss: "",
          portalName: "Portal Cliente B2B",
        }).returning();
      }

      let [integrations] = await tx
        .select()
        .from(crmTenantIntegrations)
        .where(eq(crmTenantIntegrations.tenantId, config.id))
        .limit(1);

      if (!integrations) {
        [integrations] = await tx.insert(crmTenantIntegrations).values({
          tenantId: config.id,
          telegramBotToken: "",
          telegramChatIdVentas: "",
          telegramChatIdServicio: "",
          telegramChatIdIngenieria: "",
          telegramChatIdDireccion: "",
          telegramChatIdPostventa: "",
          resendApiKey: "",
          twilioAccountSid: "",
          twilioAuthToken: "",
          twilioWhatsappFrom: "",
        }).returning();
      }

      return { config, branding, integrations };
    });

    // 2. Resolve authentication scope to check if integration credentials should be returned
    let user = null;
    try {
      user = await getCurrentUser();
    } catch (e) {
      // Ignored: Guest context (e.g. unauthenticated login page)
    }

    const hasPrivilegedAccess = user && (user.role === "admin" || user.role === "root_dev");

    return {
      success: true,
      data: {
        config: data.config,
        branding: data.branding,
        integrations: hasPrivilegedAccess ? data.integrations : null,
      }
    };
  } catch (error: any) {
    console.error("Error fetching tenant branding configuration:", error);
    return { success: false, error: error.message || "Fallo al consultar la configuración." };
  }
}

/**
 * Atomically updates tenant configuration, branding settings, and credentials integration vaults.
 * Restricted strictly to 'admin' and 'root_dev' roles.
 */
export async function updateTenantBrandingAction(
  configData: {
    companyName: string;
    nit: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  },
  brandingData: {
    logoUrl?: string | null;
    primaryColor: string;
    secondaryColor: string;
    customCss?: string | null;
    portalName: string;
  },
  integrationData?: {
    telegramBotToken?: string | null;
    telegramChatIdVentas?: string | null;
    telegramChatIdServicio?: string | null;
    telegramChatIdIngenieria?: string | null;
    telegramChatIdDireccion?: string | null;
    telegramChatIdPostventa?: string | null;
    resendApiKey?: string | null;
    twilioAccountSid?: string | null;
    twilioAuthToken?: string | null;
    twilioWhatsappFrom?: string | null;
  }
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // 1. Authenticate role requirements
    const user = await requireRole(["admin", "root_dev"]);
    const reqHeaders = headers();
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    // 2. Execute update transaction block
    await db.transaction(async (tx) => {
      // Fetch active config to update
      const [config] = await tx.select().from(crmTenantConfig).limit(1);
      if (!config) {
        throw new Error("Configuración del inquilino no encontrada.");
      }

      // Update Tenant Configuration
      await tx
        .update(crmTenantConfig)
        .set({
          companyName: configData.companyName,
          nit: configData.nit,
          email: configData.email,
          phone: configData.phone,
          address: configData.address,
          updatedAt: new Date(),
        })
        .where(eq(crmTenantConfig.id, config.id));

      // Update Branding Parameters
      await tx
        .update(crmTenantBranding)
        .set({
          logoUrl: brandingData.logoUrl,
          primaryColor: brandingData.primaryColor,
          secondaryColor: brandingData.secondaryColor,
          customCss: brandingData.customCss,
          portalName: brandingData.portalName,
          updatedAt: new Date(),
        })
        .where(eq(crmTenantBranding.tenantId, config.id));

      // Update Integration Parameters if provided
      if (integrationData) {
        await tx
          .update(crmTenantIntegrations)
          .set({
            telegramBotToken: integrationData.telegramBotToken,
            telegramChatIdVentas: integrationData.telegramChatIdVentas,
            telegramChatIdServicio: integrationData.telegramChatIdServicio,
            telegramChatIdIngenieria: integrationData.telegramChatIdIngenieria,
            telegramChatIdDireccion: integrationData.telegramChatIdDireccion,
            telegramChatIdPostventa: integrationData.telegramChatIdPostventa,
            resendApiKey: integrationData.resendApiKey,
            twilioAccountSid: integrationData.twilioAccountSid,
            twilioAuthToken: integrationData.twilioAuthToken,
            twilioWhatsappFrom: integrationData.twilioWhatsappFrom,
            updatedAt: new Date(),
          })
          .where(eq(crmTenantIntegrations.tenantId, config.id));
      }

      // 3. Write audit log entry (Pilar X)
      await tx.insert(crmAuditLogs).values({
        actorId: user.id,
        action: "update_tenant_configuration",
        entityAffected: `crm_tenant_config:${config.id}`,
        metadata: {
          updaterRole: user.role,
          companyName: configData.companyName,
          primaryColor: brandingData.primaryColor,
          secondaryColor: brandingData.secondaryColor,
        },
        ipAddress,
        userAgent,
      });
    });

    // 4. Revalidate application cache directories
    revalidatePath("/");
    revalidatePath("/login");
    revalidatePath("/crm");
    revalidatePath("/portal/inicio");
    revalidatePath("/ops/configuracion");

    return { success: true, data: { success: true } };
  } catch (error: any) {
    console.error("Error updating tenant configurations:", error);
    return { success: false, error: error.message || "Fallo al guardar la configuración." };
  }
}

/**
 * Uploads media assets (like corporate logos or certification files) to Supabase Storage,
 * registers the entry in crm_media_library, and returns the public file URL.
 */
export async function uploadMediaAction(formData: FormData): Promise<ActionResult<string>> {
  try {
    // 1. Authenticate user - restrict to internal staff roles
    const user = await requireRole(["admin", "root_dev", "vendedor", "comercial", "tecnico", "ingeniero"]);

    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No se proporcionó ningún archivo para subir.");
    }

    // Convert file object to Buffer for Supabase Storage Upload SDK compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Initialize Supabase Storage Client
    const supabase = getSupabaseServer();
    const bucketName = "media";

    // Ensure bucket exists
    try {
      await supabase.storage.createBucket(bucketName, { public: true });
    } catch (e) {
      // Ignored: bucket already created
    }

    const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

    // 3. Upload file content to Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error en almacenamiento: ${uploadError.message}`);
    }

    // 4. Get public URL of uploaded file
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(uniqueFileName);
    const publicUrl = urlData.publicUrl;

    // 5. Register entry in media library table
    await db.insert(crmMediaLibrary).values({
      fileName: file.name,
      fileUrl: publicUrl,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: user.id,
    });

    return { success: true, data: publicUrl };
  } catch (error: any) {
    console.error("Error uploading media assets:", error);
    return { success: false, error: error.message || "Fallo al subir el archivo." };
  }
}
