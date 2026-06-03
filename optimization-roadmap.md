# Roadmap de Optimización de Rendimiento

| Prioridad | Tipo | Tarea de Optimización | Impacto | Dificultad | Ahorro Esperado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CRÍTICO** | Base de Datos | Agregar Índices a `status`, `createdAt`, `stage` en PostgreSQL | Alto | Baja | Eliminación de consultas Seq Scan; -80% latencia DB |
| **CRÍTICO** | Server Actions | Reescribir agregaciones de KPIs usando SQL (`SUM`, `COUNT`, `GROUP BY`) en lugar de extraer todo | Alto | Media | Prevención de crash por OOM en Node.js, -95% payload de red |
| **CRÍTICO** | Frontend / DB | Paginación / Virtualización en CRM Kanban | Alto | Alta | Navegador fluido con >500 leads, evitar DOM Bloat |
| **ALTO** | Wizard | Eliminar delays artificiales (`setTimeout`) en `StepLead.tsx` | Alto | Baja | Interfaz un 70% más rápida para el cliente (TTI) |
| **ALTO** | Wizard | Extraer lógica `generateB2BPdf` a un Web Worker o Servicio Backend independiente | Alto | Alta | Evitar congelamiento de UI (Main Thread blocking) |
| **MEDIO** | Arquitectura | Agrupar transacciones Drizzle en `StepLead` (1 solo RPC en vez de 4 cascadas HTTP) | Medio | Media | Reducción de 600ms en latencia de red (RTT) |
| **MEDIO** | Frontend | Implementar `useMemo` y segregación de estado en SearchBar del CRM | Medio | Baja | Evitar re-renders de todo el layout del Dashboard |
| **BAJO** | Bundle | Mover componentes puramente visuales del Wizard a React Server Components | Bajo | Alta | -15kb en First Load JS |
| **BAJO** | Bundle | Lazy-load asíncrono de `jspdf` sólo cuando se presione el botón (On-Demand) | Bajo | Media | Menos consumo de RAM en móviles |
