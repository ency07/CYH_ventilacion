"use server";

import { db } from "@/lib/db";
import { diagnosticReports, crmUsers, crmActivityLogs } from "@/lib/db/schema";
import { DiagnosticInsertSchema } from "@/lib/validations/crm.schema";
import { eq } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createDiagnosticAction(rawInput: any): Promise<ActionResult<any>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const validated = DiagnosticInsertSchema.parse(rawInput);

    const [newReport] = await db.insert(diagnosticReports).values({
      leadId: validated.leadId,
      airflow: validated.airflow,
      dimensions: validated.dimensions,
      technicalObservations: validated.technicalObservations,
      materialSuggestions: validated.materialSuggestions,
      inspectionProtocol: validated.inspectionProtocol,
      recommendations: validated.recommendations,
      currency: validated.currency,
      generatedPdfUrl: validated.generatedPdfUrl,
    }).returning();

    revalidatePath("/crm");
    revalidatePath(`/crm/${validated.leadId}`);
    return { success: true, data: newReport };
  } catch (error: any) {
    console.error("Error creating diagnostic:", error);
    return { success: false, error: error.message || "Error al registrar el diagnóstico técnico." };
  }
}

export async function getDiagnosticByLeadIdAction(leadId: string): Promise<ActionResult<any>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const [report] = await db.select().from(diagnosticReports).where(eq(diagnosticReports.leadId, leadId));
    if (!report) {
      return { success: false, error: "Reporte no encontrado." };
    }
    return { success: true, data: report };
  } catch (error: any) {
    console.error(`Error fetching diagnostic for lead ${leadId}:`, error);
    return { success: false, error: error.message || "Error al buscar el diagnóstico." };
  }
}

export async function uploadPdfAction(leadId: string, pdfBase64: string): Promise<ActionResult<string>> {
  try {
    const supabaseServer = getSupabaseServer();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };
    
    // Ensure the pdfs bucket exists
    try {
      await supabaseServer.storage.createBucket('pdfs', { public: true });
    } catch (e) {
      // Bucket might already exist, ignore error
    }

    // Convert base64 string to Buffer
    const buffer = Buffer.from(pdfBase64, 'base64');

    // Upload to Supabase Storage in 'pdfs' bucket
    const fileName = `reports/${leadId}.pdf`;
    const { data, error } = await supabaseServer.storage.from('pdfs').upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: true
    });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServer.storage.from('pdfs').getPublicUrl(fileName);

    // Save public URL to Drizzle Database
    await db.update(diagnosticReports)
      .set({ generatedPdfUrl: publicUrl })
      .where(eq(diagnosticReports.leadId, leadId));

    revalidatePath("/crm");
    revalidatePath(`/crm/${leadId}`);
    return { success: true, data: publicUrl };
  } catch (error: any) {
    console.error("Error uploading PDF to storage:", error);
    return { success: false, error: error.message || "Error al subir reporte PDF." };
  }
}

export async function upsertDiagnosticAction(rawInput: {
  leadId: string;
  airflow?: number | null;
  dimensions?: { width?: number; length?: number; height?: number } | null;
  technicalObservations?: string | null;
  recommendations?: string | null;
  materialSuggestions?: string | null;
  status?: string | null;
  verdictNotes?: string | null;
}): Promise<ActionResult<any>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    const userRole = dbUser?.role || "vendedor";

    // Block Vendedor / Comercial from editing/writing
    if (userRole === "vendedor" || userRole === "comercial") {
      return { success: false, error: "Acceso denegado: El panel de Preingeniería es Solo Lectura para asesores comerciales." };
    }

    const leadId = rawInput.leadId;
    if (!leadId) return { success: false, error: "leadId es requerido." };

    // Check if diagnostic report already exists
    const [existingReport] = await db.select().from(diagnosticReports).where(eq(diagnosticReports.leadId, leadId));

    let resultReport;

    if (existingReport) {
      // Update
      const [updated] = await db.update(diagnosticReports)
        .set({
          airflow: rawInput.airflow !== undefined ? rawInput.airflow : existingReport.airflow,
          dimensions: rawInput.dimensions !== undefined ? rawInput.dimensions : existingReport.dimensions,
          technicalObservations: rawInput.technicalObservations !== undefined ? rawInput.technicalObservations : existingReport.technicalObservations,
          recommendations: rawInput.recommendations !== undefined ? rawInput.recommendations : existingReport.recommendations,
          materialSuggestions: rawInput.materialSuggestions !== undefined ? rawInput.materialSuggestions : existingReport.materialSuggestions,
          status: rawInput.status !== undefined && rawInput.status !== null ? rawInput.status : existingReport.status,
          verdictNotes: rawInput.verdictNotes !== undefined ? rawInput.verdictNotes : existingReport.verdictNotes,
          updatedBy: user.id,
          approvedBy: rawInput.status === "aprobado" ? user.id : existingReport.approvedBy,
          approvedAt: rawInput.status === "aprobado" ? new Date() : existingReport.approvedAt,
        })
        .where(eq(diagnosticReports.id, existingReport.id))
        .returning();
      resultReport = updated;
    } else {
      // Insert
      const [inserted] = await db.insert(diagnosticReports).values({
        leadId,
        airflow: rawInput.airflow || null,
        dimensions: rawInput.dimensions || null,
        technicalObservations: rawInput.technicalObservations || null,
        recommendations: rawInput.recommendations || null,
        materialSuggestions: rawInput.materialSuggestions || null,
        status: rawInput.status || "pendiente",
        verdictNotes: rawInput.verdictNotes || null,
        createdBy: user.id,
        approvedBy: rawInput.status === "aprobado" ? user.id : null,
        approvedAt: rawInput.status === "aprobado" ? new Date() : null,
      }).returning();
      resultReport = inserted;
    }

    // Insert an activity log for tracking the technical update
    await db.insert(crmActivityLogs).values({
      leadId,
      activityType: "diagnostic_updated",
      description: `Reporte de Preingeniería y Veredicto Técnico actualizados.`,
      userId: user.id,
    });

    revalidatePath("/crm");
    revalidatePath(`/crm/${leadId}`);
    return { success: true, data: resultReport };
  } catch (error: any) {
    console.error("Error in upsertDiagnosticAction:", error);
    return { success: false, error: error.message || "Error al guardar el diagnóstico técnico." };
  }
}
