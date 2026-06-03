# Arquitectura Final CYH: Estrategia de Reutilización Open Source

Tras la Fase 0.1 de auditoría arquitectónica sobre los repositorios y librerías clave, se define la siguiente estrategia de integración para transformar el MVP de CYH en un SaaS Industrial Premium. El objetivo es **mínimo consumo de tokens, máxima reutilización y cero migraciones estructurales**.

## 1. Qué Reutilizar (Copiar e Implementar Directamente)

- **Patrones de UI (shadcn/ui):** Instalar selectivamente los componentes `Sheet` (Drawer para el CRM), `Tabs`, `Command` (Combobox Búsqueda), `Skeleton` y `Toast`. Son agnósticos al diseño y nos ahorran meses de accesibilidad (a11y).
- **Lógica de Tabla Ejecutiva (TanStack Table):** Utilizar su *hook* `useReactTable` puro para dotar al inventario de Leads de paginación cliente/servidor y filtrado instantáneo.
- **Gráficos Financieros/Técnicos (Recharts):** Inyectar los componentes preconfigurados de gráficos que consumen la data del Dashboard.

## 2. Qué Adaptar (Modificar para CYH)

- **Motor Kanban (dnd-kit):** Adaptar la lógica básica de *SortableContext* para conectarla con nuestros Server Actions de Supabase y actualizar el estado de los *Leads* del pipeline en la base de datos de forma optimista.
- **UX de Navegación del CRM (Inspirado en Twenty):** Adaptaremos la experiencia visual de Twenty CRM creando un **Drawer Lateral** (vía shadcn `Sheet`) para visualizar el Lead, en lugar de importar su pesado código base.
- **Layout Base y Landing (Inspirado en ShipFree):** Adaptaremos nuestros *Hero Sections* actuales para inyectarles la jerarquía visual de los SaaS premium (fondos oscuros, tipografía contrastante, Bento Grids), pero sobre nuestro propio DOM.

## 3. Qué Descartar (No Instalar bajo Ninguna Circunstancia)

- **No clonar repositorios completos:** Se prohíbe clonar o hacer un *fork* del código base de Twenty CRM o de un Boilerplate (ShipFree) e intentar migrar nuestra base de datos hacia ellos. Esto causaría una ruptura fatal (breaking changes) en la lógica existente de Supabase / Cotizador.
- **Librerías monolíticas de UI (MUI, Chakra, Bootstrap):** Descartadas totalmente. Generan un *bundle* pesado y tienen apariencia genérica, lo opuesto a nuestra directiva de diseño "Estudio de Ingeniería Premium". Todo será Tailwind + Componentes *headless*.

## 4. Orden Óptimo de Implementación (Hoja de Ruta SaaS)

Para garantizar la estabilidad productiva de CYH mientras mutamos el diseño, el orden de implementación será estrictamente el siguiente:

1. **Reestructuración Layout y Landing (Fase 1/3/ShipFree):** Refactorizar el Landing y el Navigation Shell con la paleta oscura premium, aplicando microinteracciones sin tocar la base de datos.
2. **Tablas de Datos Core (TanStack + shadcn):** Refactorizar la vista de lista del CRM y del Dashboard para soportar miles de registros eficientemente.
3. **Migración UX del CRM Kanban (Twenty UI + dnd-kit + Drawer):** Implementar el Drag and Drop y el despliegue lateral de las fichas de los Leads, conectando con Supabase.
4. **Data Visualization (Recharts):** Inyectar las gráficas ejecutivas dentro del Dashboard para medir las métricas comerciales y las etapas del embudo.
5. **Rediseño del Flujo de Diagnóstico (Fase 8 Rich Elicitation):** Una vez que el CRM está robusto para recibir leads, transformar el cuestionario actual a un árbol lógico estilo consultor (step-by-step dinámico).
