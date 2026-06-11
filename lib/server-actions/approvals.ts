"use server";

import { db } from "@/lib/db";
import { crmInvoices } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logBusinessEventActionInternal } from "./events";
import { sendNotificationActionInternal } from "./notifications";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function approveInvoiceStepAction(
  invoiceId: string,
  step: "engineering" | "procurement" | "finance"
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await requireRole(["admin", "cliente"]);
    const userId = user.id;

    // 1. Fetch the invoice
    const [invoice] = await db
      .select()
      .from(crmInvoices)
      .where(eq(crmInvoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      throw new Error("Factura no encontrada.");
    }

    if (invoice.status === "paid") {
      throw new Error("Esta factura ya ha sido pagada.");
    }

    const now = new Date();
    const updateData: any = {};

    if (step === "engineering") {
      updateData.engineeringStatus = "approved";
      updateData.engineeringApprovedBy = userId;
      updateData.engineeringApprovedAt = now;
    } else if (step === "procurement") {
      if (invoice.engineeringStatus !== "approved") {
        throw new Error("La factura debe estar aprobada por Ingeniería antes de la revisión de Compras.");
      }
      updateData.procurementStatus = "approved";
      updateData.procurementApprovedBy = userId;
      updateData.procurementApprovedAt = now;
    } else if (step === "finance") {
      if (invoice.engineeringStatus !== "approved" || invoice.procurementStatus !== "approved") {
        throw new Error("La factura debe estar aprobada por Ingeniería y Compras antes de la aprobación de Finanzas.");
      }
      updateData.financeStatus = "approved";
      updateData.financeApprovedBy = userId;
      updateData.financeApprovedAt = now;
    }

    // 2. Perform database transaction
    await db.transaction(async (tx) => {
      // Update invoice approval state
      await tx
        .update(crmInvoices)
        .set(updateData)
        .where(eq(crmInvoices.id, invoiceId));

      // Log business event
      await logBusinessEventActionInternal(tx, {
        eventType: `INVOICE_APPROVED_${step.toUpperCase()}`,
        entityType: "invoice",
        entityId: invoiceId,
        status: "success",
        metadata: {
          actorId: userId,
          approvedAt: now.toISOString(),
          step,
          invoiceNumber: invoice.invoiceNumber,
        },
      });

      // Send dispatch notification
      await sendNotificationActionInternal(tx, {
        customerId: invoice.customerId,
        userId: userId,
        eventType: "invoice_approval_step",
        title: `Factura #${invoice.invoiceNumber} Aprobada (${step})`,
        message: `El paso de aprobación de ${step} para la Factura #${invoice.invoiceNumber} ha sido verificado con éxito.`,
        severity: "info",
      });
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true } };
  } catch (error: any) {
    console.error("Approve Invoice Step Error:", error);
    return { success: false, error: error.message || "Fallo al aprobar factura." };
  }
}
