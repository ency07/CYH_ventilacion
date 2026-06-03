# Auditoría Frontend (Performance)

## 1. Componentes con tamaño excesivo
- **`components/wizard/StepSummary.tsx`** (662 líneas): Mezcla lógica de UI, cálculos de estado global, formateo y la generación imperativa entera de `jsPDF` (más de 300 líneas de comandos de dibujo).
- **`components/wizard/StepLead.tsx`** (599 líneas): Contiene el manejo de formularios, simulación de carga con `setTimeout`, llamadas a 4 Server Actions distintos secuenciales y renderizado condicional complejo.
- **`app/crm/page.tsx`** (378 líneas): Todo el Kanban, filtros y cálculos estadísticos matemáticos (KPIs) viven dentro del mismo archivo de React, forzando re-renders gigantescos al escribir en la barra de búsqueda.

## 2. Re-renderizados innecesarios
- **CRM Kanban**: El estado `searchTerm` y `filterAssignee` en `app/crm/page.tsx` está atado a la raíz del componente. Cada vez que se teclea una letra en el buscador, React re-renderiza el layout completo, recalcula los KPIs financieros y vuelve a mapear las 8 columnas del Kanban con todos los leads.
- **Wizard**: `useWizardStore` almacena todas las variables. Cualquier cambio en un campo detona un re-render del Layout superior.

## 3. Uso incorrecto de Hooks
- **Falta de `useMemo`**: Los KPIs en `app/crm/page.tsx` (`weightedPipelineValue`, `avgDaysToClose`, `proposalsSent`) se recalculan en cada ciclo de renderizado.
- **`useEffect` bloqueante**: El PDF se autogenera en un `useEffect` tan pronto el componente `StepSummary` se monta, disparando peticiones pesadas y bloqueando el TTI (Time to Interactive).

## 4. Cargas Dinámicas faltantes
- Las dependencias pesadas de iconos y el framework de drag-and-drop del Kanban deberían utilizar `next/dynamic` para reducir el First Load JS.
