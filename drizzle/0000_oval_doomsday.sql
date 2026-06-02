CREATE TABLE "crm_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"stage" varchar(50) DEFAULT 'nuevo' NOT NULL,
	"priority" varchar(50) DEFAULT 'media' NOT NULL,
	"assigned_to" varchar(255),
	"next_follow_up" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostic_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"airflow" integer,
	"dimensions" jsonb,
	"technical_observations" text,
	"material_suggestions" text,
	"inspection_protocol" text,
	"recommendations" text,
	"currency" varchar(10) DEFAULT 'COP' NOT NULL,
	"generated_pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"position" varchar(100),
	"city" varchar(100) NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"environment_type" varchar(100) NOT NULL,
	"urgency_level" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'nuevo' NOT NULL,
	"source" varchar(50) DEFAULT 'wizard' NOT NULL,
	"estimated_budget_min" integer,
	"estimated_budget_max" integer,
	"complexity_score" integer,
	"severity_score" integer,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "crm_activity_logs" ADD CONSTRAINT "crm_activity_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_pipeline" ADD CONSTRAINT "crm_pipeline_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_reports" ADD CONSTRAINT "diagnostic_reports_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;