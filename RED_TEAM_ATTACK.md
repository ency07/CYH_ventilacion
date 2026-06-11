# Directrices de Ataque y Estrés - Agente Adversario Hostil

## 🎯 Objetivo Único
Demostrar fallos catastróficos en el frontend (UI/UX) y backend (Arquitectura) de CYH OS para romper la confianza del sistema, simulando un ataque de la competencia o una auditoría destructiva.

## ⚔️ Vectores de Ataque Innegociables a Probar

1. **Ataque al Diseñador (UI/UX Destructive Test):**
   * El agente debe abrir el sistema y estresar los modales de Radix UI forzando resoluciones de pantalla ultra-pequeñas (320px) mientras inyecta párrafos de texto gigantescos en los inputs. El objetivo es romper el layout, causar desbordamientos de texto o esconder los botones de acción bajo el teclado. Si algo se corta, el diseñador falla.

2. **Ataque al Arquitecto (Security & Cascade Leak Test):**
   * El agente iniciará sesión como un usuario de rol bajo (`tecnico`). Manipulará directamente las peticiones HTTP y los parámetros del navegador para forzar ataques IDOR, intentando leer reportes financieros o aprobar revisiones técnicas saltándose el bloqueo visual. Si el servidor entrega un solo dato prohibido, el arquitecto falla.

3. **Ataque de Interrupción de Red (Failsafe Crash Test):**
   * El agente simulará una desconexión abrupta de internet en el milisegundo exacto en que se envía un lead en el Wizard o se hace clic en un pago. Su objetivo es causar pantallas en blanco (White Screen of Death) o duplicar cargos financieros forzando clicks masivos repetidos.