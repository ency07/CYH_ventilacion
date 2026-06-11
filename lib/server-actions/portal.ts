"use server";

import { db } from "@/lib/db";
import { 
  crmCustomers, 
  crmCustomerPlants, 
  crmCustomerContacts, 
  crmServiceRequests,
  crmActivityLogs,
  crmAuditLogs,
  leads,
  crmProposals
} from "@/lib/db/schema";
import { eq, and, gte, desc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { requireRole } from "@/lib/auth/permissions";
import { RequestServiceSchema } from "@/lib/validations/portal.schema";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Technical service request server action for B2B portal clients
 */
export async function requestTechnicalServiceAction(rawInput: unknown): Promise<ActionResult<{ requestId: string }>> {
  try {
    // 1. Authenticate caller (Excludes root_dev per principal requirement)
    const user = await requireRole(["cliente", "admin"]);
    const userId = user.id;

    // 2. Fetch headers & cookies for forensic audit logging (Pilar X)
    const reqHeaders = headers();
    const userAgent = reqHeaders.get("user-agent") || "Unknown";
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const cookieStore = cookies();
    // Retrieve supabase cookie name pattern for authorization tracking if present
    const cookieNames = cookieStore.getAll().map(c => c.name);
    const authCookieName = cookieNames.find(name => name.includes("auth-token"));
    const sessionId = authCookieName ? cookieStore.get(authCookieName)?.value?.substring(0, 32) || "session-active" : "portal-session-id";

    // 3. Zod Input Validation (Pilar V)
    const validated = RequestServiceSchema.parse(rawInput);

    // 4. Rate Limiting Check (Pilar XI - 5 requests / hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [recentRequestsCount] = await db
      .select({ val: count() })
      .from(crmServiceRequests)
      .where(
        and(
          eq(crmServiceRequests.createdBy, userId),
          gte(crmServiceRequests.createdAt, oneHourAgo)
        )
      );
    
    if (recentRequestsCount && recentRequestsCount.val >= 5) {
      return { 
        success: false, 
        error: "Límite de solicitudes excedido. Has creado 5 solicitudes en la última hora. Inténtalo más tarde." 
      };
    }

    // 5. Database Transaction (Pilar VI & X - Atomic rollbacks if logging fails)
    const result = await db.transaction(async (tx) => {
      // Resolve Customer associated with user
      const [contact] = await tx
        .select()
        .from(crmCustomerContacts)
        .where(eq(crmCustomerContacts.userId, userId))
        .limit(1);

      if (!contact) {
        throw new Error("No se encontró una empresa asociada a esta cuenta. Contacte a soporte.");
      }

      const [customer] = await tx
        .select()
        .from(crmCustomers)
        .where(eq(crmCustomers.id, contact.customerId))
        .limit(1);

      if (!customer) {
        throw new Error("Cliente corporativo no registrado.");
      }

      let plantId = validated.plantId;

      // Handle new plant registration
      if (validated.newPlantName) {
        if (!validated.city) {
          throw new Error("La ciudad es obligatoria para registrar una nueva planta.");
        }
        const [newPlant] = await tx
          .insert(crmCustomerPlants)
          .values({
            customerId: customer.id,
            name: validated.newPlantName,
            city: validated.city,
            airflowCfm: 0,
          })
          .returning();
        
        plantId = newPlant.id;
      }

      if (!plantId) {
        throw new Error("Se debe seleccionar una planta o registrar una nueva.");
      }

      // Format description with event metadata for structured visibility (Pilar II & Mesa de Servicios)
      const formattedDescription = `[TIPO EVENTO: ${validated.serviceType || "No especificado"}]
[IMPACTO: ${validated.operationalImpact || "No especificado"}]
[EQUIPO AFECTADO: ${validated.affectedAsset || "No especificado"}]

DETALLE:
${validated.description}`;

      // Create service request record
      const [newRequest] = await tx
        .insert(crmServiceRequests)
        .values({
          customerId: customer.id,
          plantId: plantId,
          title: validated.title,
          description: formattedDescription,
          urgency: validated.urgency,
          status: "abierta",
          createdBy: userId,
        })
        .returning();

      // Find latest lead of this customer to attach activity log
      const [associatedLead] = await tx
        .select()
        .from(leads)
        .where(eq(leads.companyName, customer.name))
        .orderBy(desc(leads.createdAt))
        .limit(1);

      if (associatedLead) {
        await tx.insert(crmActivityLogs).values({
          leadId: associatedLead.id,
          activityType: "technical",
          description: `Solicitud de asistencia técnica "${validated.title}" ingresada por el cliente.`,
        });
      }

      // Forensic Audit Logging (Pilar X)
      await tx.insert(crmAuditLogs).values({
        actorId: userId,
        action: "create_service_request",
        entityAffected: `crm_service_requests:${newRequest.id}`,
        ipAddress: ipAddress,
        userAgent: userAgent,
        metadata: {
          userId: userId,
          email: user.email,
          action: "create",
          sessionId: sessionId,
          origin: "portal_cliente",
          requestId: newRequest.id,
          plantId: plantId,
        } as any,
      });

      return { requestId: newRequest.id };
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: result };

  } catch (error: any) {
    console.error("Technical Service Request Error:", error);
    // Pilar XII - Offline/Error resilience: gracefully return error without promise reject
    return { 
      success: false, 
      error: error.message || "Error de conexión. Intente nuevamente en unos minutos." 
    };
  }
}

/**
 * Accept proposal with confirmation and terms acceptance logging (Pilar X, VI, and IX)
 */
export async function acceptProposalAction(proposalId: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await requireRole(["cliente", "admin"]);
    const userId = user.id;

    const reqHeaders = headers();
    const userAgent = reqHeaders.get("user-agent") || "Unknown";
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const cookieStore = cookies();
    const cookieNames = cookieStore.getAll().map(c => c.name);
    const authCookieName = cookieNames.find(name => name.includes("auth-token"));
    const sessionId = authCookieName ? cookieStore.get(authCookieName)?.value?.substring(0, 32) || "session-active" : "portal-session-id";

    const result = await db.transaction(async (tx) => {
      // Fetch the proposal
      const [proposal] = await tx
        .select()
        .from(crmProposals)
        .where(eq(crmProposals.id, proposalId))
        .limit(1);

      if (!proposal) {
        throw new Error("La propuesta comercial no existe.");
      }

      // Check client authorization by resolving their customer ID
      const [contact] = await tx
        .select()
        .from(crmCustomerContacts)
        .where(eq(crmCustomerContacts.userId, userId))
        .limit(1);

      if (!contact) {
        throw new Error("No se encontró una empresa asociada a esta cuenta.");
      }

      // Find the associated lead for verification
      const [lead] = await tx
        .select()
        .from(leads)
        .where(eq(leads.id, proposal.leadId))
        .limit(1);

      if (!lead) {
        throw new Error("Lead asociado no encontrado.");
      }

      // Verify tenant ownership matches contact company ID
      if (lead.companyId !== contact.customerId) {
        const [customer] = await tx
          .select()
          .from(crmCustomers)
          .where(eq(crmCustomers.id, contact.customerId))
          .limit(1);
        
        if (!customer || lead.companyName.toLowerCase() !== customer.name.toLowerCase()) {
          throw new Error("Acceso denegado: esta propuesta no pertenece a su empresa.");
        }
      }

      // Update proposal status
      await tx
        .update(crmProposals)
        .set({ status: "aceptada", updatedAt: new Date() })
        .where(eq(crmProposals.id, proposalId));

      // Also update lead status to "ganado"
      await tx
        .update(leads)
        .set({ status: "ganado", updatedAt: new Date() })
        .where(eq(leads.id, proposal.leadId));

      // Log activity in CRM
      await tx.insert(crmActivityLogs).values({
        leadId: proposal.leadId,
        activityType: "commercial",
        description: `Propuesta "${proposal.title}" (V${proposal.version}) ACEPTADA por el cliente via portal B2B.`,
      });

      // Forensic Audit Log (Pilar X)
      await tx.insert(crmAuditLogs).values({
        actorId: userId,
        action: "accept_proposal",
        entityAffected: `crm_proposals:${proposalId}`,
        ipAddress: ipAddress,
        userAgent: userAgent,
        metadata: {
          userId: userId,
          email: user.email,
          action: "accept",
          sessionId: sessionId,
          origin: "portal_cliente",
          proposalId: proposalId,
          version: proposal.version,
          termsAccepted: true,
        } as any,
      });

      return true;
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: { success: result } };

  } catch (error: any) {
    console.error("Accept Proposal Error:", error);
    return { success: false, error: error.message || "Error al procesar la aceptación." };
  }
}

/**
 * Request a commercial alignment meeting for a proposal
 */
export async function requestCommercialMeetingAction(proposalId: string): Promise<ActionResult<{ requestId: string }>> {
  try {
    const user = await requireRole(["cliente", "admin"]);
    const userId = user.id;

    const reqHeaders = headers();
    const userAgent = reqHeaders.get("user-agent") || "Unknown";
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const cookieStore = cookies();
    const cookieNames = cookieStore.getAll().map(c => c.name);
    const authCookieName = cookieNames.find(name => name.includes("auth-token"));
    const sessionId = authCookieName ? cookieStore.get(authCookieName)?.value?.substring(0, 32) || "session-active" : "portal-session-id";

    const result = await db.transaction(async (tx) => {
      // Resolve proposal
      const [proposal] = await tx
        .select()
        .from(crmProposals)
        .where(eq(crmProposals.id, proposalId))
        .limit(1);

      if (!proposal) {
        throw new Error("La propuesta comercial no existe.");
      }

      // Resolve user customer details
      const [contact] = await tx
        .select()
        .from(crmCustomerContacts)
        .where(eq(crmCustomerContacts.userId, userId))
        .limit(1);

      if (!contact) {
        throw new Error("No se encontró una empresa asociada a esta cuenta.");
      }

      // Create a service request of type 'alineacion_comercial'
      const [newRequest] = await tx
        .insert(crmServiceRequests)
        .values({
          customerId: contact.customerId,
          plantId: null, // General commercial alignment
          title: `Alineación Comercial: ${proposal.title} (V${proposal.version})`,
          description: `El cliente ha solicitado una reunión de alineación comercial para la propuesta comercial ID: ${proposalId}.`,
          urgency: "media",
          status: "abierta",
          createdBy: userId,
        })
        .returning();

      // Log activity
      await tx.insert(crmActivityLogs).values({
        leadId: proposal.leadId,
        activityType: "commercial",
        description: `Reunión comercial solicitada para la propuesta "${proposal.title}" (V${proposal.version}) via portal B2B.`,
      });

      // Audit Log
      await tx.insert(crmAuditLogs).values({
        actorId: userId,
        action: "request_commercial_meeting",
        entityAffected: `crm_service_requests:${newRequest.id}`,
        ipAddress: ipAddress,
        userAgent: userAgent,
        metadata: {
          userId: userId,
          email: user.email,
          action: "request_meeting",
          sessionId: sessionId,
          origin: "portal_cliente",
          proposalId: proposalId,
          requestId: newRequest.id,
        } as any,
      });

      return { requestId: newRequest.id };
    });

    revalidatePath("/portal/inicio");
    return { success: true, data: result };

  } catch (error: any) {
    console.error("Request Commercial Meeting Error:", error);
    return { success: false, error: error.message || "Error al procesar la solicitud de reunión." };
  }
}
