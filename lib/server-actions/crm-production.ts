"use server";

import { db } from "@/lib/db";
import { crmProductionOrders, crmCustomers, crmInvoices, crmAuditLogs, crmNotifications } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const STATUS_FLOW = [
  "pago_confirmado",
  "listo_produccion",
  "generar_of",
  "produccion",
  "despacho",
];

export const STATUS_LABELS: Record<string, string> = {
  pago_confirmado: "Pago Confirmado",
  listo_produccion: "Listo para Producción",
  generar_of: "Generar OF",
  produccion: "Producción",
  despacho: "Despacho",
};

export async function getProductionOrdersAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      orderNumber: string;
      status: string;
      details: string | null;
      createdAt: Date;
      customerName: string;
      customerNit: string | null;
      invoiceNumber: string | null;
      invoiceAmount: number | null;
    }>
  >
> {
  try {
    await requireRole(["admin", "super_admin", "director_comercial", "ingeniero", "tecnico"]);

    const results = await db
      .select({
        id: crmProductionOrders.id,
        orderNumber: crmProductionOrders.orderNumber,
        status: crmProductionOrders.status,
        details: crmProductionOrders.details,
        createdAt: crmProductionOrders.createdAt,
        customerName: crmCustomers.name,
        customerNit: crmCustomers.nit,
        invoiceNumber: crmInvoices.invoiceNumber,
        invoiceAmount: crmInvoices.amount,
      })
      .from(crmProductionOrders)
      .innerJoin(crmCustomers, eq(crmProductionOrders.customerId, crmCustomers.id))
      .leftJoin(crmInvoices, eq(crmProductionOrders.invoiceId, crmInvoices.id))
      .orderBy(desc(crmProductionOrders.createdAt));

    return { success: true, data: results };
  } catch (error: any) {
    console.error("Error fetching production orders:", error);
    return { success: false, error: error.message || "Error al obtener órdenes de producción." };
  }
}

export async function advanceProductionStatusAction(
  orderId: string,
  currentStatus: string
): Promise<ActionResult<{ success: boolean; nextStatus: string }>> {
  try {
    // 1. Check actor role
    const actor = await requireRole(["admin", "super_admin", "director_comercial", "ingeniero", "tecnico"]);

    // 2. Find next status in the sequence
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === -1) {
      throw new Error(`Estado actual inválido: ${currentStatus}`);
    }

    if (currentIndex === STATUS_FLOW.length - 1) {
      throw new Error("La orden ya se encuentra en la etapa final (Despacho).");
    }

    const nextStatus = STATUS_FLOW[currentIndex + 1];

    // 3. Fetch production order details
    const [order] = await db
      .select()
      .from(crmProductionOrders)
      .where(eq(crmProductionOrders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Orden de producción no encontrada.");
    }

    if (order.status !== currentStatus) {
      throw new Error(`Conflicto de estado: la orden se encuentra en '${order.status}' pero se reportó '${currentStatus}'.`);
    }

    // 4. Update status inside transaction block
    await db.transaction(async (tx) => {
      // Update the status and approved details
      await tx
        .update(crmProductionOrders)
        .set({
          status: nextStatus,
          approvedBy: actor.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(crmProductionOrders.id, orderId));

      // Log to crm_audit_logs (Technical Constitution Pillar X Compliance)
      await tx.insert(crmAuditLogs).values({
        actorId: actor.id,
        action: "ADVANCE_PRODUCTION_STATUS",
        entityAffected: `crm_production_orders:${orderId}`,
        metadata: {
          productionOrderId: orderId,
          orderNumber: order.orderNumber,
          previousStatus: currentStatus,
          newStatus: nextStatus,
        },
        ipAddress: "127.0.0.1",
        userAgent: "Server Action / crm-production",
      });

      // Insert internal notification
      await tx.insert(crmNotifications).values({
        userId: actor.id,
        customerId: order.customerId,
        title: `OF Avanzada: ${STATUS_LABELS[nextStatus]}`,
        message: `La orden de producción ${order.orderNumber} avanzó de '${STATUS_LABELS[currentStatus]}' a '${STATUS_LABELS[nextStatus]}' por aprobación de ${actor.fullName || actor.email}.`,
        channel: "bell",
        severity: "info",
        isRead: false,
      });
    });

    // 5. Revalidate cache
    revalidatePath("/crm/produccion");

    return { success: true, data: { success: true, nextStatus } };
  } catch (error: any) {
    console.error("Error advancing production order:", error);
    return { success: false, error: error.message || "Error al avanzar estado de la orden." };
  }
}
