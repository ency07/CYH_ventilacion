# Auditoría Open Source: shadcn/ui

## Análisis de Extracción
shadcn/ui no es una librería de componentes tradicional, sino una colección de componentes reusables construidos sobre Radix UI y TailwindCSS que se copian e insertan en el proyecto.

### Componentes reutilizables para CYH
- **Sheet (Drawer Lateral):** Fundamental para replicar la UX de Twenty CRM (Ficha del Lead en el CRM sin cambiar de página).
- **Tabs:** Para separar el "Timeline", "Detalles Técnicos" y "Notas" dentro del Drawer del Lead.
- **Select / Combobox (Command):** Para asignación de responsables y cambio de estados con búsqueda en tiempo real.
- **Skeleton:** Para *loading states* premium durante la carga del diagnóstico y listados.
- **Toast / Sonner:** Para retroalimentación no intrusiva al crear leads o moverlos en el embudo.
- **Card:** Contenedores estandarizados para el Dashboard Ejecutivo.

### Dependencias necesarias
- `radix-ui` (primitivas de accesibilidad).
- `clsx` y `tailwind-merge` (ya configurados en la mayoría de stacks Next.js).
- `lucide-react`.

### Complejidad de integración
- **Baja.** shadcn/ui está diseñado exactamente para ser incorporado a demanda. Se copian solo los componentes que se necesitan, sin sobrecargar el *bundle*.

### Beneficio comercial
- Ahorra decenas de horas de desarrollo en componentes accesibles y con comportamientos complejos (foco de teclado, lectores de pantalla, modales que bloquean el scroll).

### Impacto visual
- **Alto.** Provee el acabado "Premium SaaS" neutro y limpio que CYH requiere (colores Slate/Zinc), erradicando las interfaces que parecen plantillas genéricas.

### Riesgo técnico
- **Muy Bajo.** Al tener posesión del código fuente de los componentes, CYH puede modificarlos libremente sin depender de actualizaciones de paquetes de terceros.
