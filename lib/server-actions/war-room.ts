"use server";

import { db } from "@/lib/db";
import { crmEmergencyWarRooms, crmWarRoomTimeline, crmServiceRequests, crmUsers } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logBusinessEventActionInternal } from "./events";
import { sendNotificationActionInternal } from "./notifications";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createWarRoomAction(
  requestId: string,
  RACI: {
    responsibleId?: string;
    approverId?: string;
    consultedId?: string;
    informedId?: string;
  }
): Promise<ActionResult<{ success: boolean; incidentCode: string }>> {
  try {
    const user = await requireRole(["admin", "tecnico", "cliente", "ingeniero"]);
    const actorId = user.id;

    // Validate request exists
    const [request] = await db
      .select()
      .from(crmServiceRequests)
      .where(eq(crmServiceRequests.id, requestId))
      .limit(1);

    if (!request) {
      throw new Error("Solicitud técnica de origen no encontrada.");
    }

    const now = new Date();
    const incidentCode = `INC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.transaction(async (tx) => {
      // 1. Create war room record
      const [warRoom] = await tx
        .insert(crmEmergencyWarRooms)
        .values({
          requestId,
          incidentCode,
          status: "activo",
          leaderId: actorId, // Creator acts as leader initial fallback
          responsibleId: RACI.responsibleId || null,
          approverId: RACI.approverId || null,
          consultedId: RACI.consultedId || null,
          informedId: RACI.informedId || null,
        })
        .returning();

      // 2. Log business event
      await logBusinessEventActionInternal(tx, {
        eventType: "WAR_ROOM_OPENED",
        entityType: "war_room",
        entityId: warRoom.id,
        status: "success",
        metadata: {
          incidentCode,
          requestId,
          RACI,
          actorId,
        },
      });

      // 3. Create initial timeline event
      await tx.insert(crmWarRoomTimeline).values({
        warRoomId: warRoom.id,
        actorId,
        actorName: user.fullName || user.email || "Sistema CYH",
        eventType: "hito",
        description: "Centro de Control de Emergencia Inicializado. Activación de Protocolo RACI y Cronómetro de Parada de Planta.",
      });

      // 4. Send P1 Critical alert
      await sendNotificationActionInternal(tx, {
        customerId: request.customerId,
        userId: actorId,
        eventType: "war_room_opened",
        title: `🚨 EMERGENCIA ACTIVA: ${incidentCode}`,
        message: `Se ha abierto una Sala de Control de Emergencia para la solicitud: "${request.title}".\nCódigo: ${incidentCode}.\nCronómetro operativo iniciado.`,
        severity: "critical",
      });
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true, incidentCode } };
  } catch (error: any) {
    console.error("Create War Room Error:", error);
    return { success: false, error: error.message || "Fallo al crear Sala de Emergencia." };
  }
}

export async function addWarRoomTimelineEventAction(
  warRoomId: string,
  eventType: "evidencia" | "decision" | "hito" | "comunicado",
  description: string,
  metadata: any = null
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await requireRole(["admin", "tecnico", "cliente", "ingeniero"]);
    const actorId = user.id;

    const [warRoom] = await db
      .select()
      .from(crmEmergencyWarRooms)
      .where(eq(crmEmergencyWarRooms.id, warRoomId))
      .limit(1);

    if (!warRoom) {
      throw new Error("Sala de control de emergencias no encontrada.");
    }

    if (warRoom.status === "resuelto") {
      throw new Error("Esta sala de emergencias ya se encuentra resuelta y cerrada.");
    }

    await db.transaction(async (tx) => {
      // 1. Insert timeline log
      await tx.insert(crmWarRoomTimeline).values({
        warRoomId,
        actorId,
        actorName: user.fullName || user.email || "Operador CYH",
        eventType,
        description,
        metadata,
      });

      // 2. If it is a decision, write to the business events log
      if (eventType === "decision") {
        await logBusinessEventActionInternal(tx, {
          eventType: "WAR_ROOM_DECISION_LOGGED",
          entityType: "war_room",
          entityId: warRoomId,
          status: "success",
          metadata: {
            actorId,
            description,
            incidentCode: warRoom.incidentCode,
          },
        });
      }

      // 3. Dispatch notification update
      await sendNotificationActionInternal(tx, {
        customerId: null,
        userId: null,
        eventType: "war_room_timeline_update",
        title: `📢 War Room ${warRoom.incidentCode}: Nuevo ${eventType.toUpperCase()}`,
        message: `${description}\nRegistrado por: ${user.fullName || user.email}`,
        severity: "warning", // Send to Telegram
      });
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true } };
  } catch (error: any) {
    console.error("Add War Room Event Error:", error);
    return { success: false, error: error.message || "Fallo al registrar evento en línea de tiempo." };
  }
}

export async function resolveWarRoomAction(
  warRoomId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await requireRole(["admin", "tecnico", "ingeniero"]);
    const actorId = user.id;

    const [warRoom] = await db
      .select()
      .from(crmEmergencyWarRooms)
      .where(eq(crmEmergencyWarRooms.id, warRoomId))
      .limit(1);

    if (!warRoom) {
      throw new Error("Sala de control de emergencias no encontrada.");
    }

    if (warRoom.status === "resuelto") {
      throw new Error("Esta sala de emergencias ya fue resuelta.");
    }

    await db.transaction(async (tx) => {
      const now = new Date();

      // 1. Update War Room status
      await tx
        .update(crmEmergencyWarRooms)
        .set({ status: "resuelto", resolvedAt: now })
        .where(eq(crmEmergencyWarRooms.id, warRoomId));

      // 2. Update parent service request status
      await tx
        .update(crmServiceRequests)
        .set({ status: "cerrada", updatedAt: now })
        .where(eq(crmServiceRequests.id, warRoom.requestId));

      // 3. Insert closing timeline log
      await tx.insert(crmWarRoomTimeline).values({
        warRoomId,
        actorId,
        actorName: user.fullName || user.email || "Supervisor CYH",
        eventType: "hito",
        description: "Incidente Mayor Resuelto. Cierre formal del Centro de Control de Emergencias y desactivación de alarma.",
      });

      // 4. Log business event
      await logBusinessEventActionInternal(tx, {
        eventType: "WAR_ROOM_RESOLVED",
        entityType: "war_room",
        entityId: warRoomId,
        status: "success",
        metadata: {
          incidentCode: warRoom.incidentCode,
          resolvedAt: now.toISOString(),
          actorId,
        },
      });

      // 5. Send alerts
      await sendNotificationActionInternal(tx, {
        customerId: null,
        userId: actorId,
        eventType: "war_room_resolved",
        title: `✅ INCIDENTE RESUELTO: ${warRoom.incidentCode}`,
        message: `El incidente mayor ${warRoom.incidentCode} ha sido resuelto y cerrado bajo aprobación del supervisor.`,
        severity: "info",
      });
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true } };
  } catch (error: any) {
    console.error("Resolve War Room Error:", error);
    return { success: false, error: error.message || "Fallo al resolver la sala de emergencia." };
  }
}
