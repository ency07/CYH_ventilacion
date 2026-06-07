"use server";

import { db } from "@/lib/db";
import { crmCompanies, crmContacts, leads, crmUsers, crmPipeline, crmOpportunities } from "@/lib/db/schema";
import { LeadInsertSchema } from "@/lib/validations/crm.schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function calculateLeadScore(lead: {
  email: string;
  phone: string;
  estimatedBudgetMax: number | null;
  cargo: string | null;
  city: string;
}): { score: number; risk: "HOT" | "WARM" | "LOW" | "SPAM" } {
  let score = 0;

  // 1. Correo corporativo (+30): no es gmail, hotmail, yahoo, live, outlook, etc.
  const email = lead.email.toLowerCase();
  const domain = email.split("@")[1] || "";
  const publicDomains = ["gmail.com", "hotmail.com", "yahoo.com", "live.com", "outlook.com", "icloud.com", "aol.com"];
  const isCorporate = !publicDomains.includes(domain);
  if (isCorporate) score += 30;

  // 2. Teléfono válido Colombia (+25): starts with +57
  const isColombiaPhone = lead.phone.startsWith("+57");
  if (isColombiaPhone) score += 25;

  // 3. Presupuesto > 50M (+20)
  const budget = lead.estimatedBudgetMax || 0;
  if (budget > 50000000) score += 20;

  // 4. Cargo gerencial (+15): director, gerente, jefe, supervisor, manager, lead
  const pos = (lead.cargo || "").toLowerCase();
  const executiveKeywords = ["gerente", "director", "jefe", "supervisor", "manager", "lead", "coordinador"];
  const isExecutive = executiveKeywords.some(kw => pos.includes(kw));
  if (isExecutive) score += 15;

  // 5. Ciudad industrial (+15): Barranquilla, Bogota, Medellin, Cali, Cartagena, Santa Marta
  const city = lead.city.toLowerCase();
  const industrialCities = ["barranquilla", "bogota", "bogotá", "medellin", "medellín", "cali", "cartagena", "santa marta"];
  const isIndustrialCity = industrialCities.some(c => city.includes(c));
  if (isIndustrialCity) score += 15;

  // 6. Dominio empresarial real (+10): if corporate and domain has dot and length >= 4
  if (isCorporate && domain.includes(".") && domain.length >= 4) {
    score += 10;
  }

  // Determine Risk Level
  let risk: "HOT" | "WARM" | "LOW" | "SPAM" = "LOW";
  if (score >= 75) risk = "HOT";
  else if (score >= 45) risk = "WARM";
  else if (score >= 15) risk = "LOW";
  else risk = "SPAM";

  return { score, risk };
}

