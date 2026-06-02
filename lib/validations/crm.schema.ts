import { z } from "zod";

export const LeadInsertSchema = z.object({
  fullName: z.string().min(2, "El nombre completo debe tener al menos 2 caracteres."),
  companyName: z.string().min(2, "La razón social debe tener al menos 2 caracteres."),
  email: z.string().email("El correo electrónico es inválido."),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres."),
  position: z.string().optional().nullable(),
  city: z.string().min(2, "La ciudad es obligatoria."),
  serviceType: z.enum(["fabricacion", "venta", "mantenimiento", "reparacion"]),
  environmentType: z.string().min(1, "El ambiente operativo es obligatorio."),
  urgencyLevel: z.enum(["baja", "media", "alta", "critica"]),
  status: z.enum(["nuevo", "contacto", "reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado", "perdido"]).default("nuevo"),
  source: z.string().default("wizard"),
  estimatedBudgetMin: z.number().optional().nullable(),
  estimatedBudgetMax: z.number().optional().nullable(),
  complexityScore: z.number().optional().nullable(),
  severityScore: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  leadScore: z.number().default(0),
  isVerified: z.boolean().default(false),
  riskLevel: z.string().default("LOW"),
});

export const DiagnosticInsertSchema = z.object({
  leadId: z.string().uuid("El Lead ID debe ser un UUID válido."),
  airflow: z.number().optional().nullable(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional().nullable(),
  technicalObservations: z.string().optional().nullable(),
  materialSuggestions: z.string().optional().nullable(),
  inspectionProtocol: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  currency: z.enum(["COP", "USD"]).default("COP"),
  generatedPdfUrl: z.string().optional().nullable(),
});

export const PipelineInsertSchema = z.object({
  leadId: z.string().uuid("El Lead ID debe ser un UUID válido."),
  stage: z.enum(["nuevo", "contacto", "reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado", "perdido"]).default("nuevo"),
  priority: z.enum(["baja", "media", "alta"]).default("media"),
  assignedTo: z.string().optional().nullable(),
  probability: z.number().default(10),
  lossReason: z.string().optional().nullable(),
  pdfSent: z.boolean().default(false),
  pdfSentAt: z.string().or(z.date()).optional().nullable(),
  nextFollowUp: z.string().or(z.date()).optional().nullable(),
  nextMeeting: z.string().or(z.date()).optional().nullable(),
  nextTask: z.string().optional().nullable(),
});

export const ActivityLogInsertSchema = z.object({
  leadId: z.string().uuid("El Lead ID debe ser un UUID válido."),
  activityType: z.enum([
    "lead_created",
    "report_generated",
    "call",
    "email",
    "proposal",
    "meeting",
    "visit",
    "technical",
    "status_changed"
  ]),
  description: z.string().min(1, "La descripción del log es obligatoria."),
});

export const VerificationInsertSchema = z.object({
  leadId: z.string().uuid(),
  otpCode: z.string().length(6),
  expiresAt: z.date(),
  verifiedAt: z.date().optional().nullable(),
  attempts: z.number().default(0),
  method: z.string().default("email"),
});
