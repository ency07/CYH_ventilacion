import React from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { crmCustomers, crmCustomerPlants, crmCustomerContacts, crmUsers } from "@/lib/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import ClientesClient from "./ClientesClient";
import { getMockCustomers, getMockPlants, getMockContacts } from "@/lib/utils/mock-customers";

export const dynamic = "force-dynamic";

async function seedMockCustomersIfEmpty(userEmail: string) {
  try {
    const existing = await db.select().from(crmCustomers).limit(1);
    if (existing.length === 0) {
      const mockCusts = getMockCustomers(userEmail);
      const mockPls = getMockPlants();
      const mockCos = getMockContacts();

      for (const cust of mockCusts) {
        await db.insert(crmCustomers).values({
          id: cust.id,
          name: cust.name,
          nit: cust.nit,
          status: cust.status,
          ltv: cust.ltv,
          assignedTo: cust.assignedTo,
          recurrenceIndex: cust.recurrenceIndex,
          createdAt: cust.createdAt,
          updatedAt: cust.updatedAt,
        });
      }

      for (const pl of mockPls) {
        await db.insert(crmCustomerPlants).values({
          id: pl.id,
          customerId: pl.customerId,
          name: pl.name,
          city: pl.city,
          address: pl.address,
          airflowCfm: pl.airflowCfm,
          createdAt: pl.createdAt,
        });
      }

      for (const co of mockCos) {
        await db.insert(crmCustomerContacts).values({
          id: co.id,
          customerId: co.customerId,
          fullName: co.fullName,
          cargo: co.cargo,
          phone: co.phone,
          email: co.email,
          createdAt: co.createdAt,
        });
      }
    } else {
      const mockNits = ["890.101.234-5", "800.222.555-1", "860.005.121-0"];
      for (const nit of mockNits) {
        await db.update(crmCustomers)
          .set({ assignedTo: userEmail })
          .where(eq(crmCustomers.nit, nit));
      }
    }
  } catch (err) {
    console.error("Error seeding mock customers:", err);
    throw err;
  }
}