export async function createLeadAction(rawInput: any): Promise<ActionResult<any>> {
  try {
    const validated = LeadInsertSchema.parse(rawInput);

    const { score, risk } = calculateLeadScore({
      email: validated.email,
      phone: validated.phone,
      estimatedBudgetMax: validated.estimatedBudgetMax ?? null,
      cargo: validated.cargo ?? null,
      city: validated.city,
    });

    // B2B Logic: Upsert Company
    let companyId = null;
    if (validated.companyName) {
      const existingCompany = await db.query.crmCompanies.findFirst({
        where: eq(crmCompanies.name, validated.companyName)
      });
      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const [newComp] = await db.insert(crmCompanies).values({
          name: validated.companyName,
          city: validated.city,
        }).returning();
        companyId = newComp.id;
      }
    }

    // B2B Logic: Upsert Contact
    let contactId = null;
    if (validated.fullName && companyId) {
      const existingContact = await db.query.crmContacts.findFirst({
        where: eq(crmContacts.email, validated.email)
      });
      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const [newCont] = await db.insert(crmContacts).values({
          companyId,
          fullName: validated.fullName,
          cargo: validated.cargo ?? null,
          email: validated.email,
          phone: validated.phone,
        }).returning();
        contactId = newCont.id;
      }
    }

    const [newLead] = await db.insert(leads).values({
      fullName: validated.fullName,
      companyName: validated.companyName,
      companyId: companyId,
      contactId: contactId,
      email: validated.email,
      phone: validated.phone,
      cargo: validated.cargo ?? null,
      city: validated.city,
      serviceType: validated.serviceType,
      environmentType: validated.environmentType,
      urgencyLevel: validated.urgencyLevel,
      status: validated.status,
      source: validated.source,
      estimatedBudgetMin: validated.estimatedBudgetMin ?? null,
      estimatedBudgetMax: validated.estimatedBudgetMax ?? null,
      complexityScore: validated.complexityScore ?? null,
      severityScore: validated.severityScore ?? null,
      notes: validated.notes ?? null,
      leadScore: score,
      riskLevel: risk,
      isVerified: validated.isVerified || false,
    }).returning();

    // Auto-create crmPipeline entry
    await db.insert(crmPipeline).values({
      leadId: newLead.id,
      stage: newLead.status || "nuevo",
      priority: newLead.urgencyLevel === "alta" ? "alta" : "media",
      assignedTo: "comercial@cyh.com",
      probability: 10,
    });

    // Auto-create crmOpportunities entry
    const estBudget = newLead.estimatedBudgetMax || 0;
    const initialProb = 20; // corresponding to stage 'nuevo' (analisis)
    await db.insert(crmOpportunities).values({
      leadId: newLead.id,
      serviceType: newLead.serviceType,
      title: `Proyecto ${newLead.serviceType.toUpperCase()} - ${newLead.companyName}`,
      estimatedValue: estBudget,
      probability: initialProb,
      weightedValue: Math.round((estBudget * initialProb) / 100),
      stage: "analisis",
      assignedTo: "comercial@cyh.com",
    });

    revalidatePath("/crm");
    revalidatePath("/crm/dashboard");
    revalidatePath("/crm/leads");
    return { success: true, data: newLead };
  } catch (error: any) {
    console.error("CYH CRM SQL ERROR:", {
      message: error?.message,
      detail: error?.detail,
      hint: error?.hint,
      cause: error?.cause,
      stack: error?.stack,
    });

    throw new Error(
      "No pudimos registrar la solicitud en este momento. Verifica la información e intenta nuevamente."
    );
  }
}

export async function getLeadByIdAction(id: string): Promise<ActionResult<any>> {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return { success: false, error: "Formato de ID inválido." };
    }

    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autenticado." };
    }

    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    const userRole = dbUser?.role || "vendedor";
    const userEmail = dbUser?.email || user.email || "";

    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
      with: {
        crmTasks: true,
        crmActivityLogs: true,
        diagnosticReports: true,
        crmProposals: true,
        crmDocuments: true,
        crmOpportunities: true,
        crmPipelines: true,
      }
    });
    
    if (!lead) {
      return { success: false, error: "Lead no encontrado." };
    }

    // Role visibility validation: vendedor/comercial only see their assigned leads (or unassigned leads)
    if (userRole === "vendedor" || userRole === "comercial") {
      const hasPipeline = lead.crmPipelines && lead.crmPipelines.length > 0;
      if (hasPipeline) {
        const isAssignedToMeOrUnassigned = lead.crmPipelines.some((p: any) => 
          !p.assignedTo || 
          p.assignedTo === "" ||
          p.assignedTo.toLowerCase() === userEmail.toLowerCase()
        );
        if (!isAssignedToMeOrUnassigned) {
          return { success: false, error: "Acceso denegado. Este lead está asignado a otro asesor." };
        }
      }
    }

    return { success: true, data: lead };
  } catch (error: any) {
    console.error(`Error fetching lead by id ${id}:`, error);
    return { success: false, error: error.message || "Error al buscar el lead." };
  }
}

export async function getRecentLeadsAction(limit = 10): Promise<ActionResult<any[]>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const recent = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
    return { success: true, data: recent };
  } catch (error: any) {
    console.error("Error fetching recent leads:", error);
    return { success: false, error: error.message || "Error al buscar leads recientes." };
  }
}
