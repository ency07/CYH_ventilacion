# Auditoría de CRM (Performance)

## 1. Fetching de Datos Costoso (N+1 / Sobre-extracción)
- La función `getAllLeadsWithCrmDataAction` en `crm.ts` hace un `leftJoin` de `leads` y `crmPipeline` sin paginación (`LIMIT`) y sin filtrado inicial en base de datos.
- A medida que la base de datos crezca a +1,000 leads comerciales, enviar todos estos registros en un solo array gigante al frontend (Client Component) colapsará la memoria del navegador y disparará los costos de transferencia de red (Egress).

## 2. KPIs Recalculados en Cliente
El CRM descarga crudos todos los leads y el cliente (el navegador del gerente comercial) se encarga de usar `Array.filter` y `Array.reduce` repetitivamente para calcular:
- Valor Ponderado (`weightedPipelineValue`)
- Tareas vencidas
- Oportunidades del mes
- Promedio de cierre
Esto significa complejidad `O(n)` multiplicada por cada métrica, re-ejecutada en cada tecla presionada en la barra de búsqueda. Debería calcularse usando vistas materializadas o consultas SQL agregadas (`SUM`, `COUNT`) en el servidor.

## 3. Re-Fetching ineficiente tras Drag & Drop
Al soltar una tarjeta en el Kanban (`handleDrop`), se dispara `updateLeadStatusAction` y luego se vuelve a llamar a `fetchData()`, lo cual descarga nuevamente TODOS los leads desde la base de datos para refrescar la pantalla, en lugar de usar Optimistic UI Updates puras o Next.js Server Actions con `revalidatePath` efectivo sin re-fetch del lado cliente.

## 4. Falta de Caché y Virtualización
La columna del Kanban no tiene virtualización (como `@tanstack/react-virtual`). Renderizar 500 tarjetas del lado cliente bloqueará el DOM (DOM Bloat).
