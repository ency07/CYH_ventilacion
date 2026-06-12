"use server";

import { Resend } from "resend";
import { db } from "@/lib/db";
import { leads, diagnosticReports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_placeholder");

export async function sendDiagnosticEmailAction(leadId: string, pdfBase64?: string) {
  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return { success: false, error: "Lead no encontrado." };

    const [diagnostic] = await db.select().from(diagnosticReports).where(eq(diagnosticReports.leadId, leadId));
    const pdfUrl = diagnostic?.generatedPdfUrl || "#";

    // Format currency to COP $XX.XXX.XXX using bulletproof formatter
    const formattedVal = new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(lead.estimatedBudgetMax || 0);
    const formattedBudgetMax = `COP $${formattedVal}`;

    // Prepare attachments array for Resend
    const attachments = pdfBase64 ? [
      {
        filename: "Preingenieria-Estimada-VENTITECH.pdf",
        content: Buffer.from(pdfBase64, "base64"),
        contentType: "application/pdf"
      }
    ] : [];

    const whatsappMessage = encodeURIComponent(
      `Hola, solicito asistencia técnica para el diagnóstico de preingeniería VENTITECH OS para mi planta en ${lead.city || "Colombia"}.`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?phone=573001234567&text=${whatsappMessage}`;

    if (!lead.email || typeof lead.email !== "string" || !lead.email.includes("@")) {
      return { success: false, error: "Correo de destino del cliente no especificado o inválido." };
    }

    console.log("[EMAIL DESTINO CLIENTE]", lead.email);
    console.log("[EMAIL PDF GENERADO]", pdfUrl || "No almacenado localmente");

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
      console.log(`[RESEND SIMULATION] Sending Preingeniería Estimada for lead ${lead.fullName} to ${lead.email}. Attachment: ${pdfBase64 ? "YES (PDF Attached)" : "NO"}. PDF Storage URL: ${pdfUrl}`);
      return { success: true, data: "Simulación de envío de preingeniería estimada." };
    }

    // Configuration of real routing to client and internal CYH copy (Temporary Dev Override)
    const { data, error } = await resend.emails.send({
      from: "VENTITECH <onboarding@resend.dev>",
      to: ["cyhingenieria5@gmail.com"], // OVERRIDE FOR DEV/TESTING (Free Resend tier)
      cc: [], // No cc needed in dev since to is already the test email
      replyTo: ["cyhingenieria5@gmail.com"], // Reply-to CYH
      subject: "Estimación Preliminar — VENTITECH",
      attachments: attachments,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p style="font-size: 14px; margin-bottom: 20px;">
            Estimado(a) <strong>${lead.fullName}</strong>,
          </p>

          <p style="font-size: 14px; margin-bottom: 20px;">
            Nuestro equipo de evaluación técnica ha procesado exitosamente la información suministrada respecto al entorno operativo de su planta en <strong>${lead.city}</strong>.
          </p>

          <p style="font-size: 14px; margin-bottom: 20px;">
            Hemos consolidado un primer diagnóstico referencial para abordar sus requerimientos de <strong>${lead.serviceType}</strong>. Con base en nuestro marco metodológico y las normativas vigentes, el análisis preliminar ha arrojado configuraciones viables que mejorarán significativamente su operación.
          </p>

          <p style="font-size: 14px; margin-bottom: 24px;">
            <strong>Adjunto a esta comunicación encontrará el Reporte de Viabilidad Técnica y Preingeniería (PDF)</strong>, el cual detalla:
          </p>

          <ul style="font-size: 14px; margin-bottom: 24px; color: #334155;">
            <li style="margin-bottom: 8px;">El cálculo preliminar de caudal de aire y volumetría.</li>
            <li style="margin-bottom: 8px;">Clasificación de criticidad de su entorno de trabajo.</li>
            <li style="margin-bottom: 8px;">Limitaciones normativas requeridas (RETIE / NTC 2050).</li>
            <li style="margin-bottom: 8px;">Aproximación de inversión referencial del ecosistema propuesto.</li>
          </ul>

          <p style="font-size: 14px; margin-bottom: 32px;">
            Tenga en cuenta que este documento es un punto de partida técnico. La configuración definitiva demanda un levantamiento físico de datos.
          </p>

          <div style="margin-bottom: 40px;">
            <a href="${pdfUrl}" target="_blank" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; font-size: 13px; font-weight: bold; text-decoration: none; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase;">
              AGENDAR REVISIÓN TÉCNICA DE 15 MINUTOS
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <p style="font-size: 14px; margin: 0; color: #475569;"><em>Atentamente,</em></p>
            <p style="font-size: 14px; margin: 4px 0 0 0; font-weight: bold; color: #0f172a;">Dirección de Proyectos y Preingeniería</p>
            <p style="font-size: 14px; margin: 0; color: #475569;">VENTITECH Ventilación Industrial</p>
            <p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;"><em>Especialistas en control de contaminantes y transferencia de calor</em></p>
          </div>
          <p style="font-size: 11px; line-height: 1.5; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
            * Cumplimiento obligatorio bajo reglamentación técnica <strong>RETIE</strong> y código eléctrico colombiano <strong>NTC 2050</strong>. Para cotizaciones comerciales definitivas y visitas técnicas, comuníquese a proyectos@ventitech.com o vía celular al +57 300 123 4567.
          </p>
        </div>
      `
    });

    if (error) {
      console.error("[EMAIL ERROR RESEND]", error);
      throw error;
    }
    
    console.log("[EMAIL ENVIADO OK]", data?.id);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending diagnostic email:", error);
    return { success: false, error: error.message || "Fallo al enviar correo de diagnóstico." };
  }
}
