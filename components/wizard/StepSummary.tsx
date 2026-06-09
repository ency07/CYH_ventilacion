"use client";

import React, { useEffect, useState } from "react";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { SERVICE_CARDS } from "@/lib/constants/wizard";
import { calculateDynamicPricing } from "@/lib/calculations/flow";
import { 
  ArrowLeft, 
  RotateCcw, 
  ShieldCheck, 
  Factory, 
  FileText, 
  Activity, 
  FileDown, 
  MessageSquare, 
  Mail, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { uploadPdfAction } from "@/lib/server-actions/diagnostics";
import { sendDiagnosticEmailAction } from "@/lib/server-actions/emails";

// Bulletproof COP currency formatter helper
const formatCOP = (val: number) => {
  const formatted = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
  return `COP $${formatted}`;
};


export default function StepSummary() {
  const { service, flowInputs, flowResult, symptomsResult, leadData, leadId, resetWizard, setStep } = useWizardStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  // Real-time progressive checklist states
  const [isPdfUploaded, setIsPdfUploaded] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState("Procesando copia...");

  useEffect(() => {
    if (leadId) {
      // Deferir la ejecución pesada de jsPDF para permitir que React pinte la pantalla primero (evita congelamiento de UI al entrar)
      const timer = setTimeout(() => {
        generateB2BPdf(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [leadId]);

  const activeCard = SERVICE_CARDS.find((c) => c.id === service);

  // Calculate pricing based on all variables
  const prices = calculateDynamicPricing(service, flowResult, symptomsResult, leadData?.urgencia);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Hola, solicito asistencia técnica para el diagnóstico de preingeniería CYH OS para mi planta en ${leadData?.ciudad || "Colombia"}. Razón social: ${leadData?.empresa || "N/A"}.`
    );
    window.open(`https://api.whatsapp.com/send?phone=573001234567&text=${message}`, "_blank");
  };

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
  const generateB2BPdf = async (isSilentUpload = false) => {
    if (!isSilentUpload) setIsGeneratingPdf(true);
    try {
      // Dynamic offline-safe, typings-safe import of local package
      const { jsPDF } = await import("jspdf");
      if (!jsPDF) {
        if (!isSilentUpload) alert("Error al cargar la librería local de generación de PDF.");
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
      
      // Top Corporate Banner block (Siemens/Schneider style - clean white/grey)
      doc.setFillColor(245, 247, 250); // Light industrial grey
      doc.rect(0, 0, 210, 35, "F");

      // Draw vector geometry of logo
      doc.setFillColor(15, 23, 42); // Matte dark steel
      doc.rect(20, 12, 8, 8, "F");
      
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CYH", 32, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("INGENIERÍA DE VENTILACIÓN", 32, 22);

      // Title Block
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Preingeniería Estimada de", 20, 65);
      doc.text("Ventilación Industrial", 20, 75);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Diagnóstico preliminar para análisis consultivo e ingeniería de concepto.", 20, 85);

      // Matte dark accent rule line
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(1.5);
      doc.line(20, 92, 190, 92);

      // Amber Disclaimer Box
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.rect(20, 98, 170, 18, "FD");
      doc.setTextColor(180, 83, 9); // Darker amber for better contrast
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      
      const disclaimerLead = "Este documento corresponde a una preingeniería automatizada de carácter referencial. Los valores, configuraciones y capacidades descritas deben ser validadas mediante visita técnica, levantamiento en sitio e ingeniería de detalle por parte del equipo especializado de CYH Ingeniería.";
      const wrappedDisclaimerLead = doc.splitTextToSize(disclaimerLead, 160);
      doc.text(wrappedDisclaimerLead, 25, 104);

      // Metadata card wrapper
      doc.setFillColor(245, 247, 250);
      doc.rect(20, 108, 170, 75, "F");

      // Vertical Accent line in card
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.8);
      doc.line(20, 108, 20, 183);

      // Metadata labels
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(47, 55, 70);

      let metaY = 132;
      const meta = [
        ["CÓDIGO DOCUMENTAL:", "PRE-ING-2026"],
        ["REVISIÓN:", "Rev. A"],
        ["ESTADO:", "Documento Preliminar"],
        ["FECHA DE EMISIÓN:", dateStr],
        ["CLIENTE SOLICITANTE:", leadData?.nombre || "N/A"],
        ["EMPRESA / CORPORATIVO:", leadData?.empresa || "N/A"],
        ["CIUDAD / SEDE:", leadData?.ciudad || "N/A"]
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
      doc.setTextColor(148, 163, 184);
      doc.text("ESTE DOCUMENTO ES UN ANÁLISIS PRELIMINAR DE PREINGENIERÍA PARA USO INTERNO B2B.", 20, 260);
      doc.text("PROPIEDAD INDUSTRIAL DE CYH INGENIERÍA. REPRODUCCIÓN TOTAL O PARCIAL PROHIBIDA.", 20, 265);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 2: RESUMEN EJECUTIVO & PARÁMETROS OPERATIVOS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      doc.addPage();

      // Top running header
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 0, 210, 12, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(`CYH PREINGENIERÍA  |  CÓDIGO: PRE-ING-2026 REV A`, 15, 8);

      // Section 1: Executive Summary
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("1. RESUMEN EJECUTIVO", 15, 28);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.line(15, 30, 195, 30);

      // Description text wrapping
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const summaryText = "El presente diagnóstico consolida la estimación referencial de caudal de aire, renovación volumétrica, e índice de complejidad mediante nuestros algoritmos de evaluación. Este documento sirve como punto de partida consultivo, planteando un escenario estimado bajo lineamientos técnicos AMCA y ASHRAE para entornos industriales.";
      const wrappedSummary = doc.splitTextToSize(summaryText, 180);
      doc.text(wrappedSummary, 15, 36);

      const targetScopeText = `Directiva operativa solicitada: ${activeCard?.title || "N/A"}. A través de la entrada de datos de la planta de ${leadData?.empresa || "N/A"} localizada en ${leadData?.ciudad || "N/A"}, se computó el volumen útil del edificio o la matriz de síntomas del rodete extractor, arrojando las métricas críticas del sistema.`;
      const wrappedScope = doc.splitTextToSize(targetScopeText, 180);
      doc.text(wrappedScope, 15, 52);

      // Section 2: Parameters Grid Table
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("2. PARÁMETROS OPERATIVOS DE DISEÑO Y MEDICIONES", 15, 76);
      doc.line(15, 78, 195, 78);

      const rows = [
        ["Parámetro Analítico Evaluado", "Valor de Entrada / Computado"],
        ["Área de Operación Industrial", service === "fabricacion" || service === "venta" ? "Dimensionamiento de Flujo" : "Diagnóstico y Confiabilidad"],
        ["Tipo de Sector / Entorno de Planta", service === "fabricacion" || service === "venta" ? flowInputs.environment : "Mantenimiento / Reparación Técnico"],
        ["Dimensiones Totales de Nave", service === "fabricacion" || service === "venta" ? `${flowInputs.length}m largo x ${flowInputs.width}m ancho x ${flowInputs.height}m alto` : "N/A"],
        ["Volumen Interno de Nave", flowResult ? `${flowResult.volume.toLocaleString()} m³` : "N/A"],
        ["Capacidad Estimada", flowResult ? `${flowResult.estimatedFlow.toLocaleString()} CFM` : "N/A"],
        ["Clasificación Aerodinámica de Caudal", flowResult ? flowResult.category : "N/A"],
        ["Índice de Complejidad de Falla", symptomsResult ? `${symptomsResult.complexityScore}%` : "N/A"],
        ["Nivel de Severidad de Desgaste", symptomsResult ? symptomsResult.severity.toUpperCase() : "N/A"],
        ["Inversión Estimada Mínima", formatCOP(prices.minCOP)],
        ["Inversión Estimada Máxima", formatCOP(prices.maxCOP)],
        ["Urgencia Operativa en Planta", leadData?.urgencia.toUpperCase() || "N/A"]
      ];

      let tableY = 86;
      rows.forEach((row, i) => {
        if (i === 0) {
          doc.setFillColor(15, 23, 42);
          doc.rect(15, tableY, 180, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFillColor(i % 2 === 0 ? "#f8fafc" : "#ffffff");
          doc.rect(15, tableY, 180, 8, "F");
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
        }
        doc.setFontSize(8);
        doc.text(row[0], 18, tableY + 5.5);
        doc.text(row[1], 110, tableY + 5.5);
        tableY += 8;
      });

      // Footer Page 2
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Página 2 de 3", 98, 285);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 3: RECOMMENDATIONS, PRICING, LEGAL & BRANDING FOOTER
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      doc.addPage();

      // Top running header
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 0, 210, 12, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(`CYH PREINGENIERÍA  |  CÓDIGO: PRE-ING-2026 REV A`, 15, 8);

      // Section 3: Engineering Recommendations
      doc.setTextColor(15, 23, 42);
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
        doc.setTextColor(15, 23, 42);
        doc.text(sectionTitle, 15, textY);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const wrapped = doc.splitTextToSize(text, 180);
        doc.text(wrapped, 15, textY + 4);
        textY += 19;
      });

      // Section 4: Budget Range (Highlight Card)
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("4. VALORACIÓN PRESUPUESTARIA PRELIMINAR", 15, 120);
      doc.line(15, 122, 195, 122);

      doc.setFillColor(248, 250, 252);
      doc.rect(15, 128, 180, 24, "F");
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(1);
      doc.line(15, 128, 15, 152);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("RANGO REFERENCIAL DE INVERSIÓN ESTIMADA (EX-WORKS):", 20, 134);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`${formatCOP(prices.minCOP)} – ${formatCOP(prices.maxCOP)}`, 20, 143);

      // Section 5: Legal Disclaimer
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("5. DECLARACIÓN DE LÍMITE DE RESPONSABILIDAD LEGAL (DISCLAIMER)", 15, 162);
      doc.line(15, 164, 195, 164);

      const disclaimerText = "Este reporte técnico preliminar es una modelación teórica basada en algoritmos de pre-cálculo y los datos de entrada provistos por el usuario. No representa un compromiso contractual, diseño de detalle de ingeniería final o un presupuesto comercial vinculante. Toda especificación técnica definitiva y cotización formal de compra están sujetas obligatoriamente a una visita técnica en sitio por ingenieros de campo certificados de CYH y a la formalización comercial correspondiente.";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      const wrappedDisclaimer = doc.splitTextToSize(disclaimerText, 180);
      doc.text(wrappedDisclaimer, 15, 168);

      // Engineering Closure Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.rect(15, 185, 180, 28, "FD");
      
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("¿CÓMO AVANZAR HACIA UN DISEÑO DEFINITIVO?", 20, 192);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("• Visita técnica en sitio y levantamiento de variables físicas.", 20, 198);
      doc.text("• Desarrollo de ingeniería de detalle y simulación aerodinámica.", 20, 204);
      doc.text("• Selección de equipos optimizada y presupuesto comercial en firme.", 20, 210);
      
      doc.setFillColor(15, 23, 42); // Matte Steel Gray CTA
      doc.rect(130, 195, 60, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("SOLICITAR EVALUACIÓN COMERCIAL", 132, 200);

      // B2B Midnight Blue Footer
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 236, 210, 61, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CYH INGENIERÍA DE VENTILACIÓN INDUSTRIAL S.A.", 15, 248);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text("Soporte B2B y Comisionamiento de Caudales LATAM", 15, 254);
      doc.text("Contacto Proyectos: proyectos@cyhventilacion.com | www.cyhventilacion.com", 15, 259);
      doc.text("Presencia Sede Caribe: Barranquilla (Atlántico, Colombia) | Cumplimiento RETIE / NTC 2050", 15, 264);

      doc.setTextColor(248, 250, 252);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("CYH OS • PLATAFORMA CORPORATIVA", 138, 254);

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Página 3 de 3", 175, 282);

      // PDF Output
      const base64Str = doc.output("datauristring").split(",")[1];

      if (isSilentUpload) {
        // Step 1: Upload to Supabase Storage & save URL
        const uploadResult = await uploadPdfAction(leadId || "", base64Str);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Fallo al subir PDF.");
        }
        setIsPdfUploaded(true);

        // Step 2: Trigger Resend email with the base64 PDF attached directly!
        setEmailStatusMsg("Enviando reporte adjunto...");
        const emailResult = await sendDiagnosticEmailAction(leadId || "", base64Str);
        if (!emailResult.success) {
          throw new Error(emailResult.error || "Fallo al enviar correo.");
        }
        setIsEmailSent(true);
        setEmailStatusMsg("Enviado al correo");
      } else {
        doc.save(`Preingenieria-Estimada-CYH.pdf`);
      }
      
    } catch (e: any) {
      console.error(e);
      if (!isSilentUpload) {
        alert("No fue posible enviar la copia al correo registrado. Puedes descargar la preingeniería directamente desde esta pantalla.");
      } else {
        setEmailStatusMsg("Error al enviar correo");
      }
    } finally {
      if (!isSilentUpload) setIsGeneratingPdf(false);
    }
  };

  const handleManualEmailResend = async () => {
    if (!leadId) return;
    setIsResendingEmail(true);
    try {
      setIsEmailSent(false);
      setEmailStatusMsg("Re-enviando reporte...");
      await generateB2BPdf(true);
      alert("¡El Reporte Técnico PDF ha sido enviado exitosamente de nuevo a su correo corporativo!");
    } catch (err) {
      console.error(err);
      alert("No fue posible enviar la copia al correo registrado. Puedes descargar la preingeniería directamente desde esta pantalla.");
    } finally {
      setIsResendingEmail(false);
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
    <div className="space-y-8 animate-fadeIn text-left">
      
      {/* BLOQUE 1: DIAGNÓSTICO PRELIMINAR COMPLETADO */}
      <div className="text-center py-8 space-y-4 border-b border-border-subtle pb-8">
        <h2 className="font-display text-2xl md:text-3xl tracking-wide text-text-primary uppercase">
          DIAGNÓSTICO PRELIMINAR COMPLETADO
        </h2>
        <p className="text-sm font-sans text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Los algoritmos de evaluación técnica de CYH han procesado la información suministrada y generado una configuración preliminar de referencia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOQUE 2: Hallazgos Principales */}
        <div className="space-y-4">
          <h3 className="font-display text-base tracking-wider text-text-primary uppercase border-b border-border-medium pb-2">
            Hallazgos Principales
          </h3>
          <div className="border border-border-subtle bg-bg-secondary/40 p-5 rounded-sm space-y-4">
            <div className="flex justify-between border-b border-border-subtle/50 pb-2">
              <span className="text-xs text-text-secondary uppercase">Tipo de ambiente</span>
              <span className="text-xs text-text-primary font-bold uppercase">{flowInputs.environment || "Industrial"}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle/50 pb-2">
              <span className="text-xs text-text-secondary uppercase">Riesgo identificado</span>
              <span className="text-xs text-text-primary font-bold uppercase">{symptomsResult?.severity || "Evaluación Preliminar"}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle/50 pb-2">
              <span className="text-xs text-text-secondary uppercase">Nivel de exigencia operativa</span>
              <span className="text-xs text-text-primary font-bold uppercase">{urgencyInfo.label}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-xs text-text-secondary uppercase">Configuración sugerida</span>
              <span className="text-xs text-text-primary font-bold uppercase text-right max-w-[50%] truncate">{flowResult?.category || "Industrial Estándar"}</span>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: Viabilidad Técnica Preliminar */}
        <div className="space-y-4">
          <h3 className="font-display text-base tracking-wider text-text-primary uppercase border-b border-border-medium pb-2">
            Viabilidad Técnica Preliminar
          </h3>
          <div className="border border-border-subtle bg-bg-secondary/40 p-5 rounded-sm space-y-4">
            <div className="flex justify-between border-b border-border-subtle/50 pb-2">
              <span className="text-xs text-text-secondary uppercase">Capacidad requerida</span>
              <span className="text-xs text-text-primary font-bold uppercase">{flowResult ? `${flowResult.estimatedFlow.toLocaleString()} CFM` : "Análisis en sitio requerido"}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle/50 pb-2">
              <span className="text-xs text-text-secondary uppercase">Rango operativo</span>
              <span className="text-xs text-text-primary font-bold uppercase">{flowResult?.investmentRange || "Industrial Estándar"}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle/50 pb-2">
              <span className="text-xs text-text-secondary uppercase">Compatibilidad normativa</span>
              <span className="text-xs text-text-primary font-bold uppercase">RETIE / NTC 2050</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-xs text-text-secondary uppercase">Recomendación técnica</span>
              <span className="text-xs text-text-primary font-bold uppercase text-right max-w-[50%]">Inspección Presencial</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 4: Inversión Referencial */}
      <div className="space-y-4 pt-4">
        <h3 className="font-display text-base tracking-wider text-text-primary uppercase border-b border-border-medium pb-2">
          Inversión Referencial
        </h3>
        <div className="border border-border-subtle bg-bg-secondary/20 p-6 rounded-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-mono text-xl md:text-2xl text-slate-500 font-semibold tracking-wide">
              {formatCOP(prices.minCOP)} - {formatCOP(prices.maxCOP)}
            </span>
            <p className="text-[11px] text-text-muted leading-relaxed max-w-lg text-left md:text-right italic">
              * El valor mostrado constituye una referencia preliminar y podrá variar tras la validación técnica en sitio y el desarrollo de la ingeniería de detalle.
            </p>
          </div>
        </div>
      </div>

      {/* BLOQUE 5: Próximos Pasos Recomendados */}
      <div className="space-y-4 pt-4">
        <h3 className="font-display text-base tracking-wider text-text-primary uppercase border-b border-border-medium pb-2">
          Próximos Pasos Recomendados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="border border-border-subtle p-4 rounded-sm bg-bg-primary relative">
            <span className="absolute -top-3 left-4 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-sm font-mono">01</span>
            <span className="text-xs font-semibold text-text-primary uppercase block mt-2">Revisión de diagnóstico</span>
          </div>
          <div className="border border-border-subtle p-4 rounded-sm bg-bg-primary relative">
            <span className="absolute -top-3 left-4 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-sm font-mono">02</span>
            <span className="text-xs font-semibold text-text-primary uppercase block mt-2">Validación técnica</span>
          </div>
          <div className="border border-border-subtle p-4 rounded-sm bg-bg-primary relative">
            <span className="absolute -top-3 left-4 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-sm font-mono">03</span>
            <span className="text-xs font-semibold text-text-primary uppercase block mt-2">Ingeniería de detalle</span>
          </div>
          <div className="border border-border-subtle p-4 rounded-sm bg-bg-primary relative">
            <span className="absolute -top-3 left-4 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-sm font-mono">04</span>
            <span className="text-xs font-semibold text-text-primary uppercase block mt-2">Propuesta definitiva</span>
          </div>
        </div>
      </div>

      {/* BLOQUE 6: CTAs Principales */}
      <div className="pt-8 flex flex-col sm:flex-row gap-4 items-center justify-center border-t border-border-subtle mt-8">
        <button
          onClick={() => generateB2BPdf(false)}
          disabled={isGeneratingPdf}
          className={`w-full sm:w-auto px-8 py-4 font-semibold text-xs tracking-wider uppercase rounded-sm transition-all flex items-center justify-center gap-2 ${
            isGeneratingPdf
              ? "bg-slate-200 text-slate-500 cursor-wait"
              : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
          }`}
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              GENERANDO DOCUMENTO...
            </>
          ) : (
            <>
              <FileDown className="h-4.5 w-4.5" />
              DESCARGAR PREINGENIERÍA ESTIMADA
            </>
          )}
        </button>

        <button
          onClick={handleWhatsAppClick}
          className="w-full sm:w-auto px-8 py-4 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wider uppercase rounded-sm transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          SOLICITAR REVISIÓN CON ESPECIALISTA
        </button>
      </div>

      {/* Navigation action row */}
      <div className="pt-6 border-t border-border-subtle flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-border-medium hover:border-text-primary text-text-secondary hover:text-text-primary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          REGRESAR A SOLICITUD
        </button>
        
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-border-medium hover:border-text-primary text-text-secondary hover:text-text-primary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          NUEVA ESTIMACIÓN
        </button>
      </div>

    </div>
  );
}
