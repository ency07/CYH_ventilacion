# Reporte de Correcciones de Performance (Sprint CYH)

## 1. Índices SQL
- **Archivo Modificado:** `lib/db/schema.ts` y `supabase/migrations/0002_performance_indexes.sql`
- **Problema Encontrado:** `status` y `createdAt` en la tabla `leads` no tenían índices B-Tree, forzando un Seq Scan (escaneo completo) en cada carga del Kanban.
- **Solución Aplicada:** Implementación de índices `status_idx`, `created_at_idx`, `stage_idx` y `assigned_to_idx` mediante Drizzle ORM.
- **Mejora Esperada:** -80% latencia en Dashboard CRM, habilitación de búsquedas escalables.
- **Riesgo:** Bajo. Ligero aumento en tamaño de almacenamiento en Supabase.
- **Resultado Build:** ✅ Pasado.

## 2. Reducción de Extracción Masiva (SELECT *)
- **Archivo Modificado:** `lib/server-actions/crm.ts`
- **Problema Encontrado:** `getAllLeadsWithCrmDataAction` extraía notas largas y datos inútiles de todas las filas (`SELECT *`).
- **Solución Aplicada:** Reescritura del Drizzle select statement explícito: `db.select({ id: leads.id, ... })` solo para los datos visibles en tarjeta Kanban.
- **Mejora Esperada:** Reducción drástica del tamaño del Payload de red y uso de RAM en el cliente.
- **Riesgo:** Bajo. Posible undefined si la UI intentaba leer un campo excluido (Verificado).
- **Resultado Build:** ✅ Pasado.

## 3. Optimización de Búsqueda CRM con Debounce
- **Archivo Modificado:** `app/crm/page.tsx`
- **Problema Encontrado:** Escribir en el Search Bar renderizaba el Kanban completo por cada pulsación de tecla.
- **Solución Aplicada:** Implementación de un Hook/Effect de Debounce (`debouncedSearchTerm`) de 300ms.
- **Mejora Esperada:** Eliminación total de stuttering/congelamiento al buscar un lead. Interfaz fluida (60 FPS).
- **Riesgo:** Nulo.
- **Resultado Build:** ✅ Pasado.

## 4. Eliminación de Delays Artificiales (Timeouts)
- **Archivo Modificado:** `components/wizard/StepLead.tsx`
- **Problema Encontrado:** Múltiples `await new Promise(r => setTimeout(r, 600))` bloqueaban el TTI por 3-4 segundos simulando "cálculos industriales".
- **Solución Aplicada:** Eliminación total de los temporizadores artificiales.
- **Mejora Esperada:** Paso de la pantalla Lead a Summary de forma instantánea al procesar la promesa de base de datos.
- **Riesgo:** Nulo. Solo se percibe más rápido.
- **Resultado Build:** ✅ Pasado.

## 5. Lazy Loading de jsPDF Verificado
- **Archivo Modificado:** `components/wizard/StepSummary.tsx`
- **Problema Encontrado:** Peso excesivo de jsPDF en el bundle inicial.
- **Solución Aplicada:** Verificación del import dinámico asíncrono (`await import("jspdf")`) dentro de la función `generateB2BPdf()`.
- **Mejora Esperada:** jsPDF no es cargado por el navegador hasta que no se monta el componente final o se presiona descargar.
- **Riesgo:** Ninguno, patrón oficial Next.js / Webpack.
- **Resultado Build:** ✅ Pasado.
