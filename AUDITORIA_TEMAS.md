# Reporte de Auditoría: Sistema de Temas e Hidratación (VentiTech OS)

Este reporte detalla el análisis de la arquitectura de temas, marcas corporativas y compuertas de hidratación en la plataforma, identificando causas raíz para comportamientos visuales anómalos y parpadeos en pantalla (FOUC).

---

## 1. Evidencia Exacta de Configuración

| Elemento | Identificador / Llave | Propósito |
| :--- | :--- | :--- |
| **Provider (Root/Web)** | `<ThemeProvider>` en `app/layout.tsx` | Aislamiento de la Web Pública (`storageKey="ventitech-web-theme"`) |
| **Provider (CRM)** | `<ThemeProvider>` en `app/crm/layout.tsx` | Aislamiento del CRM (`storageKey="ventitech-crm-theme"`) |
| **Provider (Portal)** | `<ThemeProvider>` en `app/portal/layout.tsx` | Aislamiento del Portal (`storageKey="ventitech-portal-theme"`) |
| **Hook** | `useTheme()` de `next-themes` | Obtener y modificar el tema actual en el cliente |
| **Local Storage (Web)** | `ventitech-web-theme` | Persiste el tema de la Web Pública (`light` / `dark`) |
| **Local Storage (CRM)** | `ventitech-crm-theme` | Persiste el tema del CRM (`light1`, `light2`, `light3`, `dark1`, `dark2`, `dark3`) |
| **Local Storage (Portal)** | `ventitech-portal-theme` | Persiste el tema del Portal Clientes (`light1`, `light2`, `light3`, `dark1`, `dark2`, `dark3`) |
| **Cookie** | `cyh-crm-session` | Sesión del usuario (independiente de temas) |
| **Variables CSS (Temas)** | `--bg`, `--surface`, `--card`, `--text`, `--border` | Colores base inyectados mediante clases de tema en `app/globals.css` |
| **Variables CSS (Branding)** | `--brand-primary`, `--brand-secondary`, `--brand-logo` | Colores y recursos del Tenant (VentiTech o Personalizado) |

---

## 2. Reporte de Auditoría de Archivos

| Archivo | Línea | Origen del Tema | Origen del Branding | Estado Inicial | Estado Final | Riesgo |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [layout.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/layout.tsx) | 59 | `next-themes` (`ThemeProvider`) | Estático / `:root` variables | Light (default) | Light / Dark | **Bajo** (Aislado para Web) |
| [layout.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/layout.tsx) | 38 | `next-themes` (`ThemeProvider`) | Estático / `:root` variables | Dark1 (default) | 6 temas CRM | **Bajo** (Aislado para CRM) |
| [layout.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/portal/layout.tsx) | 7 | `next-themes` (`ThemeProvider`) | Estático / `:root` variables | Light1 (default) | 6 temas Portal | **Bajo** (Aislado para Portal) |
| [CrmShell.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/CrmShell.tsx) | 227-258 | N/A | Asíncrono (`getTenantBrandingAction`) | `null` (Branding por defecto) | Tenant real cargado | **Alto** (Flasheo de marca e inyección tardía de CSS) |
| [PortalClient.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/portal/inicio/PortalClient.tsx) | 295-325 | N/A | Asíncrono (`getTenantBrandingAction`) | `null` (Branding por defecto) | Tenant real cargado | **Alto** (Flasheo de marca en cabecera y pie de página) |
| [page.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/login/page.tsx) | 75-97 | N/A | Estático quemado en código | `"CYH OS"` / `"CYH PORTAL"` | Marca del tenant | **Medio** (Muestra CYH antes de validar) |
| [globals.css](file:///c:/Users/Administrator/Desktop/CYH-VI/app/globals.css) | 6-136 | `@layer base` | Estático `:root` defaults | `:root` fallback | Clase asignada por layout | **Bajo** (Regla universal inyectada) |

---

## 3. Identificación de Causas Raíz

### Causa A: Aparición temporal de CYH antes de VentiTech
- **Diagnóstico**: Tanto en `CrmShell.tsx` (línea 364) como en `PortalClient.tsx` (línea 809), el estado inicial de `brandingConfig` en React es `null` porque se carga asíncronamente en el cliente mediante un `useEffect` (`getTenantBrandingAction`).
- **Mecanismo de Error**: Durante la primera pasada de renderizado en el navegador, al ser `brandingConfig` nulo, la expresión ternaria evalúa al fallback quemado: `{brandingConfig ? brandingConfig.companyName : "CYH OS"}`. Esto causa que el usuario vea temporalmente `"CYH OS"` por unos milisegundos antes de que el backend retorne la marca real (VentiTech) y fuerce un re-renderizado.
- **Riesgo asociado**: Afecta la percepción de profesionalismo y consistencia de marca corporativa (White-Label).

### Causa B: Sidebar oscuro y contenido claro (FOUC / Flash de Estilos)
- **Diagnóstico**: El color de fondo del sidebar se aplica dinámicamente inyectando una regla `<style>` en el DOM a través de variables JSX basadas en `brandingConfig`:
  ```css
  aside {
    background-color: ${brandingConfig.sidebarColor} !important;
  }
  ```
- **Mecanismo de Error**: Al cargar la página, la regla `<style>` no existe en el DOM (porque `brandingConfig` es `null`). El sidebar renderiza inicialmente con el fondo de color predeterminado del tema activo (`bg-bg-primary` en Tailwind). Cuando el `useEffect` se resuelve e inyecta la regla CSS en caliente, el sidebar cambia repentinamente de color. Si el tema general es claro pero el color de marca del sidebar es oscuro, esto produce un contraste inconsistente y un salto visual molesto (FOUC).
- **Riesgo asociado**: Inestabilidad visual al cargar CRM y Portal.

### Causa C: Desincronización entre Web, CRM y Portal de Clientes
- **Diagnóstico**: Originalmente, toda la aplicación utilizaba un único `ThemeProvider` en `app/layout.tsx` sin especificar un `storageKey` ni discriminar los temas disponibles para cada entorno.
- **Mecanismo de Error**: `next-themes` escribía y leía en la misma llave de localStorage (`theme`). Si el usuario seleccionaba un tema extendido como `siemens` en el CRM, al abrir la Web Pública (donde solo existían `light` y `dark`), el ThemeProvider de la web intentaba hidratarse con la clase `.siemens`. Al no estar definida correctamente o no ser soportada por los dropdowns, producía desalineación de estilos, fallos de hidratación de React y alternancias erráticas al cambiar de pestaña.
- **Estado Actual**: Solucionado en la última refactorización mediante la separación estricta de providers con `storageKey` independientes (`ventitech-web-theme`, `ventitech-crm-theme`, `ventitech-portal-theme`).
