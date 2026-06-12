"use server";

import { db } from "@/lib/db";
import { 
  crmTenantConfig, 
  crmTenantBranding, 
  crmTenantIntegrations, 
  crmMediaLibrary, 
  crmAuditLogs,
  crmProducts
} from "@/lib/db/schema";
import { getCurrentUser, requireRole } from "@/lib/auth/permissions";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { eq, desc, asc } from "drizzle-orm";
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
    // Resolve user context first to get tenantId if available
    let user = null;
    try {
      user = await getCurrentUser();
    } catch (e) {
      // Ignored: Guest context (e.g. unauthenticated login page)
    }

    const tenantId = user?.tenantId;

    // 1. Resolve configuration through a self-healing transaction block
    const data = await db.transaction(async (tx) => {
      let config;
      if (tenantId) {
        [config] = await tx.select().from(crmTenantConfig).where(eq(crmTenantConfig.id, tenantId)).limit(1);
      } else {
        [config] = await tx.select().from(crmTenantConfig).orderBy(asc(crmTenantConfig.id)).limit(1);
      }
      
      if (!config) {
        const insertValues: any = {
          companyName: "CYH Ventilación",
          nit: "900.000.000-0",
          email: "info@cyhventilacion.com",
          phone: "+5753000000",
          address: "Vía 40 # 73-290, Barranquilla",
          isActive: true,
        };
        if (tenantId) {
          insertValues.id = tenantId;
        }
        [config] = await tx.insert(crmTenantConfig).values(insertValues).returning();
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
          logoDarkUrl: null,
          faviconUrl: null,
          loginBgUrl: null,
          portalBgUrl: null,
          primaryColor: "#0f172a",
          secondaryColor: "#0ea5e9",
          btnColor: "#0ea5e9",
          sidebarColor: "#0f172a",
          loginColor: "#0f172a",
          portalColor: "#0f172a",
          customCss: "",
          portalName: "Portal Cliente B2B",
          crmConfig: {
            showDashboard: true,
            showReports: true,
            showAlerts: true,
            showFinances: true,
            showDiagnostics: true
          },
          pipelineStages: [
            { name: "Nuevo Prospecto", prob: 10, color: "bg-slate-500" },
            { name: "Diagnóstico Técnico", prob: 30, color: "bg-blue-500" },
            { name: "Propuesta Enviada", prob: 60, color: "bg-amber-500" },
            { name: "Negociación / Cierre", prob: 80, color: "bg-purple-500" },
            { name: "Cerrado Ganado", prob: 100, color: "bg-emerald-500" }
          ],
          portalConfig: {
            welcomeMessage: "Bienvenido a su portal corporativo.",
            modules: {
              solicitudes: true,
              facturas: true,
              activos: true,
              contratos: true,
              warRooms: true,
              diagnosticos: true
            },
            menuOrder: ["Inicio", "Solicitudes", "Activos", "Facturas", "Contratos"]
          }
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
    logoDarkUrl?: string | null;
    faviconUrl?: string | null;
    loginBgUrl?: string | null;
    portalBgUrl?: string | null;
    primaryColor: string;
    secondaryColor: string;
    btnColor: string;
    sidebarColor: string;
    loginColor: string;
    portalColor: string;
    customCss?: string | null;
    portalName: string;
    crmConfig?: any;
    pipelineStages?: any;
    portalConfig?: any;
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
    const tenantId = user.tenantId;
    await db.transaction(async (tx) => {
      // Fetch active config to update
      let config;
      if (tenantId) {
        [config] = await tx.select().from(crmTenantConfig).where(eq(crmTenantConfig.id, tenantId)).limit(1);
      } else {
        [config] = await tx.select().from(crmTenantConfig).orderBy(asc(crmTenantConfig.id)).limit(1);
      }
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
          logoDarkUrl: brandingData.logoDarkUrl,
          faviconUrl: brandingData.faviconUrl,
          loginBgUrl: brandingData.loginBgUrl,
          portalBgUrl: brandingData.portalBgUrl,
          primaryColor: brandingData.primaryColor,
          secondaryColor: brandingData.secondaryColor,
          btnColor: brandingData.btnColor,
          sidebarColor: brandingData.sidebarColor,
          loginColor: brandingData.loginColor,
          portalColor: brandingData.portalColor,
          customCss: brandingData.customCss,
          portalName: brandingData.portalName,
          crmConfig: brandingData.crmConfig,
          pipelineStages: brandingData.pipelineStages,
          portalConfig: brandingData.portalConfig,
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

    // 2. Initialize Supabase Admin Storage Client (bypasses RLS for admin upload safety)
    const supabaseAdmin = getSupabaseAdmin();
    const bucketName = "branding";

    // Ensure bucket exists
    try {
      await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    } catch (e) {
      // Ignored: bucket already created
    }

    const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

    // 3. Upload file content to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(uniqueFileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error en almacenamiento: ${uploadError.message}`);
    }

    // 4. Get public URL of uploaded file
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(uniqueFileName);
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

/**
 * Retrieves all items in the media library.
 */
export async function getMediaLibraryAction(): Promise<ActionResult<any[]>> {
  try {
    await requireRole(["admin", "root_dev", "vendedor", "comercial", "tecnico", "ingeniero"]);
    const items = await db
      .select()
      .from(crmMediaLibrary)
      .orderBy(desc(crmMediaLibrary.createdAt));
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener la biblioteca multimedia." };
  }
}

/**
 * Deletes a media library item from the database and Supabase storage.
 */
export async function deleteMediaLibraryAction(id: string, fileUrl: string): Promise<ActionResult<boolean>> {
  try {
    await requireRole(["admin", "root_dev"]);
    
    // 1. Delete from database
    await db.delete(crmMediaLibrary).where(eq(crmMediaLibrary.id, id));

    // 2. Delete from Supabase Storage if possible
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let bucket = "branding";
      if (fileUrl.includes("/media/")) {
        bucket = "media";
      }
      
      const parts = fileUrl.split(`/${bucket}/`);
      if (parts.length > 1) {
        const filePath = parts[parts.length - 1];
        await supabaseAdmin.storage.from(bucket).remove([filePath]);
      }
    } catch (storageErr) {
      console.warn("Storage deletion warning (non-fatal):", storageErr);
    }

    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el archivo." };
  }
}

/**
 * Retrieves all products in the catalog.
 */
export async function getCatalogProductsAction(): Promise<ActionResult<any[]>> {
  try {
    const products = await db
      .select()
      .from(crmProducts)
      .orderBy(desc(crmProducts.createdAt));
    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener el catálogo." };
  }
}

/**
 * Creates a new catalog product.
 */
export async function createCatalogProductAction(data: {
  id: string;
  name: string;
  category: string;
  rpm?: string | null;
  caudal?: string | null;
  presion?: string | null;
  potencia?: string | null;
  voltaje?: string | null;
  proteccion?: string | null;
  material?: string | null;
  aplicacion?: string | null;
  normas?: string | null;
  eficiencia?: string | null;
  image: string;
  curvaPoints?: string | null;
  gallery?: string[];
}): Promise<ActionResult<boolean>> {
  try {
    await requireRole(["admin", "root_dev"]);

    // Check if ID is unique
    const [existing] = await db.select({ id: crmProducts.id }).from(crmProducts).where(eq(crmProducts.id, data.id)).limit(1);
    if (existing) {
      throw new Error(`El código de equipo (ID) '${data.id}' ya está registrado.`);
    }

    await db.insert(crmProducts).values({
      id: data.id,
      name: data.name,
      category: data.category,
      rpm: data.rpm || null,
      caudal: data.caudal || null,
      presion: data.presion || null,
      potencia: data.potencia || null,
      voltaje: data.voltaje || null,
      proteccion: data.proteccion || null,
      material: data.material || null,
      aplicacion: data.aplicacion || null,
      normas: data.normas || null,
      eficiencia: (data.eficiencia || "N/A") as any,
      image: data.image,
      curvaPoints: data.curvaPoints || "M 10 50 L 90 50",
      gallery: data.gallery || [],
    });

    revalidatePath("/catalogo");
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el producto." };
  }
}

/**
 * Updates an existing catalog product.
 */
export async function updateCatalogProductAction(id: string, data: {
  name: string;
  category: string;
  rpm?: string | null;
  caudal?: string | null;
  presion?: string | null;
  potencia?: string | null;
  voltaje?: string | null;
  proteccion?: string | null;
  material?: string | null;
  aplicacion?: string | null;
  normas?: string | null;
  eficiencia?: string | null;
  image: string;
  curvaPoints?: string | null;
  gallery?: string[];
}): Promise<ActionResult<boolean>> {
  try {
    await requireRole(["admin", "root_dev"]);

    await db
      .update(crmProducts)
      .set({
        name: data.name,
        category: data.category,
        rpm: data.rpm || null,
        caudal: data.caudal || null,
        presion: data.presion || null,
        potencia: data.potencia || null,
        voltaje: data.voltaje || null,
        proteccion: data.proteccion || null,
        material: data.material || null,
        aplicacion: data.aplicacion || null,
        normas: data.normas || null,
        eficiencia: (data.eficiencia || "N/A") as any,
        image: data.image,
        curvaPoints: data.curvaPoints || "M 10 50 L 90 50",
        gallery: data.gallery || [],
      })
      .where(eq(crmProducts.id, id));

    revalidatePath("/catalogo");
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar el producto." };
  }
}

/**
 * Deletes a catalog product.
 */
export async function deleteCatalogProductAction(id: string): Promise<ActionResult<boolean>> {
  try {
    await requireRole(["admin", "root_dev"]);
    await db.delete(crmProducts).where(eq(crmProducts.id, id));
    revalidatePath("/catalogo");
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el producto." };
  }
}

/**
 * Resets tenant branding parameters back to original default settings.
 */
export async function resetTenantBrandingAction(): Promise<ActionResult<boolean>> {
  try {
    const user = await requireRole(["admin", "root_dev"]);
    const tenantId = user.tenantId;
    
    let config;
    if (tenantId) {
      [config] = await db.select().from(crmTenantConfig).where(eq(crmTenantConfig.id, tenantId)).limit(1);
    } else {
      [config] = await db.select().from(crmTenantConfig).orderBy(asc(crmTenantConfig.id)).limit(1);
    }
    
    if (!config) {
      throw new Error("Configuración del inquilino no encontrada.");
    }

    // Reset crm_tenant_branding back to default values
    await db
      .update(crmTenantBranding)
      .set({
        logoUrl: null,
        logoDarkUrl: null,
        faviconUrl: null,
        loginBgUrl: null,
        portalBgUrl: null,
        primaryColor: "#0f172a",
        secondaryColor: "#0ea5e9",
        btnColor: "#0ea5e9",
        sidebarColor: "#0f172a",
        loginColor: "#0f172a",
        portalColor: "#0f172a",
        customCss: null,
        portalName: "Portal Cliente",
        crmConfig: {
          showDashboard: true,
          showReports: true,
          showAlerts: true,
          showFinances: true,
          showDiagnostics: true
        },
        pipelineStages: [
          { name: "Nuevo Prospecto", prob: 10, color: "bg-slate-500" },
          { name: "Diagnóstico Técnico", prob: 30, color: "bg-blue-500" },
          { name: "Propuesta Enviada", prob: 60, color: "bg-amber-500" },
          { name: "Negociación / Cierre", prob: 80, color: "bg-purple-500" },
          { name: "Cerrado Ganado", prob: 100, color: "bg-emerald-500" }
        ],
        portalConfig: {
          welcomeMessage: "Bienvenido a su portal corporativo.",
          modules: {
            solicitudes: true,
            facturas: true,
            activos: true,
            contratos: true,
            warRooms: true,
            diagnosticos: true
          },
          menuOrder: ["Inicio", "Solicitudes", "Activos", "Facturas", "Contratos"]
        },
        updatedAt: new Date()
      })
      .where(eq(crmTenantBranding.tenantId, config.id));

    // Reset crm_tenant_config name to default
    await db
      .update(crmTenantConfig)
      .set({
        companyName: "CYH Ventilación",
        nit: "901.234.567-8",
        email: "contacto@cyh-ingenieria.com",
        phone: "+57 (605) 309-4567",
        address: "Vía 40 # 73-290, Zona Industrial, Barranquilla",
        updatedAt: new Date()
      })
      .where(eq(crmTenantConfig.id, config.id));

    revalidatePath("/", "layout");
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al restablecer branding." };
  }
}

