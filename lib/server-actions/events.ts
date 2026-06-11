"use server";

import { db } from "@/lib/db";
import { crmBusinessEvents } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function logBusinessEventActionInternal(
  txOrDb: any,
  input: {
    eventType: string;
    entityType: string;
    entityId: string;
    status: string;
    metadata: any;
  }
): Promise<boolean> {
  try {
    await txOrDb.insert(crmBusinessEvents).values({
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      status: input.status,
      metadata: input.metadata,
    });
    return true;
  } catch (err) {
    console.error("Error logging business event:", err);
    return false;
  }
}

export async function logBusinessEventAction(
  input: {
    eventType: string;
    entityType: string;
    entityId: string;
    status: string;
    metadata: any;
  }
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await requireRole(["admin", "tecnico", "vendedor", "cliente", "ingeniero"]);
    const success = await logBusinessEventActionInternal(db, input);
    return { success: true, data: { success } };
  } catch (error: any) {
    console.error("Log Business Event Action Error:", error);
    return { success: false, error: error.message || "Fallo al registrar evento de negocio." };
  }
}
