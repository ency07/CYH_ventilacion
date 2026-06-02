"use server";

import { db } from "@/lib/db";
import { diagnosticReports } from "@/lib/db/schema";
import { DiagnosticInsertSchema } from "@/lib/validations/crm.schema";
import { eq } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createDiagnosticAction(rawInput: any): Promise<ActionResult<any>> {
  try {
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
