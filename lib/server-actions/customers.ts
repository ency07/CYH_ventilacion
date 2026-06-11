"use server";

import { db } from "@/lib/db";
import { 
  crmCustomers, 
  crmCustomerPlants, 
  crmCustomerContacts, 
  diagnosticReports, 
  leads, 
  crmUsers 
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

import { getCurrentUser } from "@/lib/auth/permissions";

// Helper to check user roles and permissions
async function getAuthenticatedUser() {
  const dbUser = await getCurrentUser();
  return { 
    user: { id: dbUser.id, email: dbUser.email }, 
    role: dbUser.role, 
    email: dbUser.email 
  };
}

export async function createCustomerAction(data: {
  name: string;
  nit?: string;
  assignedTo?: string;
  status?: string;
}): Promise<ActionResult<typeof crmCustomers.$inferSelect>> {
  try {
    const { role } = await getAuthenticatedUser();
    if (role === "tecnico") {
      return { success: false, error: "Acceso denegado: Los técnicos no pueden registrar clientes." };
    }

    const [newCustomer] = await db.insert(crmCustomers).values({
      name: data.name,
      nit: data.nit || null,
      assignedTo: data.assignedTo || null,
      status: (data.status as any) || "activo",
      ltv: 0,
      recurrenceIndex: 0,
    }).returning();

    revalidatePath("/crm/clientes");
    revalidatePath("/crm/dashboard");
    return { success: true, data: newCustomer };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el cliente." };
  }
}

export async function updateCustomerStatusAction(
  id: string,
  status: "activo" | "inactivo"
): Promise<ActionResult<typeof crmCustomers.$inferSelect>> {
  try {
    const { role, email } = await getAuthenticatedUser();
    if (role === "tecnico") {
      return { success: false, error: "Acceso denegado: Los técnicos no pueden actualizar contratos." };
    }

    // Vendedor can only update their assigned customers
    if (role === "vendedor" || role === "comercial") {
      const [customer] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, id));
      if (customer && customer.assignedTo && customer.assignedTo.toLowerCase() !== email.toLowerCase()) {
        return { success: false, error: "Acceso denegado: No tiene permisos sobre este cliente." };
      }
    }

    const [updated] = await db.update(crmCustomers)
      .set({ status, updatedAt: new Date() })
      .where(eq(crmCustomers.id, id))
      .returning();

    revalidatePath("/crm/clientes");
    revalidatePath(`/crm/clientes/${id}`);
    revalidatePath("/crm/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar el estado del cliente." };
  }
}

export async function createCustomerPlantAction(data: {
  customerId: string;
  name: string;
  city: string;
  address?: string;
  airflowCfm?: number;
}): Promise<ActionResult<typeof crmCustomerPlants.$inferSelect>> {
  try {
    await getAuthenticatedUser();
    // TECHNICAL, VENDEDOR/COMERCIAL, ADMIN/DIRECTOR can create plants

    const [newPlant] = await db.insert(crmCustomerPlants).values({
      customerId: data.customerId,
      name: data.name,
      city: data.city,
      address: data.address || null,
      airflowCfm: data.airflowCfm || 0,
    }).returning();

    revalidatePath("/crm/clientes");
    revalidatePath(`/crm/clientes/${data.customerId}`);
    revalidatePath("/crm/dashboard");
    return { success: true, data: newPlant };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear la planta." };
  }
}

export async function createCustomerContactAction(data: {
  customerId: string;
  fullName: string;
  cargo?: string;
  phone?: string;
  email?: string;
}): Promise<ActionResult<typeof crmCustomerContacts.$inferSelect>> {
  try {
    const { role } = await getAuthenticatedUser();
    if (role === "tecnico") {
      return { success: false, error: "Acceso denegado: Los técnicos no pueden gestionar contactos comerciales." };
    }

    const [newContact] = await db.insert(crmCustomerContacts).values({
      customerId: data.customerId,
      fullName: data.fullName,
      cargo: data.cargo || null,
      phone: data.phone || null,
      email: data.email || null,
    }).returning();

    revalidatePath("/crm/clientes");
    revalidatePath(`/crm/clientes/${data.customerId}`);
    return { success: true, data: newContact };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el contacto." };
  }
}

export async function addTechnicalMeasurementAction(data: {
  plantId: string;
  airflow: number;
  technicalObservations?: string;
  recommendations?: string;
  materialSuggestions?: string;
}): Promise<ActionResult<typeof diagnosticReports.$inferSelect>> {
  try {
    const { user } = await getAuthenticatedUser();

    // 1. Find the customer associated with this plant
    const [plant] = await db.select().from(crmCustomerPlants).where(eq(crmCustomerPlants.id, data.plantId));
    if (!plant) {
      return { success: false, error: "Planta no encontrada." };
    }

    const [customer] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, plant.customerId));
    if (!customer) {
      return { success: false, error: "Cliente asociado no encontrado." };
    }

    // 2. Find or create a lead for this customer to satisfy leadId .notNull() constraint
    let leadId: string;
    const [existingLead] = await db.select().from(leads)
      .where(eq(leads.companyName, customer.name))
      .orderBy(desc(leads.createdAt))
      .limit(1);

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      // Create a default placeholder lead
      const [newLead] = await db.insert(leads).values({
        fullName: "Contacto Principal B2B",
        companyName: customer.name,
        email: "b2b@cyh.com",
        phone: "0000000000",
        city: plant.city,
        serviceType: "mantenimiento",
        environmentType: "industrial",
        urgencyLevel: "media",
        status: "diagnostico",
        source: "wizard",
        leadScore: 50,
      }).returning();
      leadId = newLead.id;
    }

    // 3. Insert diagnostic report
    const [newReport] = await db.insert(diagnosticReports).values({
      leadId,
      plantId: data.plantId,
      airflow: data.airflow,
      technicalObservations: data.technicalObservations || null,
      recommendations: data.recommendations || null,
      materialSuggestions: data.materialSuggestions || null,
      status: "aprobado", 
      createdBy: user.id,
      versionNumber: 1,
    }).returning();

    // 4. Update the plant's airflowCfm to match the latest measurement
    await db.update(crmCustomerPlants)
      .set({ airflowCfm: data.airflow })
      .where(eq(crmCustomerPlants.id, data.plantId));

    revalidatePath("/crm/clientes");
    revalidatePath(`/crm/clientes/${plant.customerId}`);
    revalidatePath("/crm/dashboard");
    return { success: true, data: newReport };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al registrar la medición técnica." };
  }
}
