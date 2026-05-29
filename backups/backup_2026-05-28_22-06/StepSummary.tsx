"use client";

import React, { useEffect, useState } from "react";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { SERVICE_CARDS } from "@/lib/constants/wizard";
import { calculateDynamicPricing } from "@/lib/calculations/flow";
import { ArrowLeft, RotateCcw, ShieldCheck, Factory, FileText, Activity, AlertTriangle, FileDown, DollarSign, Eye } from "lucide-react";

// Micro-interaction: Animated price counter
const AnimatedPriceCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    
    const duration = 600; // ms
    const stepTime = 16; // ~60fps
    const steps = Math.ceil(duration / stepTime);
    const increment = (end - start) / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      start += increment;
      if (step >= steps) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(start));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{displayValue.toLocaleString()}</span>;
};

// jsPDF will be imported dynamically from the local npm package to avoid SSR and DOM errors.

export default function StepSummary() {
  const { service, flowInputs, flowResult, symptoms, symptomsResult, leadData, resetWizard, setStep } = useWizardStore();
  const [currency, setCurrency] = useState<"COP" | "USD">("COP");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const activeCard = SERVICE_CARDS.find((c) => c.id === service);

  // Calculate pricing based on all variables
  const prices = calculateDynamicPricing(service, flowResult, symptomsResult, leadData?.urgencia);

  const handleBack = () => {
    setStep("lead");
  };

  const handleReset = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("servicio");
      window.history.replaceState({}, "", url.pathname);
    }
    resetWizard();
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Corporate PDF Builder Function using vector drawing in jsPDF
  const generateB2BPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Dynamic offline-safe, typings-safe import of local package
      const { jsPDF } = await import("jspdf");
      if (!jsPDF) {
        alert("Error al cargar la librería local de generación de PDF.");
        return;
      }

      // Initialize Document (A4 portrait, 210mm x 297mm)
      const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4"
      });

      const docId = `CYH-OS-${Math.floor(100000 + Math.random() * 900000)}`;
      const dateStr = formatDate();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 1: COVER PAGE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      // Top Dark Banner block
      doc.setFillColor(11, 17, 32); // Deep midnight blue
      doc.rect(0, 0, 210, 48, "F");

      // Draw vector geometry of logo
      doc.setFillColor(0, 212, 255); // Cyan active
      doc.rect(20, 16, 12, 12, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CYH", 37, 23);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("INGENIERÍA DE VENTILACIÓN", 37, 27);

      // Title Block
      doc.setTextColor(11, 17, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("REPORTE TÉCNICO DE PREINGENIERÍA", 20, 80);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 110, 125);
      doc.text("DIAGNÓSTICO Y ANÁLISIS DE FLUJO DE AIRE • CYH OS V4.0", 20, 87);

      // Cyan accent rule line
      doc.setDrawColor(0, 212, 255);
      doc.setLineWidth(1.2);
      doc.line(20, 93, 190, 93);

      // Metadata card wrapper
      doc.setFillColor(245, 247, 250);
      doc.rect(20, 108, 170, 75, "F");

      // Vertical Accent line in card
      doc.setDrawColor(11, 17, 32);
      doc.setLineWidth(0.8);
      doc.line(20, 108, 20, 183);

      // Metadata labels
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(11, 17, 32);

      let metaY = 117;
      const meta = [
        ["CÓDIGO DE DOCUMENTO:", docId],
        ["FECHA DE EMISIÓN:", dateStr],
        ["CLIENTE SOLICITANTE:", leadData?.nombre || "N/A"],
        ["EMPRESA / CORPORATIVO:", leadData?.empresa || "N/A"],
        ["CARGO PROFESIONAL:", leadData?.cargo || "N/A"],
        ["CIUDAD / SEDE OPERATIVA:", leadData?.ciudad || "N/A"],
        ["URGENCIA OPERATIVA:", (leadData?.urgencia || "BAJA").toUpperCase()]
      ];

      meta.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 26, metaY);
        doc.setFont("helvetica", "normal");
        doc.text(value, 82, metaY);
        metaY += 8;
      });

      // Cover Page Footer Warning
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("ESTE DOCUMENTO ES UN ANÁLISIS PRELIMINAR DE PREINGENIERÍA PARA USO INTERNO B2B.", 20, 260);
      doc.text("PROPIEDAD INDUSTRIAL DE CYH INGENIERÍA. REPRODUCCIÓN TOTAL O PARCIAL PROHIBIDA.", 20, 265);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 2: RESUMEN EJECUTIVO & PARÁMETROS OPERATIVOS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      doc.addPage();

      // Top running header
      doc.setFillColor(11, 17, 32);
      doc.rect(0, 0, 210, 12, "F");
      doc.setTextColor(0, 212, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`CYH OS • FICHA TÉCNICA INDUSTRIAL  |  ID: ${docId}`, 15, 8);

      // Section 1: Executive Summary
      doc.setTextColor(11, 17, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("1. RESUMEN EJECUTIVO", 15, 28);
      doc.setDrawColor(11, 17, 32);
      doc.setLineWidth(0.3);
      doc.line(15, 30, 195, 30);

      // Description text wrapping
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      const summaryText = "El presente reporte técnico consolida el análisis de caudal de aire, renovación volumétrica, índice de complejidad de fallas mecánicas y severidad térmica realizado mediante los algoritmos termodinámicos de la suite CYH OS. Este documento sirve como punto de partida técnico preliminar, garantizando el pre-diseño de la solución bajo lineamientos y cumplimientos normativos AMCA y ASHRAE para entornos de alta exigencia.";
      const wrappedSummary = doc.splitTextToSize(summaryText, 180);
      doc.text(wrappedSummary, 15, 36);

      const targetScopeText = `Directiva operativa solicitada: ${activeCard?.title || "N/A"}. A través de la entrada de datos de la planta de ${leadData?.empresa || "N/A"} localizada en ${leadData?.ciudad || "N/A"}, se computó el volumen útil del edificio o la matriz de síntomas del rodete extractor, arrojando las métricas críticas del sistema.`;
      const wrappedScope = doc.splitTextToSize(targetScopeText, 180);
      doc.text(wrappedScope, 15, 52);

      // Section 2: Parameters Grid Table
      doc.setTextColor(11, 17, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("2. PARÁMETROS OPERATIVOS DE DISEÑO Y MEDICIONES", 15, 76);
      doc.line(15, 78, 195, 78);

      const rows = [
        ["Parámetro Analítico Evaluado", "Valor de Entrada / Computado"],
        ["Área de Operación Industrial", service === "fabricacion" || service === "venta" ? "Dimensionamiento de Flujo" : "Diagnóstico y Confiabilidad"],
        ["Tipo de Sector / Entorno de Planta", service === "fabricacion" || service === "venta" ? flowInputs.environment : "Mantenimiento / Reparación Técnico"],
        ["Dimensiones Totales de Nave", service === "fabricacion" || service === "venta" ? `${flowInputs.length}m largo x ${flowInputs.width}m ancho x ${flowInputs.height}m alto` : "N/A (Mediciones de vibración/humo en campo)"],
        ["Volumen Interno de Nave", flowResult ? `${flowResult.volume.toLocaleString()} m³` : "N/A"],
        ["Caudal de Extracción Recomendado", flowResult ? `${flowResult.estimatedFlow.toLocaleString()} m³/h` : "N/A"],
        ["Clasificación Aerodinámica de Caudal", flowResult ? flowResult.category : "N/A"],
        ["Índice de Complejidad de Falla", symptomsResult ? `${symptomsResult.complexityScore}%` : "N/A"],
        ["Nivel de Severidad de Desgaste", symptomsResult ? symptomsResult.severity.toUpperCase() : "N/A"],
        ["Urgencia Operativa en Sitio", leadData?.urgencia.toUpperCase() || "N/A"]
      ];

      let tableY = 86;
      rows.forEach((row, i) => {
        if (i === 0) {
          doc.setFillColor(11, 17, 32);
          doc.rect(15, tableY, 180, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFillColor(i % 2 === 0 ? "#f3f4f6" : "#ffffff");
          doc.rect(15, tableY, 180, 8, "F");
          doc.setTextColor(60, 60, 60);
          doc.setFont("helvetica", "normal");
        }
        doc.setFontSize(8);
        doc.text(row[0], 18, tableY + 5.5);
        doc.text(row[1], 110, tableY + 5.5);
        tableY += 8;
      });

      // Footer Page 2
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Página 2 de 3", 98, 285);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 3: RECOMMENDATIONS, PRICING, LEGAL & BRANDING FOOTER
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      doc.addPage();

      // Top running header
      doc.setFillColor(11, 17, 32);
      doc.rect(0, 0, 210, 12, "F");
      doc.setTextColor(0, 212, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`CYH OS • RECOMENDACIONES Y VALORACIÓN PRESUPUESTARIA  |  ID: ${docId}`, 15, 8);

      // Section 3: Engineering Recommendations
      doc.setTextColor(11, 17, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("3. ESPECIFICACIÓN Y DIRECTIVAS DE INGENIERÍA", 15, 26);
      doc.line(15, 28, 195, 28);

      const obs = flowResult?.technicalObservations || symptomsResult?.technicalObservations || "N/A";
      const mats = flowResult?.materialSuggestions || symptomsResult?.materialSuggestions || "N/A";
      const ducts = flowResult?.ductingObservations || symptomsResult?.ductingObservations || "N/A";
      const inspects = flowResult?.inspectionRecommendations || symptomsResult?.inspectionRecommendations || "N/A";

      let textY = 34;
      const docSections = [
        ["A. Observaciones Clínicas e Ingeniería de Detalle", obs],
        ["B. Sugerencias de Materiales Estructurales y Refacciones OEM", mats],
        ["C. Directivas de Acoplamiento, Ductería y Pérdida de Presión", ducts],
        ["D. Protocolo de Inspección, Calibración y Pruebas de Campo", inspects]
      ];

      docSections.forEach(([sectionTitle, text]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(11, 17, 32);
        doc.text(sectionTitle, 15, textY);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(70, 70, 70);
        const wrapped = doc.splitTextToSize(text, 180);
        doc.text(wrapped, 15, textY + 4);
        textY += 19;
      });

      // Section 4: Budget Range (Highlight Card)
      doc.setTextColor(11, 17, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("4. VALORACIÓN PRESUPUESTARIA PRELIMINAR", 15, 120);
      doc.line(15, 122, 195, 122);

      doc.setFillColor(242, 252, 255);
      doc.rect(15, 128, 180, 24, "F");
      doc.setDrawColor(0, 212, 255);
      doc.setLineWidth(1);
      doc.line(15, 128, 15, 152);

      const minCopStr = `$${prices.minCOP.toLocaleString("es-CO")} COP`;
      const maxCopStr = `$${prices.maxCOP.toLocaleString("es-CO")} COP`;
      const minUsdStr = `USD $${prices.minUSD.toLocaleString("en-US")}`;
      const maxUsdStr = `USD $${prices.maxUSD.toLocaleString("en-US")}`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(11, 17, 32);
      doc.text("RANGO ESTIMADO DE INVERSIÓN TOTAL REQUERIDA (EX-WORKS):", 20, 134);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 130, 170);
      doc.text(`${minCopStr} – ${maxCopStr}`, 20, 143);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 120);
      doc.text(`(Equivalente estimado en moneda internacional: ${minUsdStr} – ${maxUsdStr})`, 20, 148);

      // Section 5: Legal Disclaimer
      doc.setTextColor(11, 17, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("5. DECLARACIÓN DE LÍMITE DE RESPONSABILIDAD LEGAL (DISCLAIMER)", 15, 162);
      doc.line(15, 164, 195, 164);

      const disclaimerText = "Este reporte técnico preliminar es una modelación teórica basada en algoritmos de pre-cálculo y los datos de entrada provistos por el usuario. No representa un compromiso contractual, diseño de detalle de ingeniería final o un presupuesto comercial vinculante. Toda especificación técnica definitiva y cotización formal de compra están sujetas obligatoriamente a una visita técnica en sitio por ingenieros de campo certificados de CYH y a la formalización comercial correspondiente.";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      const wrappedDisclaimer = doc.splitTextToSize(disclaimerText, 180);
      doc.text(wrappedDisclaimer, 15, 168);

      // B2B Midnight Blue Footer
      doc.setFillColor(11, 17, 32);
      doc.rect(0, 236, 210, 61, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CYH INGENIERÍA DE VENTILACIÓN INDUSTRIAL S.A.", 15, 248);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 190, 200);
      doc.text("Soporte B2B y Comisionamiento de Caudales LATAM", 15, 254);
      doc.text("Contacto Proyectos: proyectos@cyhventilacion.com | www.cyhventilacion.com", 15, 259);
      doc.text("Presencia Corporativa: Bogotá (Colombia) • Lima (Perú) • Santiago (Chile)", 15, 264);

      doc.setTextColor(0, 212, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("CYH OS • PLATAFORMA CORPORATIVA", 138, 254);

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Página 3 de 3", 175, 282);

      // Save document natively
      doc.save(`Ficha_Tecnica_CYH_${leadData?.empresa.replace(/\s+/g, "_") || "OS"}.pdf`);
      
    } catch (e) {
      console.error(e);
      alert("Error al estructurar el reporte de preingeniería PDF. Intente de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getUrgencyDetails = (urgency: string | undefined) => {
    switch (urgency) {
      case "alta":
        return { label: "EMERGENCIA OPERATIVA (ALTA - 24H)", color: "text-danger border-danger/30 bg-danger/10" };
      case "media":
        return { label: "MANTENIMIENTO PROGRAMADO (MEDIA)", color: "text-warning border-warning/30 bg-warning/10" };
      default:
        return { label: "PLANIFICACIÓN DE PROYECTO (BAJA)", color: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan-soft" };
    }
  };

  const urgencyInfo = getUrgencyDetails(leadData?.urgencia);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Screen Header Banner */}
      <div className="text-center py-6 space-y-3">
        <div className="p-3 bg-success/10 w-fit mx-auto border border-success/30 rounded-full">
          <ShieldCheck className="h-8 w-8 text-success" />
        </div>
        <div className="space-y-1">
          <span className="font-mono text-xs text-success tracking-widest uppercase font-semibold">
            FICHA TÉCNICA Y DIAGNÓSTICO VALIDADO
          </span>
          <h2 className="font-display text-4xl tracking-wide text-text-primary uppercase">
            Especificación de Preingeniería
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
            El diagnóstico preliminar ha sido estructurado con éxito. A continuación se presentan las recomendaciones de ingeniería y la valoración presupuestaria.
          </p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PRECIO ESTIMADO REAL CARD (Bebas Neue & Glow Cyan)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-3xl mx-auto">
        <div className="relative glass-panel p-8 rounded-sm border border-accent-cyan/50 bg-bg-secondary/60 shadow-[0_0_20px_rgba(0,212,255,0.12)] text-center space-y-4 overflow-hidden">
          
          {/* Subtle linear decorative bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accent-cyan/15 via-accent-cyan to-accent-cyan/15" />
          
          <div className="space-y-1">
            <span className="font-mono text-xs text-accent-cyan tracking-[0.2em] uppercase font-semibold">
              RANGO DE INVERSIÓN ESTIMADO SUGERIDO (EX-WORKS)
            </span>
            <p className="text-[10px] text-text-secondary">
              Monto aproximado calculado en base a dimensiones, caudal de extracción, complejidad y materiales indicados.
            </p>
          </div>

          {/* Dynamic Pricing Counter */}
          <div className="py-2 space-y-2">
            
            {currency === "COP" ? (
              <div className="font-display text-4xl md:text-6xl text-text-primary tracking-wide leading-none uppercase">
                $<AnimatedPriceCounter value={prices.minCOP} /> – $<AnimatedPriceCounter value={prices.maxCOP} /> <span className="text-xl md:text-3xl text-accent-cyan">COP</span>
              </div>
            ) : (
              <div className="font-display text-4xl md:text-6xl text-text-primary tracking-wide leading-none uppercase">
                USD $<AnimatedPriceCounter value={prices.minUSD} /> – USD $<AnimatedPriceCounter value={prices.maxUSD} /> <span className="text-xl md:text-3xl text-accent-cyan">USD</span>
              </div>
            )}

            {/* Currency Selector Slider Toggle */}
            <div className="flex items-center justify-center gap-3 pt-3">
              <span className={`font-mono text-xs font-semibold ${currency === "COP" ? "text-accent-cyan" : "text-text-muted"}`}>COP</span>
              <button 
                onClick={() => setCurrency(currency === "COP" ? "USD" : "COP")}
                className="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-bg-tertiary transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                role="switch"
                aria-checked={currency === "USD"}
              >
                <span 
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-accent-cyan shadow ring-0 transition duration-200 ease-in-out ${
                    currency === "USD" ? "translate-x-5" : "translate-x-0"
                  }`} 
                />
              </button>
              <span className={`font-mono text-xs font-semibold ${currency === "USD" ? "text-accent-cyan" : "text-text-muted"}`}>USD</span>
            </div>

          </div>

          <div className="font-mono text-[9px] text-text-muted tracking-widest uppercase">
            * VALOR SUJETO A LEVANTAMIENTO FÍSICO DE CAMPO POR EL DEPARTAMENTO TÉCNICO
          </div>

        </div>
      </div>

      {/* 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Left Column: Client & Request Details */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="glass-panel p-6 rounded-sm border border-border-subtle bg-bg-secondary/40 space-y-5">
            <h3 className="font-display text-base tracking-wider text-text-primary uppercase border-b border-border-subtle pb-2 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-accent-cyan" />
              Datos del Solicitante
            </h3>
            
            <div className="space-y-3.5 font-mono text-[10px]">
              <div>
                <span className="text-text-muted block uppercase">Razón Social:</span>
                <span className="text-text-primary font-bold text-xs">{leadData?.empresa || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-text-muted block uppercase">Contacto:</span>
                  <span className="text-text-primary font-bold">{leadData?.nombre || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-muted block uppercase">Cargo:</span>
                  <span className="text-text-primary font-bold">{leadData?.cargo || "N/A"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-text-muted block uppercase">Teléfono:</span>
                  <span className="text-text-primary font-bold">{leadData?.telefono || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-muted block uppercase">Ciudad:</span>
                  <span className="text-text-primary font-bold">{leadData?.ciudad || "N/A"}</span>
                </div>
              </div>
              <div>
                <span className="text-text-muted block uppercase">Correo Corporativo:</span>
                <span className="text-accent-cyan font-bold break-all">{leadData?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-text-muted block uppercase">Urgencia Operativa:</span>
                <span className={`inline-block border px-2 py-0.5 rounded-sm font-semibold mt-1 ${urgencyInfo.color}`}>
                  {urgencyInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-sm border border-border-subtle bg-bg-secondary/40 space-y-4">
            <h3 className="font-display text-base tracking-wider text-text-primary uppercase border-b border-border-subtle pb-2 flex items-center gap-2">
              <Factory className="h-4.5 w-4.5 text-accent-cyan" />
              Especificación Directiva
            </h3>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between border-b border-border-subtle/50 pb-1.5">
                <span className="text-text-secondary">SERVICIO SELECCIONADO:</span>
                <span className="text-accent-cyan font-bold uppercase text-right">{activeCard?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">CUMPLIMIENTO DE NORMA:</span>
                <span className="text-text-primary font-bold text-right">{activeCard?.badge}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Calculations, Observations and Directives */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Engineering Metrics Panel */}
          <div className="glass-panel p-6 rounded-sm border border-border-subtle bg-bg-secondary/40 space-y-6">
            <h3 className="font-display text-lg tracking-wider text-text-primary uppercase border-b border-border-subtle pb-2 flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-cyan" />
              Especificaciones de Preingeniería
            </h3>

            {/* Calculations Path: Fabricación / Venta */}
            {(service === "fabricacion" || service === "venta") && flowResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-bg-primary/60 p-4 border border-border-subtle/80 rounded-sm space-y-1">
                    <span className="font-mono text-[9px] text-text-muted uppercase block">Caudal Mínimo Requerido</span>
                    <span className="font-mono text-2xl font-bold text-accent-cyan">
                      {flowResult.estimatedFlow.toLocaleString()} m³/h
                    </span>
                  </div>
                  <div className="bg-bg-primary/60 p-4 border border-border-subtle/80 rounded-sm space-y-1">
                    <span className="font-mono text-[9px] text-text-muted uppercase block">Volumen de Recinto Computado</span>
                    <span className="font-mono text-2xl font-bold text-text-primary">
                      {flowResult.volume.toLocaleString()} m³
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] border-t border-border-subtle/50 pt-4">
                  <div>
                    <span className="text-text-muted block uppercase">Clasificación Aerodinámica:</span>
                    <span className="text-accent-cyan font-bold block mt-0.5">{flowResult.category}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block uppercase">Nivel de Proyecto Sugerido:</span>
                    <span className="text-text-primary font-bold block mt-0.5">{flowResult.investmentRange}</span>
                  </div>
                </div>

                {/* Technical Obs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border-subtle/50 pt-6 font-sans text-xs leading-relaxed">
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Observaciones de Ingeniería</span>
                    <p className="text-text-secondary">{flowResult.technicalObservations}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Sugerencias de Aleación y Acabado</span>
                    <p className="text-text-secondary">{flowResult.materialSuggestions}</p>
                  </div>
                  <div className="space-y-1.5 border-t border-border-subtle/30 pt-4 md:border-t-0 md:pt-0">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Directiva de Acoplamiento y Ductos</span>
                    <p className="text-text-secondary">{flowResult.ductingObservations}</p>
                  </div>
                  <div className="space-y-1.5 border-t border-border-subtle/30 pt-4 md:border-t-0 md:pt-0">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Protocolo de Inspección Sugerido</span>
                    <p className="text-text-secondary">{flowResult.inspectionRecommendations}</p>
                  </div>
                </div>

              </div>
            ) : null}

            {/* Diagnostics Path: Mantenimiento / Reparación */}
            {(service === "mantenimiento" || service === "reparacion") && symptomsResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-bg-primary/60 p-4 border border-border-subtle/80 rounded-sm space-y-1">
                    <span className="font-mono text-[9px] text-text-muted uppercase block">Índice de Complejidad Dinámica</span>
                    <span className="font-mono text-2xl font-bold text-accent-cyan">
                      {symptomsResult.complexityScore}%
                    </span>
                  </div>
                  <div className="bg-bg-primary/60 p-4 border border-border-subtle/80 rounded-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-text-muted uppercase block">Severidad del Estado</span>
                      <span className={`font-mono text-sm font-bold uppercase tracking-wider block ${
                        symptomsResult.severity === "high" 
                          ? "text-danger" 
                          : symptomsResult.severity === "medium" 
                            ? "text-warning" 
                            : "text-success"
                      }`}>
                        {symptomsResult.severity}
                      </span>
                    </div>
                    <AlertTriangle className={`h-8 w-8 ${
                      symptomsResult.severity === "high" 
                        ? "text-danger" 
                        : symptomsResult.severity === "medium" 
                          ? "text-warning" 
                          : "text-success"
                    }`} />
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-[10px] border-t border-border-subtle/50 pt-4">
                  <span className="text-text-muted uppercase block">Estado Alerta General:</span>
                  <span className="text-text-primary font-semibold block mt-0.5">{symptomsResult.alertMessage}</span>
                </div>

                {/* Technical Obs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border-subtle/50 pt-6 font-sans text-xs leading-relaxed">
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Observaciones Clínicas / Diagnóstico</span>
                    <p className="text-text-secondary">{symptomsResult.technicalObservations}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Especificación de Refacciones OEM</span>
                    <p className="text-text-secondary">{symptomsResult.materialSuggestions}</p>
                  </div>
                  <div className="space-y-1.5 border-t border-border-subtle/30 pt-4 md:border-t-0 md:pt-0">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Efectos Colaterales en Ductos</span>
                    <p className="text-text-secondary">{symptomsResult.ductingObservations}</p>
                  </div>
                  <div className="space-y-1.5 border-t border-border-subtle/30 pt-4 md:border-t-0 md:pt-0">
                    <span className="font-mono text-[9px] text-text-muted uppercase block font-bold">Protocolo de Inspección en Sitio</span>
                    <p className="text-text-secondary">{symptomsResult.inspectionRecommendations}</p>
                  </div>
                </div>

              </div>
            ) : null}

          </div>

        </div>

      </div>

      {/* Action CTA Card (PDF Generation) */}
      <div className="glass-panel p-6 rounded-sm border border-border-subtle bg-bg-secondary/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-accent-cyan-soft border border-accent-cyan/20 rounded-sm">
            <ShieldCheck className="h-6 w-6 text-accent-cyan" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="font-display text-lg tracking-wider text-text-primary uppercase">
              Descargar Ficha de Preingeniería
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
              Genere el documento corporativo formal en PDF con la estructura oficial de CYH, incluyendo resúmenes, parámetros del caudal, recomendaciones y disclaimer de visita técnica.
            </p>
          </div>
        </div>
        
        <button
          onClick={generateB2BPdf}
          disabled={isGeneratingPdf}
          className={`px-8 py-3 font-semibold text-xs tracking-wider uppercase rounded-sm transition-all flex items-center gap-2.5 whitespace-nowrap shadow-[0_4px_12px_rgba(0,212,255,0.15)] ${
            isGeneratingPdf
              ? "bg-bg-tertiary text-text-muted border border-border-subtle cursor-wait"
              : "bg-accent-cyan hover:bg-accent-cyan/95 text-background"
          }`}
        >
          {isGeneratingPdf ? (
            <>
              <Eye className="h-4.5 w-4.5 animate-spin" />
              GENERANDO DOCUMENTO...
            </>
          ) : (
            <>
              <FileDown className="h-4.5 w-4.5" />
              DESCARGAR PDF CORPORATIVO
            </>
          )}
        </button>
      </div>

      {/* Navigation action row */}
      <div className="pt-6 border-t border-border-subtle flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-border-medium hover:border-text-primary text-text-secondary hover:text-text-primary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          REGRESAR A VALIDACIÓN
        </button>
        
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-border-medium hover:border-accent-cyan hover:text-accent-cyan text-text-secondary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          NUEVA COTIZACIÓN
        </button>
      </div>

    </div>
  );
}
