# Auditoría Quirúrgica: Colisión de Branding y Sistema de Temas (VentiTech OS)

Este documento detalla la investigación exacta sobre cómo interactúan el sistema de **Branding del Tenant** y el **Sistema de Temas** en la interfaz de la aplicación, confirmando la causa raíz de la degradación visual en los módulos de Comercial, Operaciones, Gestión y Administración al cambiar de tema.

---

## 1. Mapeo de Componentes y Variables

### A. Componentes que usan `brandingConfig.sidebarColor`
* **[CrmShell.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/CrmShell.tsx)**
  * Línea 233: Declaración del estado local `sidebarColor: string`.
  * Línea 252: Asignación del valor de base de datos `sidebarColor: res.data.branding.sidebarColor`.
  * Línea 324: Declaración de la variable CSS `--sidebar-color`.
  * Línea 327: Inyección forzada en el elemento `aside`: `aside { background-color: ${brandingConfig.sidebarColor} !important; }`.
* **[ConfiguracionClient.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/configuracion/ConfiguracionClient.tsx)**
  * Líneas 35, 45, 55, 65, 75, 85: Valores preestablecidos para presets de color.
  * Línea 121: Estado local de configuración `const [sidebarColor, setSidebarColor] = useState(...)`.
  * Línea 975: Previsualización del sidebar en vivo con estilo inline: `style={{ backgroundColor: sidebarColor, ... }}`.
* **[ConfigForm.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/ops/configuracion/ConfigForm.tsx)**
  * Líneas 37, 46, 55, 64, 73, 82: Mapeo de presets.
  * Línea 555: Caja de previsualización del panel operacional: `style={{ backgroundColor: branding.sidebarColor, ... }}`.

---

### B. Componentes que usan Variables del Tema (`dark1`, `light1`, etc.)
* **[Navbar.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/components/layout/Navbar.tsx)**
  * Líneas 84-85: Usa `text-text-secondary` y `hover:text-text-primary` (mapeadas a `--text-secondary` y `--text` del tema de la Web Pública).
* **[CrmShell.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/CrmShell.tsx)**
  * Líneas 409-411: Los enlaces de navegación del sidebar usan `text-text-secondary hover:bg-bg-tertiary hover:text-text-primary`. Estas clases Tailwind se alimentan directamente de las variables CSS de tema (`--text-secondary`, `--card`, `--text`).
* **[PortalClient.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/portal/inicio/PortalClient.tsx)**
  * Usan clases de color semántico de Tailwind como `bg-bg-primary`, `text-text-primary`, `border-border-subtle` en todo el cuerpo de las pestañas operacionales.

---

### C. Componentes que Mezclan Ambos Sistemas
La mezcla crítica se localiza en los cascos principales de la aplicación:
* **[CrmShell.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/CrmShell.tsx)** (Shell del CRM - Comercial, Operaciones, Gestión, Admin)
  * El contenedor lateral `aside` es forzado con `!important` a usar el color estático de la marca (`brandingConfig.sidebarColor`).
  * Los textos y hover states de ese mismo sidebar (`text-text-secondary`, `hover:bg-bg-tertiary`) usan variables dinámicas del tema de `next-themes`.
* **[PortalClient.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/portal/inicio/PortalClient.tsx)** (Portal del Cliente)
  * La cabecera `header` recibe un fondo estático inyectado con `brandingConfig.portalColor` y bordes de `brandingConfig.primaryColor`.
  * Los menús y botones internos usan clases de Tailwind que varían según el tema del portal (`light1`/`dark1`).

---

## 2. Origen de los Estilos Inyectados

