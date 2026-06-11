"use server";

import { db } from "@/lib/db";
import { crmElectronicSignatures, crmProposals, leads, crmContracts, crmCustomers, crmInvoices, crmAccountsReceivable } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import crypto from "crypto";
import { logBusinessEventActionInternal } from "./events";
import { sendNotificationActionInternal } from "./notifications";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function signElectronicDocumentAction(
  entityType: "proposal" | "contract",
  entityId: string,
  signerEmail: string,
  signerRole: string
): Promise<ActionResult<{ success: boolean; signatureHash: string }>> {
  try {
    const user = await requireRole(["admin", "cliente"]);
    const actorId = user.id;

    // Get headers
    const reqHeaders = headers();
    const userAgent = reqHeaders.get("user-agent") || "Unknown";
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const timestamp = new Date().toISOString();
    
    // Generate cryptographic hash (SHA-256)
    const signatureData = `${entityType}:${entityId}:${signerEmail}:${signerRole}:${ipAddress}:${timestamp}`;
    const signatureHash = crypto.createHash("sha256").update(signatureData).digest("hex");

    await db.transaction(async (tx) => {
      // 1. Log the signature
      await tx.insert(crmElectronicSignatures).values({
        entityType,
        entityId,
        signerEmail,
        signerRole,
        ipAddress,
        userAgent,
        signatureHash,
      });

      // 2. Perform business conversions if it's a proposal
      if (entityType === "proposal") {
        const [proposal] = await tx
          .select()
          .from(crmProposals)
          .where(eq(crmProposals.id, entityId))
          .limit(1);

        if (!proposal) {
          throw new Error("Propuesta no encontrada.");
        }

        if (proposal.status === "aceptada") {
          throw new Error("Esta propuesta ya ha sido firmada y aceptada.");
        }

        // Update proposal status
        await tx
          .update(crmProposals)
          .set({ status: "aceptada", updatedAt: new Date() })
          .where(eq(crmProposals.id, entityId));

        // Update Lead status to ganado
        await tx
          .update(leads)
          .set({ status: "ganado", updatedAt: new Date() })
          .where(eq(leads.id, proposal.leadId));

        // Resolve customer from company name
        const [leadRecord] = await tx
          .select()
          .from(leads)
          .where(eq(leads.id, proposal.leadId))
          .limit(1);

        let customerId: string | null = null;
        if (leadRecord) {
          const [customer] = await tx
            .select()
            .from(crmCustomers)
            .where(eq(crmCustomers.name, leadRecord.companyName))
            .limit(1);
          
          if (customer) {
            customerId = customer.id;
            
            // Create a B2B contract from the signed proposal
            const [contract] = await tx.insert(crmContracts).values({
              customerId,
              title: `Contrato de Ingeniería: ${proposal.title}`,
              value: proposal.totalValue,
              status: "active",
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Year validity
            }).returning();

            // Auto-generate initial down-payment Invoice (50% value)
            const invoiceNumber = `FAC-${Math.floor(100000 + Math.random() * 900000)}`;
            const invoiceAmount = Math.round(proposal.totalValue * 0.5);
            const [invoice] = await tx.insert(crmInvoices).values({
              customerId,
              contractId: contract.id,
              invoiceNumber,
              amount: invoiceAmount,
              status: "pending",
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days due
            }).returning();

            // Set up accounts receivable record
            await tx.insert(crmAccountsReceivable).values({
              customerId,
              invoiceId: invoice.id,
              outstandingBalance: invoiceAmount,
              daysPastDue: 0,
              collectionStatus: "normal",
            });
          }
        }

        // Log crm_business_events
        await logBusinessEventActionInternal(tx, {
          eventType: "PROPOSAL_ACCEPTED",
          entityType: "proposal",
          entityId,
          status: "success",
          metadata: {
            proposalId: entityId,
            proposalTitle: proposal.title,
            value: proposal.totalValue,
            signerEmail,
            ipAddress,
            signatureHash,
          },
        });

        // Trigger internal Telegram alert
        await sendNotificationActionInternal(tx, {
          customerId: customerId,
          userId: actorId,
          eventType: "proposal_accepted",
          title: `💼 Propuesta Firmada y Aceptada: ${proposal.title}`,
          message: `El cliente ha firmado digitalmente la propuesta por valor de COP $${proposal.totalValue.toLocaleString("es-CO")}.\nHash de Firma: ${signatureHash.substring(0, 10)}...`,
          severity: "info",
        });
      }
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: true, signatureHash } };
  } catch (error: any) {
    console.error("Sign Electronic Document Error:", error);
    return { success: false, error: error.message || "Fallo al procesar firma electrónica." };
  }
}
