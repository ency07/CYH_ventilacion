# Auditoría Open Source: Twenty CRM

## Análisis de Extracción
Twenty CRM es un CRM open source moderno construido con React, GraphQL y NestJS. Se caracteriza por su diseño ultra limpio, sistema de vistas personalizables (tablas y Kanban) y un modelo de datos altamente extensible.

### Componentes reutilizables para CYH
- **Arquitectura Visual del Kanban:** Estructura de columnas dnd (drag-and-drop), tarjetas de lead con avatares/iniciales y badges de estado.
- **Drawer / Panel Lateral:** El patrón UX donde al hacer clic en un lead, en lugar de navegar a una página nueva (`/crm/[id]`), se despliega un panel lateral derecho flotante con la información detallada (Timeline, Notas, Propiedades).
- **Filtros Avanzados y Vistas Guardadas:** UI para crear filtros condicionales (ej. "Lead Score > 75" AND "Status = Negociación").

### Dependencias necesarias
- Ninguna directa del core de Twenty (extraeremos los patrones visuales y UX hacia nuestro propio stack con Tailwind).
- `dnd-kit` (para el Kanban).
- `lucide-react` (iconografía ya en uso).

### Complejidad de integración
- **Alta (Adaptación UX):** Requiere reconstruir el `layout` del CRM actual en CYH para admitir sub-rutas anidadas o estado global que controle la apertura del *Drawer* lateral sin perder el contexto de la tabla principal.

### Beneficio comercial
- Eleva el CRM de una tabla genérica a una herramienta SaaS de grado Enterprise. El ejecutivo comercial de CYH no perderá el hilo de su *pipeline* al editar leads, mejorando la velocidad de seguimiento.

### Impacto visual
- **Muy Alto.** Transforma la experiencia de usuario (UX) haciéndola idéntica a plataformas Tier 1 como HubSpot o Salesforce Lightning.

### Riesgo técnico
- Posible sobrecarga del estado del cliente si se cargan todos los datos de todos los leads simultáneamente para el Drawer. Se debe implementar *lazy fetching* de los detalles del lead al abrir el panel.
