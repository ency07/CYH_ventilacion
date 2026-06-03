# Auditoría Open Source: Graphify / Recharts

## Análisis de Extracción
Librerías de visualización de datos (como Recharts o abstracciones similares de dashboarding tipo Graphify / Tremor). 

### Componentes reutilizables para CYH
- **Dashboard Ejecutivo:** Gráficos de barras para "Leads por Etapa", gráficos de líneas para "Conversión Mensual", y gráficos de anillo (Donut) para "Distribución de Ambientes Industriales".
- **Métricas de Diagnóstico:** En el PDF o resumen del cliente final, visualizar gráficamente el nivel de criticidad o la curva de pérdida de presión.

### Dependencias necesarias
- `recharts` (El estándar soportado nativamente por shadcn/ui charts).

### Complejidad de integración
- **Baja-Media.** Consumir los datos estructurados desde el servidor y transformarlos al array de objetos que requiere la librería.

### Beneficio comercial
- La visualización de datos es el corazón de un SaaS Enterprise. Un director de planta confiará más en CYH si ve gráficos de ingeniería claros, y la gerencia interna tendrá visibilidad total del rendimiento de ventas sin leer tablas de Excel.

### Impacto visual
- **Muy Alto.** Es el principal diferenciador visual entre un "sistema básico" y una "plataforma corporativa". Aportan autoridad técnica e inteligencia de negocios.

### Riesgo técnico
- **Bajo.** Recharts es extremadamente estable. El único riesgo es la renderización en el servidor (SSR); los gráficos deben cargarse dinámicamente o envolverse en componentes "use client" con un *Skeleton fallback* para prevenir *hydration mismatches*.
