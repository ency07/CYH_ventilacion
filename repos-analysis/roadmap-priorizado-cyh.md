# Fase 0.2: Roadmap Priorizado de CYH (Análisis ROI)

Este documento contiene la validación arquitectónica y la priorización de iniciativas basada estrictamente en el retorno de inversión (ROI), el impacto comercial y la reducción de la fricción tecnológica para convertir a CYH en una plataforma SaaS Industrial Premium.

---

## 1. Análisis de Iniciativas por Dominio

### 1.1. Emails y PDF (Documentación Saliente)
- **Impacto Comercial:** Altísimo. Es el único artefacto que los clientes corporativos reenvían internamente a sus comités de compras o gerentes de planta.
- **Impacto Visual:** Alto. Define si CYH es un proveedor de ingeniería premium o un taller local.
- **Complejidad Técnica:** Baja. Modificar el HTML del correo (`emails.ts`) y reestructurar `jsPDF`.
- **Riesgo:** Bajo.
- **Clasificación ROI:** **ROI CRÍTICO**

### 1.2. Wizard y StepSummary (Generación de Leads)
- **Impacto Comercial:** Alto. Es la barrera de entrada para la captación del lead. Si la percepción es "Calculadora Automática", los directores abandonan. Si la percepción es "Diagnóstico Inteligente" (Rich Elicitation), la tasa de conversión se dispara.
- **Impacto Visual:** Alto. Es el Core Product público.
- **Complejidad Técnica:** Media-Alta (Árboles de decisión dinámicos y scoring condicional).
- **Riesgo:** Medio.
- **Clasificación ROI:** **ROI ALTO**

### 1.3. CRM (Pipeline Operativo Interno)
- **Impacto Comercial:** Medio-Alto. Impacta en la eficiencia del equipo comercial para no dejar caer negociaciones (seguimiento dnd-kit, Drawer Lateral estilo Twenty).
- **Impacto Visual:** Medio (es de uso interno).
- **Complejidad Técnica:** Alta. Requiere persistencia en Supabase, reestructuración del estado global y arrastrar tarjetas (Kanban dnd-kit).
- **Riesgo:** Alto (potencial de dañar datos si no se sincroniza bien).
- **Clasificación ROI:** **ROI ALTO**

### 1.4. Landing Page
- **Impacto Comercial:** Medio. Sirve de validación rápida, pero el cliente B2B técnico llega directo a evaluar capacidades mediante el diagnóstico. 
- **Impacto Visual:** Muy Alto. El "Hero Cinematográfico" y el "Storytelling" establecen el tono SaaS (estilo ShipFree).
- **Complejidad Técnica:** Baja (solo UI/UX y Tailwind).
- **Riesgo:** Muy Bajo.
- **Clasificación ROI:** **ROI MEDIO**

### 1.5. Dashboard Ejecutivo (Gráficos)
- **Impacto Comercial:** Medio. Provee control de métricas gerenciales internas, pero no capta clientes directamente.
- **Impacto Visual:** Alto (Gráficos Recharts que imponen autoridad).
- **Complejidad Técnica:** Media (Fetch de datos agregados y renderizado seguro).
- **Riesgo:** Bajo.
- **Clasificación ROI:** **ROI MEDIO**

---

## 2. Matriz de Priorización y Esfuerzo

| Iniciativa | Dominio | ROI | Complejidad | Prioridad |
| :--- | :--- | :--- | :--- | :--- |
| **1. Refactorización PDF y Emails** | Ventas / Cierre | CRÍTICO | Baja | **1 (Inmediata)** |
| **2. Rich Elicitation (Wizard Dinámico)** | Captación de Leads | ALTO | Media-Alta | **2 (Alta)** |
| **3. CRM UX (Drawer + DND Kanban)** | Operativa Comercial | ALTO | Alta | **3 (Alta)** |
| **4. Landing Page Premium** | Percepción Marca | MEDIO | Baja | **4 (Media)** |
| **5. Dashboard de KPIs** | Inteligencia Negocios | MEDIO | Media | **5 (Media)** |

---

## 3. Hoja de Ruta de Ejecución en Fases (Plan de Ataque)

Basado en la máxima **"Mayor impacto comercial con el menor esfuerzo técnico"**, la ejecución se estructurará de la siguiente forma para acelerar el valor (Time-to-Value):

### **Sprint 1: Cierre y Percepción de Valor (Quick Wins)**
Atacar los entregables salientes que consumen los Gerentes de Planta y Compradores.
- Reescribir el HTML de `emails.ts` a un formato corporativo severo, omitiendo el precio en primer plano.
- Rediseñar el motor `jsPDF` (`generateB2BPdf`) en un reporte estructurado B2B, erradicando elementos de cotizador básico.

### **Sprint 2: El Motor de Conversión SaaS**
Evolucionar la captación pública de un cuestionario lineal a un árbol de diagnóstico de ingeniería.
- Reconstruir la lógica del *Wizard* implementando *Rich Elicitation* (preguntas reactivas basadas en la severidad y el entorno reportado por el cliente).
- Refinamiento de *StepSummary* como la antesala al PDF.

### **Sprint 3: La Máquina Operativa Interna**
Brindarle al equipo de CYH las herramientas para que la plataforma no sea solo un captador, sino un hub central de negocios.
- Instalar la tabla interactiva de TanStack Table.
- Construir el *Drawer Lateral* estilo Twenty (vía shadcn `Sheet`) para ver detalles del Lead.
- Activar el *Drag and Drop* (dnd-kit) en el CRM.

### **Sprint 4: El Empaque SaaS Premium**
El "pulido" final que proyecta autoridad de nivel Enterprise desde el segundo cero.
- Hero cinematográfico en Landing Page con microinteracciones y *Storytelling*.
- Dashboard interno con métricas interactivas y visualización industrial vía Recharts.
