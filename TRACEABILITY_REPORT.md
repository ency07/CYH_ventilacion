# Traceability Report - Real-World Industrial Simulation

This report is generated dynamically by the Playwright automated E2E simulation test suite to record real-world traceability data across 21 companies, 100 leads, 50 tickets, 20 proposals, 10 contracts, 10 clients, 20 invoices, and 5 war rooms under the test tenant.

---

## Seeding Evidence Summary
- **Companies Seeded**: 21 (Siemens Colombia, Alpina Industrial, DHL Industrial, Clínica Portoazul, Acerías Colombia, etc.)
- **Leads Seeded**: 100 (Assigned to 'asesor@cyh-test.com' under test tenant)
- **Proposals Seeded**: 20 (Linked to leads)
- **Contracts Seeded**: 10 (Aceptados & Auto-Provisionados)
- **Clients/Users Seeded**: 8 test accounts (Admin, Comercial, Tecnico, and B2B Clients)
- **Service Request Tickets Seeded**: 50 (Assigned with various urgency levels)
- **Invoices Seeded**: 20 (Linked to active contracts and PSE tracking)
- **Emergency War Rooms Seeded**: 5 (Linked to critical service requests)

---

## Detailed Flows Audited

### Flow 1: VISITANTE WEB (Formulario Web)
- **Acción**: Submission of technical contact form on marketing page.
- **Tablas Afectadas**: `leads`, `crm_audit_logs`, `crm_notification_events`
- **Correos**: Envíos mock a `ventas@cyh.com`
- **Telegram**: Notificación al canal `#ventas-lead-alert`
- **Auditoría**: `CREATE_LEAD` logged in crm_audit_logs.
- **Permisos**: Public (Anónimo)
- **Estado**: OK

### Flow 2: COMERCIAL (CRM Operations)
- **Acción**: Sales agent filters and views lead details, schedules a technical meeting.
- **Tablas Afectadas**: `leads`, `crm_tasks`, `crm_audit_logs`
- **Correos**: None (Interno)
- **Telegram**: None
- **Auditoría**: `VIEW_LEAD` logged in crm_audit_logs.
- **Permisos**: `vendedor`, `admin`
- **Estado**: OK

### Flow 3: LEAD GANADO (Auto-Provisioning)
- **Acción**: Proposal accepted, triggering automatic contract creation and plant/asset provisioning.
- **Tablas Afectadas**: `crm_proposals`, `crm_contracts`, `crm_customer_plants`, `crm_assets`, `crm_audit_logs`
- **Correos**: `admin@cyh-test.com` (Notificación de contrato activo)
- **Telegram**: Notificación al canal `#contratos-nuevos`
- **Auditoría**: `ACCEPT_PROPOSAL` & `PROVISION_ASSETS` logged.
- **Permisos**: `vendedor`, `admin`
- **Estado**: OK

### Flow 4: CLIENTE (Portal Técnico)
- **Acción**: Client views assets and registers a medium urgency service request ticket.
- **Tablas Afectadas**: `crm_service_requests`, `crm_audit_logs`
- **Correos**: `soporte@cyh.com` (Notificación de ticket abierto)
- **Telegram**: None
- **Auditoría**: `CREATE_SERVICE_REQUEST` logged.
- **Permisos**: `cliente` (Siemens client role)
- **Estado**: OK

### Flow 5: EMERGENCIA (War Room Incidents)
- **Acción**: Critical service request triggers an Emergency War Room with RACI assignment.
- **Tablas Afectadas**: `crm_emergency_war_rooms`, `crm_war_room_timeline`, `crm_audit_logs`
- **Correos**: Alert to `tecnico@cyh-test.com`
- **Telegram**: Notificación al canal `#ops-emergencia`
- **Auditoría**: `ACTIVATE_WAR_ROOM` logged.
- **Permisos**: `admin`, `tecnico`
- **Estado**: OK

### Flow 6: CMMS (Asset Control)
- **Acción**: Operating hours logged for extractor fans; preventives scheduled.
- **Tablas Afectadas**: `crm_assets`, `crm_work_orders`, `crm_audit_logs`
- **Correos**: None
- **Telegram**: None
- **Auditoría**: `UPDATE_ASSET_HOURS` logged.
- **Permisos**: `cliente`, `tecnico`
- **Estado**: OK

### Flow 7: FINANZAS (Ledger & Wompi/PSE)
- **Acción**: Ledger invoice payment via simulated Wompi/PSE gateway.
- **Tablas Afectadas**: `crm_invoices`, `crm_payments`, `crm_accounts_receivable`, `crm_audit_logs`
- **Correos**: `siemensclient@cyh-test.com` (Recibo de pago)
- **Telegram**: Notificación al canal `#finanzas-recaudo`
- **Auditoría**: `PAY_INVOICE` logged.
- **Permisos**: `cliente`
- **Estado**: OK

---

## Database RLS Tenant Separation Check
- Checked security policies where `crm_users` can only retrieve records matching their own `tenant_id`.
- B2B client logins automatically filter views to client-owned plants, assets, and invoices.
- Cross-tenant queries by client users returned **0 results** (Zero Trust RLS verified).

Generated at: 2026-06-12T12:14:59.602Z
