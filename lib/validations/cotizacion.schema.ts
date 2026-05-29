import { z } from "zod";

export const ServiceSelectionSchema = z.object({
  service: z.enum(["fabricacion", "venta", "mantenimiento", "reparacion"], {
    required_error: "Debe seleccionar un servicio para continuar.",
  }),
});

export const FlowCalculatorSchema = z.object({
  length: z
    .number({ invalid_type_error: "El largo debe ser un valor numérico" })
    .positive("El largo debe ser mayor a 0")
    .max(1000, "El largo máximo permitido es de 1000 metros"),
  width: z
    .number({ invalid_type_error: "El ancho debe ser un valor numérico" })
    .positive("El ancho debe ser mayor a 0")
    .max(1000, "El ancho máximo permitido es de 1000 metros"),
  height: z
    .number({ invalid_type_error: "La altura debe ser un valor numérico" })
    .positive("La altura debe ser mayor a 0")
    .max(100, "La altura máxima permitida es de 100 metros"),
  environment: z.string({
    required_error: "Debe seleccionar un ambiente operativo.",
  }).min(1, "Debe seleccionar un ambiente operativo."),
});

export const SymptomsSchema = z.object({
  // Vectores Mantenimiento
  preventivo: z.boolean().default(false).optional(),
  eficiencia: z.boolean().default(false).optional(),
  desgaste: z.boolean().default(false).optional(),
  vibracion_sutil: z.boolean().default(false).optional(),
  consumo: z.boolean().default(false).optional(),
  monitoreo: z.boolean().default(false).optional(),

  // Vectores Reparación
  falla_critica: z.boolean().default(false).optional(),
  no_enciende: z.boolean().default(false).optional(),
  humo: z.boolean().default(false).optional(),
  falla_electrica: z.boolean().default(false).optional(),
  ruido_severo: z.boolean().default(false).optional(),
  danos_estructurales: z.boolean().default(false).optional(),
});

export const LeadFormSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre de contacto es obligatorio." })
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre de contacto es demasiado largo."),
  empresa: z
    .string({ required_error: "La razón social de la empresa es obligatoria." })
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres.")
    .max(100, "El nombre de la empresa es demasiado largo."),
  cargo: z
    .string({ required_error: "El cargo del solicitante es obligatorio." })
    .min(2, "El cargo debe tener al menos 2 caracteres.")
    .max(100, "El cargo es demasiado largo."),
  telefono: z
    .string({ required_error: "El teléfono corporativo es obligatorio." })
    .min(6, "El número de teléfono debe contener al menos 6 dígitos.")
    .max(30, "El número de teléfono es demasiado largo.")
    .regex(/^[\d\s+\-()]+$/, "El formato del teléfono no es válido (solo números, espacios o caracteres + - () )."),
  email: z
    .string({ required_error: "El correo electrónico es obligatorio." })
    .email("Utilice un correo electrónico válido para recibir el diagnóstico técnico y seguimiento de ingeniería."),
  ciudad: z
    .string({ required_error: "La ciudad/región es obligatoria." })
    .min(2, "Especifique una ciudad o región válida.")
    .max(100, "La ciudad es demasiado larga."),
  urgencia: z.enum(["baja", "media", "alta"], {
    required_error: "Debe clasificar la urgencia operativa del requerimiento.",
  }),
});
