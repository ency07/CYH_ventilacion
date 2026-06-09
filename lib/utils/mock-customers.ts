import { crmCustomers, crmCustomerPlants, crmCustomerContacts } from "@/lib/db/schema";

export const MOCK_CUSTOMER_IDS = {
  monomeros: "11111111-1111-1111-1111-111111111111",
  tecnoglass: "22222222-2222-2222-2222-222222222222",
  bavaria: "33333333-3333-3333-3333-333333333333",
};

export const MOCK_PLANT_IDS = {
  monomeros_pl: "11111111-1111-1111-1111-111111111112",
  tecnoglass_pl: "22222222-2222-2222-2222-222222222223",
  bavaria_pl1: "33333333-3333-3333-3333-333333333334",
  bavaria_pl2: "33333333-3333-3333-3333-333333333335",
};

export const MOCK_CONTACT_IDS = {
  monomeros_co1: "11111111-1111-1111-1111-111111111113",
  monomeros_co2: "11111111-1111-1111-1111-111111111114",
  tecnoglass_co1: "22222222-2222-2222-2222-222222222224",
  bavaria_co1: "33333333-3333-3333-3333-333333333336",
};

export function getMockCustomers(userEmail: string): (typeof crmCustomers.$inferSelect)[] {
  return [
    {
      id: MOCK_CUSTOMER_IDS.monomeros,
      name: "Monómeros S.A.",
      nit: "890.101.234-5",
      status: "activo",
      ltv: 120000000,
      assignedTo: userEmail,
      recurrenceIndex: 85,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: MOCK_CUSTOMER_IDS.tecnoglass,
      name: "Tecnoglass S.A.",
      nit: "800.222.555-1",
      status: "activo",
      ltv: 85000000,
      assignedTo: userEmail,
      recurrenceIndex: 90,
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-01"),
    },
    {
      id: MOCK_CUSTOMER_IDS.bavaria,
      name: "Cervecería Bavaria",
      nit: "860.005.121-0",
      status: "activo",
      ltv: 240000000,
      assignedTo: userEmail,
      recurrenceIndex: 95,
      createdAt: new Date("2026-03-01"),
      updatedAt: new Date("2026-03-01"),
    },
  ];
}

export function getMockPlants(): (typeof crmCustomerPlants.$inferSelect)[] {
  return [
    {
      id: MOCK_PLANT_IDS.monomeros_pl,
      customerId: MOCK_CUSTOMER_IDS.monomeros,
      name: "Nave de Ácidos - Barranquilla",
      city: "Barranquilla",
      address: "Zona Industrial de Barranquilla",
      airflowCfm: 350000,
      createdAt: new Date("2026-01-02"),
    },
    {
      id: MOCK_PLANT_IDS.tecnoglass_pl,
      customerId: MOCK_CUSTOMER_IDS.tecnoglass,
      name: "Fundición Aluminios - Vía Circunvalar",
      city: "Barranquilla",
      address: "Vía Circunvalar",
      airflowCfm: 180000,
      createdAt: new Date("2026-02-02"),
    },
    {
      id: MOCK_PLANT_IDS.bavaria_pl1,
      customerId: MOCK_CUSTOMER_IDS.bavaria,
      name: "Envasado Barranquilla",
      city: "Barranquilla",
      address: "Vía 40",
      airflowCfm: 220000,
      createdAt: new Date("2026-03-02"),
    },
    {
      id: MOCK_PLANT_IDS.bavaria_pl2,
      customerId: MOCK_CUSTOMER_IDS.bavaria,
      name: "Logística Cartagena",
      city: "Cartagena",
      address: "Mamonal",
      airflowCfm: 95000,
      createdAt: new Date("2026-03-03"),
    },
  ];
}

export function getMockContacts(): (typeof crmCustomerContacts.$inferSelect)[] {
  return [
    {
      id: MOCK_CONTACT_IDS.monomeros_co1,
      customerId: MOCK_CUSTOMER_IDS.monomeros,
      fullName: "Ing. Jorge Pérez",
      cargo: "Jefe de Planta",
      phone: "+573001234567",
      email: "jorge.perez@monomeros.co",
      createdAt: new Date("2026-01-03"),
    },
    {
      id: MOCK_CONTACT_IDS.monomeros_co2,
      customerId: MOCK_CUSTOMER_IDS.monomeros,
      fullName: "Clara Inés",
      cargo: "Compras",
      phone: "+573007654321",
      email: "clara.ines@monomeros.co",
      createdAt: new Date("2026-01-04"),
    },
    {
      id: MOCK_CONTACT_IDS.tecnoglass_co1,
      customerId: MOCK_CUSTOMER_IDS.tecnoglass,
      fullName: "Carlos Müller",
      cargo: "Director de Proyectos",
      phone: "+573109876543",
      email: "carlos.muller@tecnoglass.com",
      createdAt: new Date("2026-02-03"),
    },
    {
      id: MOCK_CONTACT_IDS.bavaria_co1,
      customerId: MOCK_CUSTOMER_IDS.bavaria,
      fullName: "Andrés Restrepo",
      cargo: "Gerente de Operaciones",
      phone: "+573201112222",
      email: "andres.restrepo@bavaria.co",
      createdAt: new Date("2026-03-04"),
    },
  ];
}
