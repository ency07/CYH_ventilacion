-- ==============================================================================
-- MIGRACIÓN 001: CRM ENTERPRISE (FASE 5)
-- Objetivo: Expandir el modelo básico a un CRM transaccional comercial real.
-- ==============================================================================

-- 1. ACTUALIZAR TABLA LEADS
-- Cambiar el default de la temperatura (risk_level) para ventas.
ALTER TABLE "leads" ALTER COLUMN "risk_level" SET DEFAULT 'COLD';
UPDATE "leads" SET "risk_level" = 'COLD' WHERE "risk_level" = 'LOW';
UPDATE "leads" SET "risk_level" = 'WARM' WHERE "risk_level" = 'MEDIUM';
UPDATE "leads" SET "risk_level" = 'HOT' WHERE "risk_level" = 'HIGH';

-- 2. GARANTIZAR CREACIÓN DE TABLAS DE GESTIÓN COMERCIAL (Por si Drizzle falló completamente en Fase 5)

CREATE TABLE IF NOT EXISTS "crm_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE cascade,
	"stage" varchar(50) DEFAULT 'nuevo' NOT NULL,
	"priority" varchar(20) DEFAULT 'media' NOT NULL,
	"assigned_to" varchar(255),
	"probability" integer DEFAULT 10 NOT NULL,
	"loss_reason" text,
	"pdf_sent" boolean DEFAULT false NOT NULL,
	"pdf_sent_at" timestamp,
	"next_follow_up" timestamp,
	"next_meeting" timestamp,
	"next_task" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "crm_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE cascade,
	"activity_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 3. ACTUALIZAR COLUMNAS SI LA TABLA YA EXISTÍA
-- (Evita errores si la tabla existía pero le faltaban las nuevas columnas)
ALTER TABLE "crm_pipeline" 
ADD COLUMN IF NOT EXISTS "probability" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "loss_reason" TEXT,
ADD COLUMN IF NOT EXISTS "pdf_sent" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "pdf_sent_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "next_follow_up" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "next_meeting" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "next_task" VARCHAR(255);

-- 4. ESTANDARIZAR ETAPAS
UPDATE "crm_pipeline" SET "stage" = 'diagnostico' WHERE "stage" = 'diagnosticado';
UPDATE "crm_pipeline" SET "stage" = 'propuesta_entregada' WHERE "stage" = 'propuesta';

-- NOTA DE EJECUCIÓN:
-- Copie y pegue este código en el SQL Editor de Supabase y ejecútelo.
-- Ninguna data actual se perderá, solo se agregarán propiedades.
