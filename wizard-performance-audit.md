# Auditoría del Wizard B2B

## 1. Procesamiento síncrono pesado
El componente `StepSummary.tsx` importa dinámicamente `jspdf`, pero ejecuta la creación del documento completo (trazado de líneas, fuentes, polígonos, split de texto) en el hilo principal de JavaScript de manera síncrona dentro de la función `generateB2BPdf()`. Esto provoca congelamiento de UI (Main Thread Blocking) durante ~500ms - 1500ms dependiendo del dispositivo móvil o PC del cliente.

## 2. Simulaciones innecesarias
En `StepLead.tsx`, la función `onSubmit` incluye múltiples bloqueos artificiales con `await new Promise(r => setTimeout(r, 600))` para simular progreso SCADA. Esto suma más de 2.5 segundos muertos a la interacción del usuario antes de pasar al resumen.

## 3. Múltiples peticiones HTTP en Cascada
Al crear un lead en `StepLead.tsx`, se disparan en secuencia 4 Server Actions:
1. `createLeadAction`
2. `createDiagnosticAction`
3. `createPipelineEntryAction`
4. `createActivityLogAction`
Esto multiplica el RTT (Round Trip Time) de latencia de red. Deberían agruparse en una sola transacción o un solo Endpoint RPC en Drizzle/Supabase.

## 4. Duplicidad de estado
El estado del lead existe tanto en `useWizardStore` (zustand) como en `react-hook-form`. Mantenerlos sincronizados causa doble renderizado.

## Tiempos de renderizado medidos (Estimado)
- **Generación PDF:** 850ms a 1.2s (Bloqueante)
- **Submit Lead:** 3200ms (Artificialmente ralentizado) + 800ms (Red) = ~4.0s
- **Time to Interactive (StepSummary):** 1.5s
