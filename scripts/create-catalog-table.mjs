// scripts/create-catalog-table.mjs
// Migration: Creates crm_products table and seeds initial 11 products from app/(marketing)/catalogo/page.tsx
// Run: node scripts/create-catalog-table.mjs

import postgres from "postgres";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
const env = readFileSync(envPath, "utf8");
for (const line of env.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
  process.env[key] = val;
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const INITIAL_PRODUCTS = [
  {
    id: "AX-800",
    name: "Ventilador Axial AX-800 Premium",
    image: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&q=80&w=500&h=500",
    category: "axiales",
    rpm: "1,450 RPM",
    caudal: "10,889 CFM",
    presion: "150 Pa",
    potencia: "3.0 HP",
    voltaje: "220/440 V",
    proteccion: "IP55 Clase F",
    material: "Aluminio Fundido al Silicio (Aspas ASTM B26)",
    aplicacion: "Inyección y extracción general en plantas avícolas y bodegas.",
    normas: "AMCA 210, RETIE, NTC 2050",
    eficiencia: "IE3",
    curvaPoints: "M 10 90 Q 40 40, 90 10"
  },
  {
    id: "AX-1200",
    name: "Ventilador Axial AX-1200 Heavy Duty",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=500&h=500",
    category: "axiales",
    rpm: "980 RPM",
    caudal: "22,366 CFM",
    presion: "250 Pa",
    potencia: "7.5 HP",
    voltaje: "440 V",
    proteccion: "IP56 Clase H",
    material: "Acero de Alta Resistencia ASTM A36 con Recubrimiento Epóxico",
    aplicacion: "Galerías mineras subterráneas y puertos industriales en el Caribe.",
    normas: "AMCA 300, RETIE, ISO 1940 (G2.5)",
    eficiencia: "IE4",
    curvaPoints: "M 10 85 Q 50 35, 90 15"
  },
  {
    id: "CN-400",
    name: "Ventilador Centrífugo CN-400 Curva Atrás",
    image: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=80&w=500&h=500",
    category: "centrifugos",
    rpm: "1,750 RPM",
    caudal: "7,063 CFM",
    presion: "1,200 Pa",
    potencia: "5.5 HP",
    voltaje: "220/440 V",
    proteccion: "IP55",
    material: "Acero Inoxidable AISI 304 (Resistente a la corrosión marina)",
    aplicacion: "Procesamiento de alimentos y transporte de gases corrosivos húmedos.",
    normas: "AMCA 210, RETIE, ISO 9001",
    eficiencia: "IE3",
    curvaPoints: "M 10 95 Q 30 60, 90 20"
  },
  {
    id: "CN-630",
    name: "Ventilador Centrífugo CN-630 Curva Adelante",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=500&h=500",
    category: "centrifugos",
    rpm: "1,150 RPM",
    caudal: "14,714 CFM",
    presion: "800 Pa",
    potencia: "10.0 HP",
    voltaje: "440 V",
    proteccion: "IP55 Clase F",
    material: "Acero al Carbono Laminado en Caliente EPC con protección marina C5",
    aplicacion: "Inyección forzada en calderas y plantas cementeras en el Atlántico.",
    normas: "AMCA 210, RETIE, NTC 2050",
    eficiencia: "IE4",
    curvaPoints: "M 10 90 Q 40 50, 90 25"
  },
  {
    id: "EXT-500",
    name: "Extractor Helicoidal Mural EXT-500",
    image: "https://images.unsplash.com/photo-1522069818816-e41c463cb9bb?auto=format&fit=crop&q=80&w=500&h=500",
    category: "extractores",
    rpm: "1,420 RPM",
    caudal: "5,003 CFM",
    presion: "80 Pa",
    potencia: "1.5 HP",
    voltaje: "220 V Monofásico / Trifásico",
    proteccion: "IP54",
    material: "Carcasa de Acero Galvanizado y Aspas de Polipropileno Reforzado",
    aplicacion: "Renovación rápida de aire en talleres metalmecánicos de Barranquilla.",
    normas: "RETIE, NTC 2050, MinTrabajo",
    eficiencia: "IE2",
    curvaPoints: "M 10 75 Q 40 45, 90 35"
  },
  {
    id: "EXT-900",
    name: "Extractor Industrial de Tejado EXT-900",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=500&h=500",
    category: "extractores",
    rpm: "920 RPM",
    caudal: "8,240 CFM",
    presion: "120 Pa",
    potencia: "2.0 HP",
    voltaje: "220/440 V",
    proteccion: "IP55",
    material: "Domo de Fibra de Vidrio reforzada y base de Acero Galvanizado",
    aplicacion: "Extracción vertical de gases calientes en fundiciones y naves logísticas.",
    normas: "AMCA 210, RETIE",
    eficiencia: "IE3",
    curvaPoints: "M 10 80 Q 45 40, 90 30"
  },
  {
    id: "HVAC-PKG-20",
    name: "Unidad Manejadora HVAC Industrial PKG-20",
    image: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=500&h=500",
    category: "hvac",
    rpm: "2,900 RPM (Variador PLC)",
    caudal: "8,829 CFM",
    presion: "350 Pa",
    potencia: "15.0 HP",
    voltaje: "440 V",
    proteccion: "IP56",
    material: "Estructura de Perfiles de Aluminio Extruido y Paneles Doble Pared Galvanizados",
    aplicacion: "Climatización y filtrado estricto para Data Centers de alta densidad.",
    normas: "ASHRAE 62.1, NTC 2050, ISO 16890",
    eficiencia: "IE4",
    curvaPoints: "M 10 95 Q 50 45, 90 5"
  },
  {
    id: "CP-8",
    name: "Colector de Polvo Tipo Baghouse CP-8",
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=500&h=500",
    category: "colectores",
    rpm: "3,450 RPM (Turbina de Limpieza)",
    caudal: "5,591 CFM",
    presion: "2,400 Pa",
    potencia: "10.0 HP",
    voltaje: "440 V",
    proteccion: "IP65 (Tablero neumático)",
    material: "Cuerpo de Acero Estructural A36 con mangas de poliéster punzonado",
    aplicacion: "Filtración de material particulado pesado en cementeras del Caribe.",
    normas: "Resolución 5018, MinTrabajo Colombia, OSHA",
    eficiencia: "IE3",
    curvaPoints: "M 10 98 Q 40 70, 90 10"
  },
  {
    id: "DCT-GALV",
    name: "Ductería Rectangular de Alta Presión DCT-GALV",
    image: "https://images.unsplash.com/photo-1504917595217-d4f50260eb32?auto=format&fit=crop&q=80&w=500&h=500",
    category: "ducteria",
    rpm: "N/A",
    caudal: "Hasta 29,429 CFM (Sugerido)",
    presion: "Soporta hasta 2,500 Pa",
    potencia: "N/A",
    voltaje: "N/A",
    proteccion: "N/A",
    material: "Lámina de Acero Galvanizado ASTM A653 (Calibres 18 a 26)",
    aplicacion: "Distribución de aire de alta velocidad en naves comerciales y puertos.",
    normas: "SMACNA, NTC 2050, ICONTEC",
    eficiencia: "N/A",
    curvaPoints: "M 10 50 L 90 50"
  },
  {
    id: "MTR-IE4-20",
    name: "Motor Trifásico Super Premium IE4-20",
    image: "https://images.unsplash.com/photo-1632731557002-99577c3eecf8?auto=format&fit=crop&q=80&w=500&h=500",
    category: "motores",
    rpm: "1,800 RPM",
    caudal: "N/A",
    presion: "N/A",
    potencia: "20.0 HP",
    voltaje: "220/440/460 V",
    proteccion: "IP55 (Totalmente Cerrado con Ventilación)",
    material: "Hierro Fundido de alta resistencia (Carcasa FC-200)",
    aplicacion: "Accionamiento industrial de alta eficiencia para extractores centrífugos.",
    normas: "IEC 60034-30-1, NTC 2050, RETIE",
    eficiencia: "IE4",
    curvaPoints: "M 10 10 L 90 10"
  },
  {
    id: "T-PLC-SCADA",
    name: "Tablero Eléctrico SCADA T-PLC-440",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=500&h=500",
    category: "tableros",
    rpm: "N/A",
    caudal: "N/A",
    presion: "N/A",
    potencia: "Controla hasta 100 HP",
    voltaje: "440 V / 24 VDC Control",
    proteccion: "IP66 NEMA 4X (Resistente al polvo y humedad marina)",
    material: "Gabinete en Acero Inoxidable con Variador de Frecuencia Integrado",
    aplicacion: "Automatización, modulación de flujo y comunicación remota SCADA.",
    normas: "RETIE, NTC 2050, IEC 61439",
    eficiencia: "N/A",
    curvaPoints: "M 10 30 L 90 30"
  },
  {
    id: "SYS-MON-V40",
    name: "Sistema de Extracción Portuaria SYS-MON",
    image: "https://images.unsplash.com/photo-1518625624795-3652f19ea3ab?auto=format&fit=crop&q=80&w=500&h=500",
    category: "sistemas",
    rpm: "1,450 RPM",
    caudal: "26,486 CFM",
    presion: "450 Pa",
    potencia: "25.0 HP",
    voltaje: "440 V",
    proteccion: "IP65 Clase H",
    material: "Carcasa de Acero con Galvanizado por Inmersión en Caliente (HDG)",
    aplicacion: "Control ambiental de bodegas de almacenamiento de granos en el puerto.",
    normas: "AMCA 210, RETIE, NTC 2050, RAS",
    eficiencia: "IE4",
    curvaPoints: "M 10 92 Q 45 35, 90 8"
  }
];

async function run() {
  try {
    console.log("🔧 Creating crm_products table...");
    
    await sql`
      CREATE TABLE IF NOT EXISTS crm_products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        rpm VARCHAR(100),
        caudal VARCHAR(100),
        presion VARCHAR(100),
        potencia VARCHAR(100),
        voltaje VARCHAR(100),
        proteccion VARCHAR(100),
        material TEXT,
        aplicacion TEXT,
        normas TEXT,
        eficiencia VARCHAR(50),
        image TEXT NOT NULL,
        curva_points TEXT,
        gallery JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `;

    console.log("🌱 Seeding initial products...");
    for (const p of INITIAL_PRODUCTS) {
      const exists = await sql`SELECT id FROM crm_products WHERE id = ${p.id}`;
      if (exists.length === 0) {
        await sql`
          INSERT INTO crm_products (
            id, name, category, rpm, caudal, presion, potencia, voltaje, 
            proteccion, material, aplicacion, normas, eficiencia, image, curva_points
          ) VALUES (
            ${p.id}, ${p.name}, ${p.category}, ${p.rpm}, ${p.caudal}, ${p.presion}, ${p.potencia}, ${p.voltaje},
            ${p.proteccion}, ${p.material}, ${p.aplicacion}, ${p.normas}, ${p.eficiencia}, ${p.image}, ${p.curvaPoints}
          )
        `;
        console.log(`  + Inserted product: ${p.id}`);
      } else {
        console.log(`  . Product ${p.id} already exists, skipping`);
      }
    }

    console.log("✅ Catalog Migration and Seeding complete.");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
