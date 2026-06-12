"use server";

import { db } from "@/lib/db";
import { crmAuditLogs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/permissions";
import { headers } from "next/headers";

/**
 * Server Action to record document read events (proposals, contracts, invoices, and PDF downloads)
 * in compliance with Pilar X of the Technical Constitution.
 */
export async function logReadAuditAction(
  action: string,
  entityAffected: string,
  documentCode: string
) {
  try {
    const user = await getCurrentUser();
    const reqHeaders = headers();
    const userAgent = reqHeaders.get("user-agent") || "Unknown";
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    await db.insert(crmAuditLogs).values({
      actorId: user.id,
      action: action, // e.g. VIEW_PROPOSAL, VIEW_CONTRACT, VIEW_INVOICE, DOWNLOAD_PDF
      entityAffected: entityAffected,
      metadata: {
        documentCode: documentCode,
        ip: ipAddress,
        userAgent: userAgent,
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Read Audit Log Error:", error);
    // Pilar IV: graceful degradation without throwing to crash client operations
    return { success: false, error: error.message || "Fallo al registrar la auditoría de lectura." };
  }
}
