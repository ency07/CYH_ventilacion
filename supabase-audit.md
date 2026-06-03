# Auditoría de Supabase (Database & ORM)

## 1. Problemas Críticos de Indexación
Revisando `schema.ts`, el esquema relacional en Drizzle ORM no declara ningún índice explícito (B-Tree).
- **`leads.status`**: Usado constantemente para filtrar en CRM y KPIs. Sin índice resulta en un Seq Scan (escaneo de tabla completa).
- **`crm_pipeline.stage`**: Filtro principal del Kanban. Seq Scan inminente.
- **`leads.createdAt`**: Usado para ordenar descendentemente `orderBy(desc(leads.createdAt))` en múltiples consultas. Extremadamente costoso sin un índice.

## 2. Consultas tipo SELECT * encubiertas
`db.select().from(leads)` extrae todas las columnas (notas largas de texto, datos crudos, descripciones de actividades) aunque el CRM solo necesite `id`, `companyName`, `status` y `estimatedBudgetMax` para la vista principal. Esto satura la RAM del servidor Node y el pool de conexiones de Supabase/PgBouncer.

## 3. Transacciones y Concurrencia
La función `updateLeadStatusAction` utiliza transacciones `db.transaction`, lo cual es excelente para consistencia, pero al no existir índices en los `where(eq(...))` las transacciones demoran más en bloquear las filas (Row Level Locks temporales excesivos).

## 4. Relaciones no optimizadas
Se usan consultas separadas como en `getDashboardMetricsAction` (que hace `db.select().from(leads)` entero) para sacar counts, en lugar de usar comandos agregados como `SELECT status, count(*) FROM leads GROUP BY status`. La agregación en memoria de Node.js es el peor escenario para un ORM.
