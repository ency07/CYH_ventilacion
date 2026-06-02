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
        filename: "Preingenieria-Estimada-CYH.pdf",
        content: Buffer.from(pdfBase64, "base64"),
        contentType: "application/pdf"
      }
    ] : [];

    const whatsappMessage = encodeURIComponent(
      `Hola, solicito asistencia técnica para el diagnóstico de preingeniería CYH OS para mi planta en ${lead.city || "Colombia"}.`
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
      from: "CYH Ingeniería <onboarding@resend.dev>",
      to: ["cyhingenieria5@gmail.com"], // OVERRIDE FOR DEV/TESTING (Free Resend tier)
      cc: [], // No cc needed in dev since to is already the test email
      replyTo: ["cyhingenieria5@gmail.com"], // Reply-to CYH
      subject: "Estimación Preliminar — CYH Ingeniería",
      attachments: attachments,
      html: `
        <div style="font-family: sans-serif; background-color: #f8fafc; padding: 32px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 4px;">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; text-align: left;">
            <h1 style="font-size: 24px; margin: 0; color: #0f172a; font-weight: bold; letter-spacing: 0.05em;">CYH VENTILACIÓN INDUSTRIAL</h1>
            <span style="font-size: 10px; color: #64748b; font-family: monospace;">NODO CARIBE (BARRANQUILLA, COLOMBIA)</span>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Estimado(a) <strong>${lead.fullName}</strong>,
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Hemos procesado exitosamente el análisis técnico inicial de su proyecto. Se ha procesado su <strong>Estimación preliminar y diagnóstico referencial</strong> para la planta de <strong>${lead.companyName}</strong> en la ciudad de <strong>${lead.city}</strong>.
          </p>

          <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px; margin: 24px 0; border-radius: 2px;">
            <h3 style="font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; color: #0f172a; font-family: monospace;">Detalles de Preingeniería</h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Servicio Requerido:</td>
                <td style="padding: 4px 0; font-weight: bold; text-align: right; text-transform: uppercase;">${lead.serviceType}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Rango Presupuesto Máx:</td>
                <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #0284c7;">${formattedBudgetMax}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Complejidad Técnica:</td>
                <td style="padding: 4px 0; font-weight: bold; text-align: right;">${lead.complexityScore}%</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Adjunto a este correo electrónico encontrará el archivo PDF con su estimación: <strong>Preingenieria-Estimada-CYH.pdf</strong>.
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #d97706; font-weight: bold; margin-bottom: 24px; padding: 12px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 2px;">
            Este documento tiene carácter exclusivamente referencial y debe ser validado por nuestro equipo técnico antes de cualquier ejecución o compra.
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Puede visualizar la copia de respaldo o avanzar con la validación de la preingeniería haciendo clic en el siguiente enlace:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${pdfUrl}" target="_blank" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 4px; letter-spacing: 0.05em; text-transform: uppercase;">
              Solicitar revisión con especialista
            </a>
          </div>

          <div style="text-align: center; margin: 24px 0; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <p style="font-size: 13px; color: #334155; margin-bottom: 12px;">¿Desea agendar una visita técnica o recibir asesoría inmediata por WhatsApp?</p>
            <a href="${whatsappUrl}" target="_blank" style="background-color: #25d366; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 4px; letter-spacing: 0.05em; text-transform: uppercase; display: inline-block;">
              Contactar por WhatsApp
            </a>
          </div>

          <p style="font-size: 11px; line-height: 1.5; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
            * Cumplimiento obligatorio bajo reglamentación técnica <strong>RETIE</strong> y código eléctrico colombiano <strong>NTC 2050</strong>. Para cotizaciones comerciales definitivas y visitas técnicas, comuníquese a proyectos@cyhventilacion.com o vía celular al +57 300 123 4567.
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