export default async function B2BCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string };
}) {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // Retrieve details of the current logged-in user
  const { data: profile } = await supabase
    .from("crm_users")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "vendedor";
  const userEmail = profile?.email || user.email || "";

  // Normalize roles
  const isAdmin = ["admin", "super_admin", "director_comercial", "director", "root_dev"].includes(userRole);
  const isVendedor = ["vendedor", "comercial", "asesor_comercial"].includes(userRole);
  const isTecnico = ["tecnico", "ingeniero", "tecnico_preventa"].includes(userRole);

  const query = searchParams?.q || "";
  const estado = searchParams?.estado || "activo"; // default to activo as requested (?estado=activo)

  let customers: any[] = [];
  let kpis = {
    activeCustomers: 0,
    monitoredPlants: 0,
    commercialLtv: 0,
    recurrenceIndex: 0,
  };
  let salesReps: (typeof crmUsers.$inferSelect)[] = [];
  let dbFailed = false;

  try {
    // Attempt database seeding/re-assignment
    await seedMockCustomersIfEmpty(userEmail);

    // 1. Fetch total portfolio for KPI statistics (role-based restrictions)
    let kpiConditions = [];
    if (isVendedor) {
      kpiConditions.push(eq(crmCustomers.assignedTo, userEmail));
    }
    const kpiWhere = kpiConditions.length > 0 ? and(...kpiConditions) : undefined;

    const kpiData = await db.query.crmCustomers.findMany({
      where: kpiWhere,
      with: {
        plants: true,
      },
    });

    kpis = {
      activeCustomers: kpiData.filter((c) => c.status === "activo").length,
      monitoredPlants: kpiData.reduce((acc, c) => acc + (c.plants?.length || 0), 0),
      commercialLtv: kpiData.reduce((acc, c) => acc + (c.ltv || 0), 0),
      recurrenceIndex:
        kpiData.length > 0
          ? Math.round(kpiData.reduce((acc, c) => acc + (c.recurrenceIndex || 0), 0) / kpiData.length)
          : 0,
    };

    // 2. Fetch filtered customer list for the high-density grid
    let conditions = [];
    if (isVendedor) {
      conditions.push(eq(crmCustomers.assignedTo, userEmail));
    }

    if (query) {
      conditions.push(
        or(
          ilike(crmCustomers.name, `%${query}%`),
          ilike(crmCustomers.nit, `%${query}%`)
        )
      );
    }

    if (estado && estado !== "all") {
      conditions.push(eq(crmCustomers.status, estado));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    customers = await db.query.crmCustomers.findMany({
      where: whereClause,
      with: {
        plants: true,
        contacts: true,
      },
      orderBy: (crmCustomers, { desc }) => [desc(crmCustomers.createdAt)],
    });

    // Fetch list of sales representatives for customer assignment forms
    salesReps = await db.query.crmUsers.findMany({
      where: or(
        eq(crmUsers.role, "vendedor"),
        eq(crmUsers.role, "comercial"),
        eq(crmUsers.role, "director_comercial"),
        eq(crmUsers.role, "admin"),
        eq(crmUsers.role, "super_admin")
      ),
    });
  } catch (error) {
    console.error("Database connection failed, falling back to In-Memory B2B simulation data", error);
    dbFailed = true;

    // Load mock data from memory
    const mockCusts = getMockCustomers(userEmail);
    const mockPls = getMockPlants();
    const mockCos = getMockContacts();

    // Map relations in memory
    const joinedMock = mockCusts.map(cust => {
      const plants = mockPls.filter(pl => pl.customerId === cust.id);
      const contacts = mockCos.filter(co => co.customerId === cust.id);
      return {
        ...cust,
        plants,
        contacts,
      };
    });

    // Apply filtering in memory
    customers = joinedMock.filter(c => {
      const matchesQuery = !query || 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        (c.nit || "").toLowerCase().includes(query.toLowerCase());
      const matchesEstado = estado === "all" || c.status === estado;
      const matchesRbac = !isVendedor || c.assignedTo?.toLowerCase() === userEmail.toLowerCase();
      
      return matchesQuery && matchesEstado && matchesRbac;
    });

    // Calculate KPIs in memory
    const kpiBase = joinedMock.filter(c => !isVendedor || c.assignedTo?.toLowerCase() === userEmail.toLowerCase());
    kpis = {
      activeCustomers: kpiBase.filter(c => c.status === "activo").length,
      monitoredPlants: kpiBase.reduce((acc, c) => acc + c.plants.length, 0),
      commercialLtv: kpiBase.reduce((acc, c) => acc + c.ltv, 0),
      recurrenceIndex: kpiBase.length > 0 
        ? Math.round(kpiBase.reduce((acc, c) => acc + c.recurrenceIndex, 0) / kpiBase.length)
        : 0,
    };

    salesReps = [
      {
        id: user.id,
        email: userEmail,
        fullName: profile?.full_name || "Asesor Actual",
        role: userRole,
        avatarUrl: null,
        isActive: true,
        suspendedAt: null,
        suspendedBy: null,
        tenantId: null,
        createdAt: new Date(),
        phone: null,
        position: null,
        preferences: null,
        lastLoginAt: null,
      }
    ];
  }

  // TECNICO SECURITY MASKING: Remove LTV and money data from server arrays
  if (isTecnico) {
    customers = customers.map(c => ({
      ...c,
      ltv: 0,
    }));
    kpis.commercialLtv = 0;
  }

  return (
    <ClientesClient
      initialCustomers={customers}
      salesReps={salesReps}
      kpis={kpis}
      userRole={userRole}
      isAdmin={isAdmin}
      isTecnico={isTecnico}
      initialQuery={query}
      initialEstado={estado}
    />
  );
}
