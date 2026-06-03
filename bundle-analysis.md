# Análisis de Bundle (JavaScript First Load)

## 1. Dependencias Pesadas
La métrica del comando `next build` arroja lo siguiente:
- `/cotizador`: 49.9 kB (El más pesado del sistema).
- `First Load JS shared by all`: 87.4 kB (Aceptable para Enterprise, pero optimizable).

La inclusión de librerías como:
- `jspdf` (PDF generation).
- `framer-motion` (Animaciones y transiciones complejas en WizardForm).
Representan más del 60% del peso del JavaScript del cotizador/wizard.

## 2. Renderizado del Lado Cliente Innecesario
`WizardForm.tsx` y todo el CRM están marcados con `"use client"`. Al ser aplicaciones que manejan layouts completos, están obligando a que la hidratación de React cargue el framework entero. `jspdf` debería idealmente cargarse solo cuando el usuario hace clic en el botón de "Descargar PDF", usando `next/dynamic` o un lazy import dentro del onClick, pero actualmente Next.js asume su peso en la ruta general porque el useEffect lo dispara al montar.

## 3. Carga en Cascada
No hay divisiones claras de `Suspense` Boundaries en los componentes de UI que realizan cálculos, lo que obliga al navegador a descargar todo el paquete JS del `/cotizador` antes de poder interactuar con el primer botón.

## 4. Código no utilizado (Dead Code / Tree-Shaking issues)
Las librerías de UI (lucide-react, etc) están bien manejadas (Next 14 las optimiza), pero las constantes de texto estáticas podrían pasarse a Server Components para aligerar la carga en el dispositivo móvil de los operarios de planta.
