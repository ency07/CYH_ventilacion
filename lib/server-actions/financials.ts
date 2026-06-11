"use server";

import { db } from "@/lib/db";
import { crmInvoices, crmPayments, crmAccountsReceivable, crmNotifications } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendNotificationActionInternal } from "./notifications";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Simulates a PSE/Wompi payment checkout sequence for B2B invoices.
 * Sets invoice status to paid, clears outstanding balance, registers payment record,
 * and broadcasts internal notification alerts.
 */
export async function simulateInvoicePaymentAction(
  invoiceId: string,
  paymentMethod: "PSE" | "Wompi" | "Transferencia" = "PSE"
): Promise<ActionResult<{ success: boolean; transactionId: string }>> {
  try {
    // 1. Authenticate user
    const user = await requireRole(["admin", "cliente"]);
    const actorId = user.id;

    // 2. Fetch invoice details
    const [invoice] = await db
      .select()
      .from(crmInvoices)
      .where(eq(crmInvoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      throw new Error("Factura no encontrada.");
    }

    if (invoice.status === "paid") {
      throw new Error("Esta factura ya ha sido pagada previamente.");
    }

    // Strict 3-step approval gate (Technical Constitution Compliance)
    if (
      invoice.engineeringStatus !== "approved" ||
      invoice.procurementStatus !== "approved" ||
      invoice.financeStatus !== "approved"
    ) {
      throw new Error("Esta factura requiere aprobación de Ingeniería, Compras y Finanzas antes de procesar el pago.");
    }

    const transactionId = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // 3. Perform database updates inside transaction block
    await db.transaction(async (tx) => {
      // Insert payment record (approved status)
      await tx.insert(crmPayments).values({
        invoiceId: invoice.id,
        amount: invoice.amount,
        paymentMethod,
        transactionId,
        status: "approved",
      });

      // Update invoice status to paid
      await tx
        .update(crmInvoices)
        .set({ status: "paid" })
        .where(eq(crmInvoices.id, invoice.id));

      // Update or clear Accounts Receivable record
      await tx
        .update(crmAccountsReceivable)
        .set({ outstandingBalance: 0, collectionStatus: "normal" })
        .where(eq(crmAccountsReceivable.invoiceId, invoice.id));

      // Log business event (for E2E verification ledger)
      await tx.insert(crmNotifications).values({
        userId: actorId,
        customerId: invoice.customerId,
        title: "Pago Recibido Exitosamente",
        message: `El pago de la factura #${invoice.invoiceNumber} por valor de COP $${invoice.amount.toLocaleString("es-CO")} ha sido procesado mediante ${paymentMethod}. Transacción: ${transactionId}.`,
        channel: "bell",
        severity: "info",
        isRead: false,
      });

      // Register crm_business_events
      await tx.insert(require("@/lib/db/schema").crmBusinessEvents).values({
        eventType: "PAYMENT_APPROVED",
        entityType: "invoice",
        entityId: invoice.id,
        status: "success",
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          paymentMethod,
          transactionId,
          actorId,
        },
      });

      // Trigger internal Telegram alert to management/financial teams (Fase 11.5)
      await sendNotificationActionInternal(tx, {
        customerId: invoice.customerId,
        userId: actorId,
        eventType: "invoice_payment",
        title: "🚨 Pago Recibido (Simulación)",
        message: `La empresa ha recibido un pago de COP $${invoice.amount.toLocaleString("es-CO")} por la Factura #${invoice.invoiceNumber}. Canal: ${paymentMethod}. Transacción: ${transactionId}.`,
        severity: "info",
      });
    });

    // 8. Revalidate paths
    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true, transactionId } };
  } catch (error: any) {
    console.error("Simulate Payment Error:", error);
    return { success: false, error: error.message || "Fallo al procesar el pago." };
  }
}