### Estilos Inyectados vía `<style dangerouslySetInnerHTML>`
* **[CrmShell.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/crm/CrmShell.tsx)** (Líneas 315-339):
  ```css
  :root {
    --brand-primary: ${brandingConfig.primaryColor};
    --brand-secondary: ${brandingConfig.secondaryColor};
    --brand-logo: url('${brandingConfig.logoUrl || '/logo-text.png'}');
    --primary-color: ${brandingConfig.primaryColor};
    --secondary-color: ${brandingConfig.secondaryColor};
    --btn-color: ${brandingConfig.btnColor};
    --sidebar-color: ${brandingConfig.sidebarColor};
  }
  aside {
    background-color: ${brandingConfig.sidebarColor} !important;
  }
  .bg-accent-cyan { background-color: ${brandingConfig.btnColor} !important; }
  .text-accent-cyan { color: ${brandingConfig.btnColor} !important; }
  .border-accent-cyan { border-color: ${brandingConfig.btnColor} !important; }
  ```

* **[PortalClient.tsx](file:///c:/Users/Administrator/Desktop/CYH-VI/app/portal/inicio/PortalClient.tsx)** (Líneas 762-788):
  Inyecta variables similares pero dirigidas a `.bg-accent-emerald`, `.text-accent-emerald`, `.border-accent-emerald`, y fuerza el fondo del `header` a `brandingConfig.portalColor`.

### Estilos provenientes de Tailwind
* Todo el maquetado estructural del contenido principal de las páginas (`app/crm/leads`, `app/crm/oportunidades`, `app/crm/actividades`, etc.) usa clases de utilidad estándar de Tailwind:
  - `bg-bg-primary`, `bg-bg-secondary`
  - `text-text-primary`, `text-text-secondary`
  - `border-border-subtle`
  - `bg-accent-cyan/10`, `text-accent-cyan`

### Estilos provenientes de `globals.css`
* **[globals.css](file:///c:/Users/Administrator/Desktop/CYH-VI/app/globals.css)** (Líneas 5-136):
  Define las variables de tema `--bg`, `--surface`, `--card`, `--text`, y `--border` para cada clase específica (`.light1`, `.light2`, `.light3`, `.dark1`, `.dark2`, `.dark3`).

---

## 3. Confirmación de Causa de Ruptura (Comercial, Operaciones, Gestión, Admin)

La auditoría **confirma plenamente** que la mezcla de ambos sistemas es la causa raíz de que la interfaz se rompa al alternar entre temas claros y oscuros:

### Mecanismo de Falla Visual (Módulo Inlegible)

1. **Fondo de Marca Estático vs. Textos de Tema Dinámicos**:
   - Supongamos que el administrador configuró un branding corporativo con un fondo de sidebar oscuro (`#0b0f19`).
   - Si el usuario del CRM selecciona el tema **Clásico VentiTech (Claro, `light1`)**:
     - El sidebar sigue siendo oscuro (`#0b0f19`) por la regla `!important` del branding.
     - Pero los enlaces de navegación del menú (Comercial, Operaciones, etc.) se renderizan con `text-text-secondary`, que en el tema claro evalúa a un gris oscuro (`#4B5563`).
     - **Resultado**: Texto gris oscuro sobre fondo negro. Los módulos se vuelven **ilegibles y visualmente rotos**.

2. **Fondo de Marca Claro vs. Textos de Tema Claros**:
   - Supongamos ahora un branding con fondo de sidebar claro (blanco `#FFFFFF`).
   - Si el usuario del CRM selecciona el tema **Espacio Profundo (Oscuro, `dark1`)**:
     - El sidebar se mantiene blanco (`#FFFFFF`).
     - Los textos del menú se renderizan con `text-text-secondary` del tema oscuro, que evalúa a un gris claro/blanco (`#D1D5DB`).
     - **Resultado**: Texto gris claro/blanco sobre fondo blanco. Las secciones desaparecen visualmente.

### Conclusión
Los módulos de Comercial, Operaciones, Gestión y Administración se rompen porque **el color del contenedor principal (sidebar/header) es estático (Branding) mientras que el color de sus elementos hijos (textos/bordes/hovers) es dinámico (Tema)**.
