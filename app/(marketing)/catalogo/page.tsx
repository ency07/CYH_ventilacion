"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  Settings, 
  FileText, 
  PhoneCall, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Activity,
  Info,
  Search
} from "lucide-react";
import Link from "next/link";

interface ProductSpec {
  id: string;
  name: string;
  category: string;
  rpm: string;
  caudal: string;
  presion: string;
  potencia: string;
  voltaje: string;
  proteccion: string;
  material: string;
  aplicacion: string;
  normas: string;
  eficiencia: "IE2" | "IE3" | "IE4" | "N/A";
  image: string;
  curvaPoints: string; // SVG path points
}

const CATEGORIES = [
  { id: "all", name: "Todos los Equipos" },
  { id: "axiales", name: "Ventiladores Axiales" },
  { id: "centrifugos", name: "Ventiladores Centrífugos" },
  { id: "extractores", name: "Extractores Industriales" },
  { id: "hvac", name: "HVAC Industrial" },
  { id: "colectores", name: "Colectores de Polvo" },
  { id: "ducteria", name: "Ductería" },
  { id: "motores", name: "Motores IE2 / IE3 / IE4" },
  { id: "tableros", name: "Tableros Eléctricos" },
  { id: "sistemas", name: "Sistemas de Extracción" }
];

