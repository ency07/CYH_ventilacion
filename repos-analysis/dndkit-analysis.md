# Auditoría Open Source: dnd-kit

## Análisis de Extracción
dnd-kit es una librería moderna, liviana y modular para interacciones drag-and-drop en React.

### Componentes reutilizables para CYH
- **Motor Kanban (Pipeline CRM):** Movimiento de las tarjetas de los leads entre columnas (ej. "Nuevo" -> "Diagnosticado" -> "Propuesta" -> "Negociación").
- **Sortable Context:** Reordenamiento vertical de prioridades dentro de la misma columna.

### Dependencias necesarias
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

### Complejidad de integración
- **Media-Alta.** El manejo del estado drag-and-drop junto con la persistencia en base de datos (Supabase) requiere cuidado para evitar desincronizaciones (Optimistic UI updates). Se debe calcular correctamente el momento en el que el Lead cambia de columna para disparar el Action de actualización en el backend.

### Beneficio comercial
- Interacción obligatoria para un CRM moderno. Los vendedores esperan mover las tarjetas con el mouse. Reducir la fricción de actualizar el estado de un lead mediante botones aumentará la adopción del sistema interno.

### Impacto visual
- **Alto.** Animaciones fluidas al soltar una tarjeta y reorganización automática del tablero (layout animations).

### Riesgo técnico
- **Bajo.** Es la librería estándar *de facto* para DND en React actualmente, superando a react-beautiful-dnd en accesibilidad y rendimiento.
