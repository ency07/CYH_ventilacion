# Reporte de Auditoría: Hidratación de Temas y Resolución de Tenant (Fase 2)

Este reporte profundiza en el análisis del ciclo de vida del renderizado de React (SSR a CSR), trazando el flujo de resolución de marca (Tenant) y temas, identificando causas y momentos exactos donde ocurren parpadeos (FOUC) y desincronizaciones visuales.

---

## 1. Flujo Completo del Renderizado y Trazabilidad (SSR → CSR)

A continuación, se detalla el orden cronológico de eventos al cargar una ruta del CRM o Portal de Clientes:

### Paso 1: SSR (Server-Side Rendering en Servidor Next.js)
- **Timestamp (Simulado)**: `T + 0ms`
- **Valor del Tenant**: No resuelto (Layouts de Next.js son Server Components sin estado dinámico de base de datos).
- **Valor del Branding**: No resuelto.
- **companyName**: Fallback del layout (`"VENTITECH"`) o títulos quemados en HTML.
- **logoUrl**: `/logo-sphere.jpg` (estático).
- **theme**: No se inyecta clase en `<html>` porque el script de `next-themes` aún no corre.
- **sidebarColor**: No aplicable (CSS estático en Tailwind: `bg-bg-primary`).

### Paso 2: Layout & ThemeProviders (HTML en Navegador)
- **Timestamp (Simulado)**: `T + 50ms` (Llegada del HTML)
- **theme**: `next-themes` lee el localStorage (`ventitech-crm-theme` o `ventitech-portal-theme`). Si está vacío, usa el default (`dark1` en CRM, `light1` en Portal). Si existe valor anterior (ej. `dark3`), inyecta inmediatamente la clase `<html class="dark3">` para evitar FOUC de tema.
- **companyName**: `"VENTITECH"` en la Web, pero dentro del shell del CRM/Portal renderiza provisionalmente el fallback del componente: `"CYH OS"` o `"CYH Portal"`.

### Paso 3: Montaje del Componente Cliente (Hydration en CSR)
- **Timestamp (Simulado)**: `T + 120ms`
- **companyName**: `"CYH OS"` (se renderiza en el cliente al montarse con `brandingConfig: null`).
- **theme**: `.dark1` o `.light1` (completamente hidratado por React).
- **sidebarColor**: No aplicable (el `<style>` dinámico aún no ha sido inyectado en el DOM).
- **Riesgo**: Aparición temporal de marca heredada ("CYH") y sidebar con color por defecto (mismatch visual).

### Paso 4: useEffect & Resolución Asíncrona (Fetch de Base de Datos)
- **Timestamp (Simulado)**: `T + 250ms` (Llamado a `getTenantBrandingAction`)
- **Valor del Tenant**: Resuelto desde la tabla `crm_tenant_config` de Supabase/Drizzle.
- **Valor del Branding**: Resuelto desde la tabla `crm_tenant_branding`.
- **companyName**: Cambia de `"CYH OS"` a `"VENTITECH"` (o nombre del tenant configurado).
- **logoUrl**: `/logo-text.png` o URL de imagen de base de datos.
- **sidebarColor**: Inyectado dinámicamente en el DOM vía `<style>` tag.
- **Riesgo**: El sidebar y los acentos cambian abruptamente de color tras la llamada, provocando un parpadeo visual.

---

## 2. Puntos Críticos y Valores de Fallback (Evidencia)

### A. Primer Componente que Renderiza "CYH OS" (Origen del Flash)
* **Archivo**: [CrmShell.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/CrmShell.tsx) (Línea 364)
* **Archivo**: [PortalClient.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/portal/inicio/PortalClient.tsx) (Línea 809)
* **Código de Fallback**: `{brandingConfig ? brandingConfig.companyName : "CYH OS"}`
* **Momento del Cambio**: Se produce al resolverse la promesa asíncrona dentro del `useEffect` de carga de marca corporativa (aprox. `150ms-300ms` después del montaje inicial).

### B. Primer Componente que Renderiza "VentiTech"
* **Archivo**: [Navbar.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/components/layout/Navbar.tsx) (Líneas 70-71)
* **Evidencia**: Renderiza de forma estática e inmediata en SSR el texto `<span className="brand-venti">VENTI</span><span className="brand-tech">TECH</span>`.

---

## 3. Análisis de Mecanismos de Caché y Ejecución

* **useEffect de Branding**: Presente tanto en `CrmShell.tsx` como en `PortalClient.tsx`. Ejecuta una llamada de acción de servidor (`getTenantBrandingAction`) al montarse.
* **Fetch Posterior al Render**: Sí, la resolución de marca no se realiza en SSR, sino mediante fetch asíncrono asíncrono pos-hidratación en el cliente, lo cual es la **causa principal del FOUC de Marca**.
* **Doble Renderizado (Strict Mode)**: En desarrollo, React Strict Mode provoca que el `useEffect` se ejecute dos veces, acentuando el retraso visual.
* **Caché de Server Actions**: Next.js no cachea por defecto llamadas `use server` dinámicas si provienen de componentes cliente sin un sistema de estado global (como Zustand o React Query). Al navegar entre subpáginas, el shell se vuelve a montar y realiza la petición de marca nuevamente, provocando parpadeos repetidos.

---

## 4. Evidencia Técnica Específica de Desincronización

### Causa de Desincronización entre Sidebar y Contenido (Sidebar Oscuro, Contenido Claro)
* **Archivo**: [CrmShell.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/CrmShell.tsx) (Líneas 315-338)
* **Origen**: Inyección de estilos inline dinámica vía `<style dangerouslySetInnerHTML={{ __html: ... }} />`.
* **Causa**: Al montarse la aplicación, `brandingConfig` es `null`, por lo que las variables CSS de marca (`--brand-primary`, `--brand-secondary`, `--sidebar-color`) no se declaran. Los componentes de Tailwind del contenido principal heredan los colores estándar del tema hidratado (`light1`), mientras que el sidebar o componentes corporativos, al no tener cargados sus estilos inline de marca, se visualizan transparentes o con colores residuales del DOM hasta que finaliza el ciclo asíncrono.