const PRODUCTS: ProductSpec[] = [
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

export default function CatalogoPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.aplicacion.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.material.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary pt-24 pb-16 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-12">
        
        {/* Hero Header */}
        <div className="pt-8 pb-4">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-display text-5xl md:text-7xl tracking-wide  leading-tight">
              Catálogo de Equipos y <br />
              <span className="text-accent-cyan">Sistemas de Flujo</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed font-medium">
              Consulte y descargue fichas técnicas, curvas de operación y cumplimientos normativos para ventiladores industriales, motores y automatización de la infraestructura crítica de la Costa Caribe.
            </p>
          </div>
        </div>

        {/* Filter and Search HUD Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between border border-border-subtle bg-bg-secondary/20 p-4 rounded-sm">
          
          {/* Category Dropdown */}
          <div className="relative w-full lg:w-1/2 flex items-center gap-3">
            <div className="flex items-center gap-2 text-text-muted shrink-0">
              <SlidersHorizontal className="h-4.5 w-4.5 text-accent-cyan" />
              <span className="font-mono text-xs uppercase tracking-widest font-bold hidden sm:inline">Categoría:</span>
            </div>
            
            <div className="relative w-full">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full appearance-none bg-bg-tertiary border border-border-subtle rounded-sm py-2.5 pl-4 pr-10 text-sm font-semibold text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/50 focus:outline-none transition-all cursor-pointer hover:border-border-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                <ChevronRight className="h-4 w-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Search input */}
          <div className="relative w-full lg:w-1/2">
            <input
              type="text"
              placeholder="Buscar por equipo, aplicación, material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-sm py-2.5 px-4 pl-10 text-sm font-semibold text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/50 focus:outline-none transition-all placeholder:text-text-muted hover:border-border-medium"
            />
            <span className="absolute left-3 top-3 text-text-muted">
              <Search className="h-4.5 w-4.5" />
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  key={product.id}
                  className="glass-panel p-6 border border-border-subtle bg-bg-secondary/10 hover:border-accent-cyan/30 transition-all duration-300 rounded-sm relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  
                  
                  {/* Left Column: Image */}
                  <div className="lg:col-span-3 flex justify-center items-center h-full">
                    <div className="w-full aspect-square rounded-sm overflow-hidden border border-border-subtle bg-bg-primary p-2">
                      <div 
                        className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 hover:scale-105 rounded-sm"
                        style={{ backgroundImage: `url(${product.image})` }}
                      />
                    </div>
                  </div>

                  {/* Center Column: Product header, Curva & badging */}
                  <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-accent-cyan tracking-wider font-semibold border border-accent-cyan/20 bg-accent-cyan-soft px-2 py-0.5 rounded-sm">
                          ID: {product.id}
                        </span>
                        {product.eficiencia !== "N/A" && (
                          <span className="font-mono text-[9px] text-success tracking-wider font-semibold border border-success/20 bg-success/10 px-2 py-0.5 rounded-sm">
                            {product.eficiencia} COMPLIANT
                          </span>
                        )}
                      </div>
                      <h3 className="font-sans font-bold text-2xl md:text-3xl  ">
                        {product.name}
                      </h3>
                      <p className="text-base text-text-secondary leading-relaxed">
                        {product.aplicacion}
                      </p>
                    </div>

                    {/* Curva de Rendimiento Visual (SVG mock representation) */}
                    {product.curvaPoints !== "M 10 50 L 90 50" && product.curvaPoints !== "M 10 10 L 90 10" && product.curvaPoints !== "M 10 30 L 90 30" ? (
                      <div className="bg-bg-primary/40 border border-border-subtle/50 p-4 rounded-sm space-y-2">
                        <div className="flex items-center justify-between font-mono text-[8px] text-text-muted">
                          <span className="flex items-center gap-1 uppercase">
                            <TrendingUp className="h-3 w-3 text-accent-cyan" /> CURVA CARACTERÍSTICA P vs Q
                          </span>
                          <span>EFICIENCIA MÁXIMA</span>
                        </div>
                        <div className="h-16 w-full relative flex items-end">
                          <svg className="w-full h-full text-accent-cyan/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" className="text-border-subtle" />
                            <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" className="text-border-subtle" />
                            <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" className="text-border-subtle" />
                            
                            {/* Curve Line */}
                            <path d={product.curvaPoints} fill="none" stroke="url(#cyanGrad)" strokeWidth="3" className="text-accent-cyan" />
                            
                            {/* Efficiency dot */}
                            <circle cx="50" cy="40" r="3" className="fill-accent-cyan animate-pulse" />
                            
                            <defs>
                              <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00d4ff" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute bottom-1 left-2 font-mono text-[8px] text-text-muted">Presión (Pa)</span>
                          <span className="absolute bottom-1 right-2 font-mono text-[8px] text-text-muted">Caudal (CFM)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-bg-primary/20 border border-border-subtle/30 p-3 rounded-sm flex items-center gap-2">
                        <Info className="h-4.5 w-4.5 text-accent-cyan flex-shrink-0" />
                        <span className="font-mono text-[9px] text-text-muted uppercase">
                          ESPECIFICACIÓN ELÉCTRICA / ACCESORIO DE INFRAESTRUCTURA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Spec Tables and dynamic Actions */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                    
                    {/* Specification Table - Scrollable */}
                    <div className="overflow-x-auto border border-border-subtle bg-bg-primary/60 rounded-sm">
                      <table className="w-full text-left font-mono text-[10px] border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle bg-bg-secondary/40 text-text-secondary">
                            <th className="py-2 px-3 uppercase tracking-wider font-semibold">Parámetro</th>
                            <th className="py-2 px-3 uppercase tracking-wider font-semibold">Valor Registrado</th>
                            <th className="py-2 px-3 uppercase tracking-wider font-semibold">Cumplimiento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/50 text-text-primary">
                          <tr>
                            <td className="py-2 px-3 text-text-muted">Velocidad / Frecuencia</td>
                            <td className="py-2 px-3 font-semibold">{product.rpm}</td>
                            <td className="py-2 px-3 text-success">Verificado</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-text-muted">Caudal Nominal</td>
                            <td className="py-2 px-3 font-semibold text-accent-cyan">{product.caudal}</td>
                            <td className="py-2 px-3 text-text-secondary">DIN / ISO</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-text-muted">Presión Máxima</td>
                            <td className="py-2 px-3 font-semibold">{product.presion}</td>
                            <td className="py-2 px-3 text-text-secondary">Estática</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-text-muted">Potencia HP</td>
                            <td className="py-2 px-3 font-semibold">{product.potencia}</td>
                            <td className="py-2 px-3 text-text-secondary">{product.voltaje}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-text-muted">Protección Envolvente</td>
                            <td className="py-2 px-3 font-semibold">{product.proteccion}</td>
                            <td className="py-2 px-3 text-success">Clasificado</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-text-muted">Material Constructivo</td>
                            <td className="py-2 px-3 text-[9px] font-semibold leading-tight max-w-[200px] truncate" title={product.material}>
                              {product.material}
                            </td>
                            <td className="py-2 px-3 text-text-secondary">Esp. Marina</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-text-muted">Normativas Aplicadas</td>
                            <td className="py-2 px-3 text-[9px] font-semibold text-accent-cyan" title={product.normas}>
                              {product.normas}
                            </td>
                            <td className="py-2 px-3 text-success font-semibold">RETIE Ok</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* CTAs Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border-subtle/50 justify-end">
                      <button 
                        onClick={() => alert(`Iniciando descarga de ficha técnica PDF para el modelo ${product.id}.`)}
                        className="px-4 py-2 border border-border-medium hover:border-accent-cyan text-text-secondary hover:text-accent-cyan font-mono text-[10px] tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
                      >
                        <Download className="h-3.5 w-3.5" /> Descargar Ficha Técnica
                      </button>

                      <Link 
                        href={`/cotizador?servicio=${product.category === 'motores' || product.category === 'tableros' || product.category === 'ducteria' ? 'venta' : 'fabricacion'}`}
                        className="px-4 py-2 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-mono text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all shadow-[0_2px_8px_rgba(0,212,255,0.15)] flex items-center gap-1.5"
                      >
                        Solicitar Ingeniería <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                  </div>

                </motion.div>
              ))
            ) : (
              <div className="border border-dashed border-border-subtle bg-bg-secondary/10 p-12 text-center rounded-sm space-y-3 font-mono">
                <div className="text-text-muted text-3xl">⚠️</div>
                <h4 className="text-sm font-semibold text-text-primary">No se encontraron resultados</h4>
                <p className="text-base text-text-secondary max-w-sm mx-auto leading-relaxed">
                  No registramos especificaciones que coincidan con la búsqueda "{searchQuery}" o la categoría seleccionada. Intente con otros parámetros.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic bottom CTA block */}
        <div className="border border-accent-cyan/20 bg-bg-secondary/40 p-8 rounded-sm text-center relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-cyan/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="font-sans font-bold text-2xl  text-text-primary">
              ¿Requiere una especificación especial?
            </h3>
            <p className="text-base text-text-secondary leading-relaxed">
              Nuestros ingenieros de diseño en Barranquilla calculan diámetros, curvas aerodinámicas y aleaciones a medida para comisionamientos portuarios y pesados.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/contacto"
              className="px-5 py-3 border border-border-medium hover:border-accent-cyan text-text-primary hover:text-accent-cyan font-mono text-base tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
            >
              <PhoneCall className="h-4 w-4" /> Solicitar Visita Técnica
            </Link>
            
            <Link 
              href="/cotizador"
              className="px-6 py-3 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-semibold text-base tracking-wider uppercase rounded-sm transition-all flex items-center gap-2"
            >
              Iniciar Dimensionamiento Digital <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
