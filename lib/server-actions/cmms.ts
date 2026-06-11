"use server";

import { db } from "@/lib/db";
import { crmAssets, crmMaintenancePlans, crmWorkOrders, crmAuditLogs } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logBusinessEventActionInternal } from "./events";
import { sendNotificationActionInternal } from "./notifications";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function incrementAssetHoursAction(
  assetId: string,
  hours: number
): Promise<ActionResult<{ success: boolean; newHours: number; workOrderGenerated: boolean }>> {
  try {
    const user = await requireRole(["admin", "tecnico", "cliente", "ingeniero"]);
    const actorId = user.id;

    // Get audit headers
    const reqHeaders = headers();
    const userAgent = reqHeaders.get("user-agent") || "Unknown";
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    let workOrderGenerated = false;
    let finalHours = 0;

    // Fetch the asset details
    const [asset] = await db
      .select()
      .from(crmAssets)
      .where(eq(crmAssets.id, assetId))
      .limit(1);

    if (!asset) {
      throw new Error("Activo no encontrado.");
    }

    finalHours = asset.operatingHours + hours;

    await db.transaction(async (tx) => {
      // 1. Update operating hours
      await tx
        .update(crmAssets)
        .set({ operatingHours: finalHours })
        .where(eq(crmAssets.id, assetId));

      // 2. Log audit log
      await tx.insert(crmAuditLogs).values({
        actorId,
        action: "asset_hours_incremented",
        entityAffected: `crm_assets:${assetId}`,
        ipAddress,
        userAgent,
        metadata: {
          previousHours: asset.operatingHours,
          increment: hours,
          newHours: finalHours,
        },
      });

      // 3. Fetch maintenance plans
      const plans = await tx
        .select()
        .from(crmMaintenancePlans)
        .where(eq(crmMaintenancePlans.assetId, assetId));

      for (const plan of plans) {
        // Trigger if final hours cross the interval limit
        if (finalHours >= plan.intervalHours) {
          // Check if there is already a scheduled or in-progress work order for this plan
          const [existingOrder] = await tx
            .select()
            .from(crmWorkOrders)
            .where(
              and(
                eq(crmWorkOrders.planId, plan.id),
                eq(crmWorkOrders.status, "programado")
              )
            )
            .limit(1);

          if (!existingOrder) {
            // Generate a preventive work order
            const [newOrder] = await tx.insert(crmWorkOrders).values({
              assetId,
              planId: plan.id,
              title: `Mantenimiento Preventivo: ${plan.title}`,
              status: "programado",
              scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            }).returning();

            // Set asset status
            await tx
              .update(crmAssets)
              .set({ status: "mantenimiento" })
              .where(eq(crmAssets.id, assetId));

            // Log business event
            await logBusinessEventActionInternal(tx, {
              eventType: "WORK_ORDER_CREATED",
              entityType: "work_order",
              entityId: newOrder.id,
              status: "success",
              metadata: {
                assetId,
                planId: plan.id,
                title: plan.title,
                triggerHours: finalHours,
              },
            });

            // Send notification
            await sendNotificationActionInternal(tx, {
              customerId: null,
              userId: actorId,
              eventType: "work_order_created",
              title: `🔧 Preventivo Generado: ${plan.title}`,
              message: `El activo ${asset.name} (${asset.code}) superó el límite de ${plan.intervalHours} horas (${finalHours} hrs actuales). Orden de trabajo preventiva creada.`,
              severity: "info",
            });

            workOrderGenerated = true;
          }
        }
      }
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true, newHours: finalHours, workOrderGenerated } };
  } catch (error: any) {
    console.error("Increment Hours Error:", error);
    return { success: false, error: error.message || "Fallo al incrementar horas." };
  }
}

export async function completeWorkOrderAction(
  workOrderId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await requireRole(["admin", "tecnico", "ingeniero"]);
    const actorId = user.id;

    const [order] = await db
      .select()
      .from(crmWorkOrders)
      .where(eq(crmWorkOrders.id, workOrderId))
      .limit(1);

    if (!order) {
      throw new Error("Orden de trabajo no encontrada.");
    }

    if (order.status === "completado") {
      throw new Error("Esta orden de trabajo ya fue completada.");
    }

    await db.transaction(async (tx) => {
      const now = new Date();

      // 1. Complete the work order
      await tx
        .update(crmWorkOrders)
        .set({ status: "completado", completedAt: now })
        .where(eq(crmWorkOrders.id, workOrderId));

      // 2. Reset asset status to operational and set last maintenance date
      await tx
        .update(crmAssets)
        .set({ status: "operativo", lastMaintenanceAt: now })
        .where(eq(crmAssets.id, order.assetId));

      // 3. Log business event
      await logBusinessEventActionInternal(tx, {
        eventType: "WORK_ORDER_COMPLETED",
        entityType: "work_order",
        entityId: workOrderId,
        status: "success",
        metadata: {
          assetId: order.assetId,
          completedAt: now.toISOString(),
          actorId,
        },
      });

      // 4. Send notification
      await sendNotificationActionInternal(tx, {
        customerId: null,
        userId: actorId,
        eventType: "work_order_completed",
        title: `✅ OT Completada: ${order.title}`,
        message: `La orden de trabajo preventiva "${order.title}" ha sido completada con éxito. El activo vuelve a estado operativo.`,
        severity: "info",
      });
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true } };
  } catch (error: any) {
    console.error("Complete Work Order Error:", error);
    return { success: false, error: error.message || "Fallo al completar la orden de trabajo." };
  }
}
