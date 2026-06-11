Constitución Técnica CYH OS
Versión 1.0 – Arquitectura Empresarial, Seguridad y Resiliencia Operativa

Esta constitución define las reglas supremas de diseño, desarrollo, auditoría y operación del ecosistema.
Ningún módulo, componente, Server Action, migración, integración o funcionalidad podrá contradecir estos principios.

PILAR I
Arquitectura React Server Components (RSC) y Estado Persistente
Principio

La aplicación debe aprovechar la arquitectura nativa de Next.js para maximizar rendimiento, SEO, estabilidad y velocidad percibida.

Directrices Obligatorias
Toda pantalla de lectura de datos deberá implementarse prioritariamente mediante React Server Components (RSC).
Los Client Components sólo podrán utilizarse cuando exista una necesidad explícita de interactividad.
Se prohíbe cargar datos críticos mediante useEffect() cuando puedan resolverse en el servidor.
Los filtros, vistas y configuraciones de usuario deben persistirse mediante Query Parameters.

Ejemplo:

/crm/leads?view=table
/crm/leads?view=grid
Objetivo

Garantizar navegación instantánea, persistencia de estado y reducción del trabajo del navegador.

PILAR II
Integridad Relacional y Trazabilidad de Datos
Principio

Toda entidad empresarial debe mantener relaciones explícitas, tipadas y verificables.

Directrices Obligatorias

Queda prohibido:

reconstruir relaciones mediante texto plano
utilizar nombres de empresas como identificadores
enlazar registros mediante strings arbitrarios

Toda relación debe existir mediante:

UUID
Foreign Keys
Drizzle Relations

Las consultas deberán resolver entidades relacionadas mediante relaciones explícitas y tipadas.

Ejemplo:

lead.customerId
customer.id

No:

lead.companyName === customer.name
Objetivo

Eliminar datos huérfanos y garantizar consistencia empresarial.

PILAR III
Experiencia Visual por Rol
Principio

Cada usuario debe visualizar únicamente las herramientas relevantes para su función.

Directrices

La interfaz debe adaptarse dinámicamente según:

cliente
tecnico
comercial
director_comercial
admin

Ejemplos:

Técnicos no visualizan métricas financieras.
Clientes no visualizan CRM interno.
Comerciales no visualizan controles técnicos avanzados.
Importante

Este pilar es exclusivamente visual.

Nunca sustituye:

RBAC
RLS
validaciones backend
PILAR IV
Defensividad Operativa y Failsafe de Interfaz
Principio

La interfaz jamás debe romperse ante datos incompletos, corruptos o inesperados.

Directrices

Valores nulos deben renderizarse mediante estados seguros.

Ejemplos:

Valor no disponible
$0 COP
0 CFM
Sin información registrada

Nunca:

NaN
undefined
null
Regla Crítica

La UI no debe ocultar errores reales.

Los datos faltantes deben registrarse en logs de observabilidad.

PILAR V
Tipado Estricto e Inferencia de Dominio
Principio

El compilador debe detectar errores antes que el usuario.

Directrices

Prohibido:

any
unknown injustificado

Todas las Server Actions deben inferir tipos desde Drizzle.

Ejemplo:

typeof crmUsers.$inferSelect

Toda entrada externa debe validarse mediante:

Zod
TypeScript
Drizzle
PILAR VI
Consistencia Transaccional y Revalidación
Principio

Los cambios empresariales deben ser atómicos.

Directrices

Operaciones críticas:

ganar lead
aprobar propuesta
cambiar roles
generar cliente

deben ejecutarse dentro de:

db.transaction()

Tras cada mutación:

revalidatePath()

debe actualizar:

CRM
Dashboard
métricas
vistas relacionadas
Objetivo

Evitar inconsistencias visuales y corrupción lógica.

PILAR VII
Diseño Empresarial Siemens / ABB
Principio

La interfaz debe priorizar productividad y claridad.

Directrices

Características obligatorias:

alta densidad de información
tipografía Inter
fondos neutros
bordes discretos
jerarquía visual clara

Se prohíbe:

efectos innecesarios
sombras excesivas
animaciones decorativas
gradientes agresivos
PILAR VIII
Responsividad Universal y Anti-Cortes
Principio

Toda funcionalidad debe operar correctamente en dispositivos móviles industriales.

Directrices

Prohibido:

h-screen
overflow-hidden

cuando comprometan la interacción.

Se favorece:

h-auto
min-h-screen
overflow-y-auto

Los teclados móviles nunca podrán ocultar:

botones
formularios
acciones críticas
PILAR IX
Confianza Cero en la Capa de Datos
Principio

La seguridad no depende de la aplicación.

La base de datos debe protegerse a sí misma.

Directrices

Todas las tablas críticas deben tener:

RLS ENABLED

Las políticas deben validar:

tenant
usuario
rol
propiedad

Incluso si Next.js falla, PostgreSQL debe impedir accesos indebidos.

PILAR X
Auditoría Inmutable y Cumplimiento
Principio

Toda acción crítica debe dejar evidencia permanente.

Directrices

Registrar:

actor
timestamp
acción
entidad afectada
valores anteriores
valores nuevos
userAgent
IP informativa

Tabla obligatoria:

crm_audit_logs
Regla Crítica

Si el audit log falla:

ROLLBACK

de toda la operación.

Regla de Inmutabilidad

Se prohíbe:

UPDATE
DELETE

sobre auditorías históricas.

PILAR XI
Protección Anti-Abuso y Rate Limiting
Principio

Todo endpoint debe asumir comportamiento hostil.

Directrices

Protección obligatoria en:

leads públicos
cotizador
formularios
autenticación

Respuesta estándar:

429 Too Many Requests

cuando se excedan límites definidos.

Objetivo

Prevenir:

spam
abuso automatizado
crecimiento descontrolado
ataques lógicos
PILAR XII
Resiliencia Offline y Degradación Controlada
Principio

La aplicación debe seguir siendo utilizable bajo conectividad deficiente.

Directrices

Escenarios obligatorios:

Slow 3G
alta latencia
pérdida de red
reconexión

La aplicación debe:

mostrar estados de carga
permitir reintentos
informar errores claramente

Nunca:

Pantalla blanca
TypeError
Bloqueo total
Objetivo

Garantizar operación en entornos industriales reales.

PILAR XIII
Observabilidad y Diagnóstico Operativo
Principio

Ningún fallo crítico puede depender de la consola del navegador para ser detectado.

Directrices

Toda excepción debe generar telemetría.

Registrar:

errores de servidor
errores de cliente
excepciones no controladas
fallos de autenticación
consultas lentas
errores de integración

Herramientas recomendadas:

Sentry
OpenTelemetry
Grafana
PostHog
Objetivo

Responder rápidamente preguntas como:

¿Por qué falló?
¿Cuándo ocurrió?
¿A quién afectó?
¿Cuál fue la causa?
Principio Supremo de CYH OS

Antes de aprobar cualquier cambio, desarrollo, migración o refactorización, debe cumplirse la siguiente pregunta:

¿Esta implementación mejora o preserva la seguridad, integridad, trazabilidad, resiliencia, rendimiento y experiencia operativa del sistema sin violar ninguno de los trece pilares de la Constitución Técnica CYH OS?

Si la respuesta es no, la implementación debe ser rechazada o rediseñada.