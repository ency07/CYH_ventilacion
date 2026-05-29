 
# CYH OS ARCHITECTURE

━━━━━━━━━━━━━━━━━━━

# PROJECT STRUCTURE

━━━━━━━━━━━━━━━━━━━

CYH OS utiliza arquitectura modular escalable.

Stack:

* Next.js App Router
* TypeScript
* Tailwind
* Server Actions
* Supabase
* Drizzle ORM

━━━━━━━━━━━━━━━━━━━

# FOLDER STRUCTURE

━━━━━━━━━━━━━━━━━━━

/app
/components
/lib
/types
/public
/styles
/docs
/drizzle
/supabase

━━━━━━━━━━━━━━━━━━━

# APP ROUTER STRUCTURE

━━━━━━━━━━━━━━━━━━━

app/
│
├── (marketing)/
│   ├── page.tsx
│   ├── quienes-somos/
│   ├── servicios/
│   ├── proyectos/
│   └── contacto/
│
├── cotizador/
│   ├── page.tsx
│   ├── resultado/
│   └── loading.tsx
│
├── admin/
│
├── api/
│
├── globals.css
├── layout.tsx
└── not-found.tsx

━━━━━━━━━━━━━━━━━━━

# COMPONENT STRUCTURE

━━━━━━━━━━━━━━━━━━━

components/
│
├── marketing/
├── wizard/
├── dashboard/
├── ui/
├── layout/
├── shared/
└── 3d/

━━━━━━━━━━━━━━━━━━━

# COMPONENT RULES

━━━━━━━━━━━━━━━━━━━

Todos los componentes deben ser:

* pequeños
* reutilizables
* desacoplados
* typed
* testeables

PROHIBIDO:

* componentes gigantes
* lógica mezclada
* estilos inline
* fetch dentro de UI components

━━━━━━━━━━━━━━━━━━━

# NAMING CONVENTIONS

━━━━━━━━━━━━━━━━━━━

Componentes:
PascalCase

Ejemplo:
HeroSection.tsx

━━━━━━━━━━━━━━━━━━━

Hooks:
camelCase + use

Ejemplo:
useWizardStore.ts

━━━━━━━━━━━━━━━━━━━

Utils:
camelCase

Ejemplo:
calculateFlowRate.ts

━━━━━━━━━━━━━━━━━━━

Server Actions:
action suffix

Ejemplo:
submitQuoteAction.ts

━━━━━━━━━━━━━━━━━━━

# FRONTEND/BACKEND SEPARATION

━━━━━━━━━━━━━━━━━━━

Frontend:

* UI
* forms
* animations
* client interactions

Backend:

* validations
* calculations
* database
* emails
* integrations

PROHIBIDO:
mezclar lógica backend en componentes UI.

━━━━━━━━━━━━━━━━━━━

# STATE MANAGEMENT

━━━━━━━━━━━━━━━━━━━

Prioridad:

1. local state
2. context
3. Zustand SOLO si es necesario

NO usar Redux.

━━━━━━━━━━━━━━━━━━━

# FORM ARCHITECTURE

━━━━━━━━━━━━━━━━━━━

Forms:

* React Hook Form
* Zod
* controlled validation
* reusable inputs

━━━━━━━━━━━━━━━━━━━

# VALIDATION ARCHITECTURE

━━━━━━━━━━━━━━━━━━━

Todas las validaciones viven en:

/lib/validations

Ejemplo:

/lib/validations/cotizacion.schema.ts

━━━━━━━━━━━━━━━━━━━

# CALCULATION ARCHITECTURE

━━━━━━━━━━━━━━━━━━━

Todos los cálculos viven en:

/lib/calculations

IMPORTANTE:

Los cálculos reales NO se exponen al frontend.

El frontend SOLO recibe:

* categorías
* recomendaciones
* rangos

━━━━━━━━━━━━━━━━━━━

# API ARCHITECTURE

━━━━━━━━━━━━━━━━━━━

Usar:

* Route Handlers
  o
* Server Actions

Preferencia:
Server Actions.

━━━━━━━━━━━━━━━━━━━

# DATABASE ARCHITECTURE

━━━━━━━━━━━━━━━━━━━

Database:
Supabase PostgreSQL

ORM:
Drizzle ORM

━━━━━━━━━━━━━━━━━━━

Tablas principales futuras:

* leads
* lead_status
* projects
* admin_users
* audit_logs

━━━━━━━━━━━━━━━━━━━

# SERVER ACTIONS RULES

━━━━━━━━━━━━━━━━━━━

Todas las server actions deben:

* validar con Zod
* manejar errores
* retornar typed responses
* usar try/catch
* loggear errores

━━━━━━━━━━━━━━━━━━━

# PERFORMANCE RULES

━━━━━━━━━━━━━━━━━━━

Obligatorio:

* lazy loading
* suspense
* dynamic imports
* image optimization
* bundle splitting

━━━━━━━━━━━━━━━━━━━

# SEO RULES

━━━━━━━━━━━━━━━━━━━

Cada página debe incluir:

* metadata
* OpenGraph
* semantic HTML
* accessibility

━━━━━━━━━━━━━━━━━━━

# ACCESSIBILITY RULES

━━━━━━━━━━━━━━━━━━━

Objetivo:
WCAG AA

Obligatorio:

* aria labels
* keyboard navigation
* contrast correcto
* focus states visibles

━━━━━━━━━━━━━━━━━━━

# SECURITY RULES

━━━━━━━━━━━━━━━━━━━

PROHIBIDO:

* secrets hardcoded
* keys en frontend
* SQL raw inseguro

Usar:

* env variables
* server-side validation
* sanitización

━━━━━━━━━━━━━━━━━━━

# ANIMATION RULES

━━━━━━━━━━━━━━━━━━━

Animaciones:

* Framer Motion
* sutiles
* técnicas
* performance-first

━━━━━━━━━━━━━━━━━━━

# RESPONSIVE STRATEGY

━━━━━━━━━━━━━━━━━━━

Desktop-first.

Prioridad UX:

1. Desktop industrial
2. Tablet
3. Mobile

━━━━━━━━━━━━━━━━━━━

# DEPLOYMENT

━━━━━━━━━━━━━━━━━━━

Hosting:
Vercel

Database:
Supabase

Assets:
Cloudflare R2 (futuro)

━━━━━━━━━━━━━━━━━━━

# LONG TERM GOALS

━━━━━━━━━━━━━━━━━━━

Futuras integraciones:

* OpenAI diagnostics
* AR preview
* real-time dashboard
* analytics
* predictive maintenance
* PDF engineering reports
* WhatsApp automation
* lead scoring
* heatmaps
* industrial intelligence
