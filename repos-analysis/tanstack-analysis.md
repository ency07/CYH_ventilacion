# Auditoría Open Source: TanStack Table

## Análisis de Extracción
TanStack Table (anteriormente React Table) es un framework *headless* para construir tablas de datos complejas. No provee CSS, solo la lógica de control.

### Componentes reutilizables para CYH
- **Lógica de Tabla Ejecutiva (Lista de Leads):** Manejo de ordenamiento (Sort), paginación (Pagination) y filtrado global (Fuzzy Search) para el inventario de leads en `/crm`.
- **Filtros por Columna:** Para buscar leads por "Cargo", "Nivel de Urgencia" o "Asesor".
- **Columnas Dinámicas:** Habilidad de mostrar/ocultar columnas dependiendo del rol del usuario (Ej: Técnico vs Comercial).

### Dependencias necesarias
- `@tanstack/react-table`.

### Complejidad de integración
- **Media.** Requiere construir la UI completa usando Tailwind (o integrándolo con las tablas de shadcn/ui) y conectar los métodos del *hook* `useReactTable`.

### Beneficio comercial
- Permite a los directores comerciales de CYH gestionar y buscar entre cientos de leads de forma instantánea sin tiempos de carga por recargas de página completas.

### Impacto visual
- **Alto (indirecto).** Al acoplarse con un diseño sobrio (ej. shadcn), la tabla deja de verse como un HTML básico y se convierte en una cuadrícula interactiva estilo Excel / Notion.

### Riesgo técnico
- **Medio-Bajo.** Curva de aprendizaje inicial para configurar el modelo de datos (Column Defs), pero extremadamente robusto y con excelente tipado de TypeScript para prevenir errores de datos nulos en producción.
