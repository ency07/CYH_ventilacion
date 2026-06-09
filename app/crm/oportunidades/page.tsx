import React from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { crmOpportunities, leads, crmCompanies, crmUsers, diagnosticReports } from "@/lib/db/schema";
import { eq, desc, ne, and, or } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import OportunidadesClient from "./OportunidadesClient";
import { getMockOpportunities } from "@/lib/utils/mock-customers";

export const dynamic = "force-dynamic";

async function seedMockOpportunitiesIfEmpty(userEmail: string) {
  try {
    const existing = await db.select().from(crmOpportunities).limit(1);
    if (existing.length === 0) {
      // 1. Check or create mock companies
      const compNames = ["Monómeros S.A.", "Tecnoglass S.A.", "Cervecería Bavaria"];
      const createdCompanies: Record<string, string> = {};
      
      for (const name of compNames) {
        let [comp] = await db.select().from(crmCompanies).where(eq(crmCompanies.name, name)).limit(1);
        if (!comp) {
          [comp] = await db.insert(crmCompanies).values({
            name,
            industry: "Industrial / Manufactura",
            city: "Barranquilla",
          }).returning();
        }
        createdCompanies[name] = comp.id;
      }

      // 2. Create leads
      const lead1 = await db.insert(leads).values({
        fullName: "Ing. Jorge Pérez",
        companyName: "Monómeros S.A.",
        email: "jorge.perez@monomeros.co",
        phone: "+573001234567",
        city: "Barranquilla",
        serviceType: "venta",
        environmentType: "ácido",
        urgencyLevel: "alta",
        status: "negociacion",
        companyId: createdCompanies["Monómeros S.A."],
      }).returning();

      const lead2 = await db.insert(leads).values({
        fullName: "Carlos Müller",
        companyName: "Tecnoglass S.A.",
        email: "carlos.muller@tecnoglass.com",
        phone: "+573109876543",
        city: "Barranquilla",
        serviceType: "fabricacion",
        environmentType: "fundición",
        urgencyLevel: "media",
        status: "propuesta",
        companyId: createdCompanies["Tecnoglass S.A."],
      }).returning();

      const lead3 = await db.insert(leads).values({
        fullName: "Andrés Restrepo",
        companyName: "Cervecería Bavaria",
        email: "andres.restrepo@bavaria.co",
        phone: "+573201112222",
        city: "Barranquilla",
        serviceType: "venta",
        environmentType: "envasado",
        urgencyLevel: "alta",
        status: "analisis",
        companyId: createdCompanies["Cervecería Bavaria"],
      }).returning();

      // 3. Create diagnostic reports
      const diag1 = await db.insert(diagnosticReports).values({
        leadId: lead1[0].id,
        airflow: 350000,
        plantId: "11111111-1111-1111-1111-111111111112", // monomeros_pl
        dimensions: { width: 45, length: 120, height: 12 },
        technicalObservations: "Ambiente corrosivo por gases ácidos. Se requiere extractor helicocentrifugo en acero inoxidable con motor a prueba de explosión.",
        materialSuggestions: "Acero inoxidable 316, recubrimiento epóxico de alta resistencia.",
        recommendations: "Instalar 4 extractores de 87,500 CFM cada uno para lograr los 350,000 CFM requeridos.",
        status: "aprobado",
      }).returning();

      const diag2 = await db.insert(diagnosticReports).values({
        leadId: lead2[0].id,
        airflow: 180000,
        plantId: "22222222-2222-2222-2222-222222222223", // tecnoglass_pl
        dimensions: { width: 30, length: 80, height: 8 },
        technicalObservations: "Altas temperaturas por fundición de aluminio. Ventilación de confort requerida para operarios en frentes de trabajo.",
        materialSuggestions: "Lámina galvanizada calibre 18, extractores de transmisión de alta temperatura.",
        recommendations: "Inyección de aire limpio y fresco a nivel de piso, extracción localizada de humos en hornos.",
        status: "aprobado",
      }).returning();

      const diag3 = await db.insert(diagnosticReports).values({
        leadId: lead3[0].id,
        airflow: 220000,
        plantId: "33333333-3333-3333-3333-333333333334", // bavaria_pl1
        dimensions: { width: 50, length: 150, height: 10 },
        technicalObservations: "Condensación de vapor en zona de lavado de botellas. Humedad relativa superior al 90%.",
        materialSuggestions: "Campanas de extracción en acero inoxidable 304, extractores axiales de acoplamiento directo.",
        recommendations: "Implementar campanas colectoras de vapor sobre las lavadoras de botellas con extractores dedicados.",
        status: "aprobado",
      }).returning();

      // 4. Create opportunities
      await db.insert(crmOpportunities).values({
        leadId: lead1[0].id,
        diagnosticId: diag1[0].id,
        serviceType: "venta",
        title: "Suministro de Extractores CFM - Nave de Ácidos",
        estimatedValue: 45000000,
        probability: 80,
        weightedValue: 36000000,
        expectedCloseDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // ~24h (Licitación Crítica)
        stage: "negociacion",
        assignedTo: userEmail,
      });

      await db.insert(crmOpportunities).values({
        leadId: lead2[0].id,
        diagnosticId: diag2[0].id,
        serviceType: "fabricacion",
        title: "Sistema de Inyección y Extracción - Fundición Aluminios",
        estimatedValue: 85000000,
        probability: 45,
        weightedValue: 38250000,
        expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
        stage: "propuesta",
        assignedTo: userEmail,
      });

      await db.insert(crmOpportunities).values({
        leadId: lead3[0].id,
        diagnosticId: diag3[0].id,
        serviceType: "venta",
        title: "Renovación de Campanas y Extractores - Envasado Barranquilla",
        estimatedValue: 120000000,
        probability: 15,
        weightedValue: 18000000,
        expectedCloseDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expirado ayer (Licitación Crítica)
        stage: "analisis",
        assignedTo: userEmail,
      });
    } else {
      // Re-assign existing seeded opportunities to current advisor so filtering works beautifully
      const seededTitles = [
        "Suministro de Extractores CFM - Nave de Ácidos",
        "Sistema de Inyección y Extracción - Fundición Aluminios",
        "Renovación de Campanas y Extractores - Envasado Barranquilla"
      ];
      for (const t of seededTitles) {
        await db.update(crmOpportunities)
          .set({ assignedTo: userEmail })
          .where(eq(crmOpportunities.title, t));
      }
    }
  } catch (err) {
    console.error("Error seeding crm opportunities:", err);
  }
}

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: { q?: string; probabilidad?: string; solucion?: string };
}) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch role check from Drizzle
  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
  const userRole = dbUser?.role || "vendedor";
  const userEmail = dbUser?.email || user.email || "";

  // Normalize roles
  const isAdmin = ["admin", "super_admin", "director_comercial", "director"].includes(userRole);
  const isVendedor = ["vendedor", "comercial", "asesor_comercial"].includes(userRole);
  const isTecnico = ["tecnico", "ingeniero", "tecnico_preventa"].includes(userRole);

  let opps: any[] = [];
  let activeLeads: any[] = [];
  let dbFailed = false;

  try {
    // Attempt seeding B2B opportunities
    await seedMockOpportunitiesIfEmpty(userEmail);

    // Apply strict filtering based on roles
    let conditions = [];
    if (isVendedor) {
      conditions.push(eq(crmOpportunities.assignedTo, userEmail));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rawOpps = await db.select({
      opportunity: {
        id: crmOpportunities.id,
        leadId: crmOpportunities.leadId,
        diagnosticId: crmOpportunities.diagnosticId,
        serviceType: crmOpportunities.serviceType,
        title: crmOpportunities.title,
        estimatedValue: crmOpportunities.estimatedValue,
        probability: crmOpportunities.probability,
        weightedValue: crmOpportunities.weightedValue,
        expectedCloseDate: crmOpportunities.expectedCloseDate,
        stage: crmOpportunities.stage,
        assignedTo: crmOpportunities.assignedTo,
        createdAt: crmOpportunities.createdAt,
        updatedAt: crmOpportunities.updatedAt,
      },
      lead: { 
        id: leads.id,
        fullName: leads.fullName,
        companyName: leads.companyName,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        serviceType: leads.serviceType,
        environmentType: leads.environmentType,
      },
      companyName: crmCompanies.name,
      diagnosticReport: {
        id: diagnosticReports.id,
        leadId: diagnosticReports.leadId,
        airflow: diagnosticReports.airflow,
        dimensions: diagnosticReports.dimensions,
        technicalObservations: diagnosticReports.technicalObservations,
        materialSuggestions: diagnosticReports.materialSuggestions,
        recommendations: diagnosticReports.recommendations,
      },
    })
    .from(leads)
    .leftJoin(crmOpportunities, eq(leads.id, crmOpportunities.leadId))
    .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
    .leftJoin(diagnosticReports, eq(leads.id, diagnosticReports.leadId))
    .where(whereClause)
    .orderBy(desc(leads.createdAt));

    opps = rawOpps.map(row => {
      const oppObj = row.opportunity?.id ? row.opportunity : {
        id: `virtual-${row.lead.id}`,
        leadId: row.lead.id,
        diagnosticId: row.diagnosticReport?.id || null,
        serviceType: row.lead.serviceType || "venta",
        title: `Proyecto ${row.lead.serviceType?.toUpperCase()} - ${row.lead.companyName}`,
        estimatedValue: 0,
        probability: 0,
        weightedValue: 0,
        expectedCloseDate: null,
        stage: "analisis",
        assignedTo: "comercial@cyh.com",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return {
        ...row,
        opportunity: oppObj
      };
    });

    activeLeads = await db.select({
      id: leads.id,
      fullName: leads.fullName,
      companyName: leads.companyName
    })
    .from(leads)
    .where(ne(leads.status, "ganado"))
    .orderBy(desc(leads.createdAt));

  } catch (error) {
    console.error("Database connection failed, falling back to In-Memory simulation data", error);
    dbFailed = true;

    // Load mock data from memory
    const mockOpps = getMockOpportunities(userEmail);

    // Apply filtering in memory
    opps = mockOpps.filter(o => {
      const matchesRbac = !isVendedor || o.opportunity.assignedTo?.toLowerCase() === userEmail.toLowerCase();
      return matchesRbac;
    });

    activeLeads = mockOpps.map(o => ({
      id: o.lead.id,
      fullName: o.lead.fullName,
      companyName: o.lead.companyName,
    }));
  }

  // TECNICO SECURITY MASKING: mask estimatedValue and weightedValue to 0
  if (isTecnico) {
    opps = opps.map(o => ({
      ...o,
      opportunity: {
        ...o.opportunity,
        estimatedValue: 0,
        weightedValue: 0,
      }
    }));
  }

  return (
    <OportunidadesClient 
      initialOpps={opps} 
      activeLeads={activeLeads}
      userRole={userRole}
      isAdmin={isAdmin}
      isTecnico={isTecnico}
      initialQuery={searchParams?.q || ""}
      initialProb={searchParams?.probabilidad || "all"}
      initialSolucion={searchParams?.solucion || "all"}
    />
  );
}
