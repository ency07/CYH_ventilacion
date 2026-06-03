# FASE 6A.1 — AUDITORÍA DEL PDF Y EMAIL ACTUAL

Tras el análisis de los archivos base (`StepSummary.tsx` y `emails.ts`), se identificaron los elementos que dañan la percepción B2B de CYH, relegándola al estatus de "Cotizador Automático".

## 1. Elementos que parecen calculadora
- **`emails.ts`:** El uso de una tabla en línea con la etiqueta "Complejidad Técnica: X%". Un porcentaje estadístico aislado trivializa la ingeniería.
- **`jsPDF`:** La tabla de "Parámetros Operativos" mezcla variables físicas (volumen, caudal) con métricas transaccionales (inversiones) en el mismo nivel visual.

## 2. Elementos que parecen cotización
- **`emails.ts`:** Fila explícita "Rango Presupuesto Máx: COP $...". Al presentar el dinero directamente en el correo, el usuario recibe el choque de precio (Price Shock) antes de leer la ingeniería, abriendo la puerta a objeciones inmediatas basadas únicamente en costo.
- **`jsPDF`:** Uso de marcas de agua diagonales gigantes ("ESTIMACIÓN REFERENCIAL"). Sugiere un presupuesto preliminar comercial más que un reporte técnico.

## 3. Elementos que parecen ecommerce
- **`emails.ts`:** Subject Line genérico: "Estimación Preliminar — CYH Ingeniería". Carece del peso de un análisis técnico formal ("Reporte Técnico" o "Estudio de Viabilidad").
- **`jsPDF`:** El CTA o llamada a la acción es un rectángulo negro plano con el texto "SOLICITAR ASESORÍA ESPECIALIZADA", sin jerarquía ni contexto corporativo, imitando un botón de checkout.

## 4. Elementos que reducen percepción premium
- **`jsPDF`:** Colores en cyan brillante (`0, 212, 255`) e hipervínculos azules. Las firmas top (Siemens, ABB) usan paletas altamente restringidas: Blancos, Negros Matte, Grises fríos (Slate) y un solo color de acento mínimo (ej. Ámbar para warnings).

## 5. Elementos que aumentan autoridad técnica (Para potenciar)
- **`jsPDF`:** El uso actual de códigos documentales (`CÓDIGO: PRE-ING-2026 REV A`) es excelente y debe mantenerse.
- **`jsPDF`:** Las secciones de observaciones clínicas ("A. Observaciones Clínicas e Ingeniería de Detalle") añaden un fuerte componente de auditoría experta.
- **`jsPDF`:** Referencias directas a normativas (RETIE, NTC 2050). Mantiene la seriedad legal y operativa del proyecto.
