"use server";

import { db } from "@/lib/db";
import { crmTicketComments, crmServiceRequests } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendNotificationActionInternal } from "./notifications";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Creates a comment in a service desk ticket thread and triggers notification dispatch
 */
export async function addTicketCommentAction(
  requestId: string,
  commentText: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // 1. Authenticate user
    const user = await requireRole(["admin", "tecnico", "vendedor", "cliente"]);
    const actorId = user.id;
    const actorRole = user.role; // cliente, tecnico, vendedor, admin

    if (!commentText || commentText.trim() === "") {
      throw new Error("El contenido del comentario no puede estar vacío.");
    }

    // 2. Retrieve request to assert access and routing
    const [request] = await db
      .select()
      .from(crmServiceRequests)
      .where(eq(crmServiceRequests.id, requestId))
      .limit(1);

    if (!request) {
      throw new Error("Solicitud técnica no encontrada.");
    }

    // 3. Create the comment record
    const [newComment] = await db
      .insert(crmTicketComments)
      .values({
        requestId,
        actorId,
        actorRole,
        comment: commentText.trim(),
      })
      .returning();

    // 4. Trigger persistent notification dispatch (Fase 11.4)
    let severity: "info" | "warning" | "critical" = "info";
    if (request.urgency === "critica") {
      severity = "critical";
    } else if (request.urgency === "alta") {
      severity = "warning";
    }

    await sendNotificationActionInternal(db, {
      customerId: request.customerId,
      userId: actorId,
      eventType: `ticket_comment:${request.urgency}`,
      title: `Nuevo mensaje en Ticket: ${request.title.substring(0, 30)}`,
      message: `[${actorRole.toUpperCase()}] ${user.fullName || user.email}: ${commentText.substring(0, 100)}`,
      severity,
    });

    // 5. Revalidate cache
    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true } };
  } catch (error: any) {
    console.error("Add Ticket Comment Error:", error);
    return { success: false, error: error.message || "Fallo al enviar el comentario." };
  }
}
