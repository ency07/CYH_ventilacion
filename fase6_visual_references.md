# FASE 6A.4 — REFERENCIAS VISUALES INDUSTRIALES PREMIUM

Para elevar la plataforma y el PDF al nivel de las mega-corporaciones industriales, aplicaremos los siguientes *Design Tokens* y guías de estilo extraídas de firmas como Siemens, ABB, y Deloitte.

## 1. Paleta de Colores (Estricta y Reducida)
- **Primary Base:** Negro Acero / Slate-900 (`#0f172a`). Uso: Headers, Botones primarios, Texto Principal.
- **Surface & Backgrounds:** Gris Papel / Slate-50 (`#f8fafc`) y Slate-100 (`#f1f5f9`). Uso: Fondos de cajas, separación visual de tablas.
- **Accents (Acentos Funcionales):** 
  - *Warning/Disclaimer:* Ámbar Industrial (`#d97706`).
  - *Success/Normativa:* Verde Oscuro (`#15803d`).
- **Data (Finanzas/Cantidades):** Gris Monocromático Oscuro (`#334155`). Prohibido usar verde brillante o cyan para precios.

## 2. Tipografía Documental
- **Títulos y Headers:** `Helvetica Neue` (Bold), tracking expandido (+0.05em), siempre en Mayúsculas Sostenidas (Uppercase).
- **Cuerpo de Texto y Observaciones:** `Helvetica`, tamaño legible pero clínico (9pt - 10pt).
- **Métricas y Códigos Documentales:** `Courier` o Monospaced. (Ej: `DOC-PRE-0023`). Da sensación de reporte técnico de máquina.

## 3. Composición en jsPDF (Grid y Espaciados)
- **Whitespace (Espacio en Blanco):** Deloitte y KPMG usan márgenes amplios (20mm a 25mm). Nunca abarrotar el documento.
- **Líneas Divisorias:** Uso intensivo de `doc.setLineWidth(0.2)` con grises claros para separar secciones limpiamente en lugar de dibujar cajas (boxes) completas.
- **Alineación de Tablas:** Los descriptores alineados a la izquierda, las cifras técnicas (m³, m³/h) alineadas rígidamente a la derecha para fácil tabulación.

## 4. Evitar a toda costa:
- Degradados (Gradients).
- Sombras base (Drop-shadows).
- Textos gigantes en precios.
- Iconos ilustrativos o caricaturescos (cliparts).
