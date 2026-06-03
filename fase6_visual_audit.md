# Fase 6: Auditoría Visual Obligatoria (Pre-Ejecución)

Esta auditoría deconstruye la experiencia visual actual (MVP) para mapear psicológicamente lo que la plataforma proyecta hoy vs. lo que la ingeniería B2B corporativa requiere.

## 1. Landing Page
- **Qué transmite hoy:** "Startup tecnológica que hace calculadoras". Plantilla genérica de SaaS moderna.
- **Qué transmite psicológicamente:** Rapidez y automatización, pero falta de peso industrial.
- **Gerente de Planta:** Puede parecer demasiado "startupero" para un problema de ingeniería pesada.
- **Compras:** Herramienta ágil, pero no de una firma consultora.
- **Operaciones:** Duda de la profundidad del diagnóstico.
- **Clasificación predominante:** SaaS / Amateur moderno.
- **Métricas Visuales:** Alto contraste negro/blanco, pero falta de lenguaje "hierro/acero". CTA muy estándar ("Comenzar Diagnóstico").

## 2. Wizard (Proceso de Preguntas)
- **Qué transmite hoy:** Cuestionario lineal / Formulario Typeform.
- **Qué transmite psicológicamente:** Recolección de datos mecánica ("Están tomando mis datos para venderme algo").
- **Gerente de Planta:** Cansancio si percibe que son campos estadísticos y no técnicos.
- **Compras:** Burocracia.
- **Operaciones:** Puede apreciar la rapidez si el flujo es lógico.
- **Clasificación predominante:** Transaccional / SaaS.
- **Métricas Visuales:** Pasos horizontales genéricos. Ausencia de *feedback* deductivo entre pasos.

## 3. StepLead (Captura de Datos)
- **Qué transmite hoy:** Landing Page de generación de Leads.
- **Qué transmite psicológicamente:** "Aquí me van a empezar a mandar spam".
- **Gerente de Planta:** Resistencia a dar datos si el valor técnico anterior (Wizard) no fue suficiente.
- **Compras:** Evalúa si vale la pena dar sus datos corporativos.
- **Clasificación predominante:** SaaS Comercial.
- **Métricas Visuales:** Formularios estándar. Botón de enviar agresivo.

## 4. StepSummary (Pantalla Final de Resumen)
- **Qué transmite hoy:** Cotizador automático ("Esto me va a costar X").
- **Qué transmite psicológicamente:** Shock de precio y evaluación rápida de bolsillo, en lugar de apreciación técnica.
- **Gerente de Planta:** Mira el precio y decide si el proyecto es viable, ignorando a menudo la técnica.
- **Compras:** Recibe un valor crudo sin justificación de valor.
- **Clasificación predominante:** Ecommerce Industrial / Calculadora.
- **Métricas Visuales:** Tipografías inmensas para el precio (Ej. `$15,000,000`). Fuerte estética *Gamer/Cyberpunk* si se usan contadores animados.

## 5. PDF Generado
- **Qué transmite hoy:** Recibo de estimación rápida.
- **Qué transmite psicológicamente:** Documento desechable, no un entregable formal.
- **Gerente de Planta:** No lo imprimiría para presentarlo en comité.
- **Compras:** Un presupuesto aproximado más del montón.
- **Clasificación predominante:** Amateur / Cotizador.
- **Métricas Visuales:** Colores base saturados (cyan/azul eléctrico). Falta de densidad de información.

## 6. Email Generado
- **Qué transmite hoy:** Auto-responder de sistema ("Gracias por contactarnos, aquí está tu precio").
- **Qué transmite psicológicamente:** Despersonalización.
- **Gerente de Planta:** Lo archiva o lo ignora hasta que necesite el precio.
- **Clasificación predominante:** Automatización genérica.
- **Métricas Visuales:** HTML básico, sin la sobriedad del texto plano corporativo de un ejecutivo real.

## 7. CRM Kanban
- **Qué transmite hoy:** Trello de tareas.
- **Qué transmite psicológicamente:** Sistema genérico de gestión.
- **Comercial Interno:** Poco sentido de urgencia corporativa, más bien una lista de pendientes.
- **Clasificación predominante:** SaaS / Dashboard Bootstrap.
- **Métricas Visuales:** Tarjetas anchas, espacios blancos excesivos. No hay densidad de datos (Vista Ejecutiva).

## 8. Página de Detalle de Lead (`/crm/[id]`)
- **Qué transmite hoy:** Vista detallada tipo "Wiki".
- **Qué transmite psicológicamente:** Salida de contexto (rompe el flujo del pipeline).
- **Comercial Interno:** Fricción para revisar varios leads seguidos.
- **Clasificación predominante:** SaaS antiguo.
- **Métricas Visuales:** Navegación por páginas completas en lugar de paneles deslizantes (Drawers).

---

## Síntesis de Problemas de Conversión y UX
- **Jerarquía Visual Invertida:** El dinero es más grande que la ingeniería.
- **Estética Inconsistente:** Se mezcla SaaS moderno con componentes tipo *Gamer* (contadores animados) y reportes *Amateur*.
- **Paleta de Colores:** Uso de colores de acción (azul brillante, verde) como elementos estructurales, restando severidad (Premium Industrial).
- **Tipografías:** San-serif amigables (Inter/Roboto base) en lugar de estilos pesados, rígidos o monoespaciados para los datos técnicos que transmitan "Máquina/Ciencia".

Esta auditoría marca el baseline psicológico exacto que se debe destruir en las próximas fases de implementación arquitectónica.
