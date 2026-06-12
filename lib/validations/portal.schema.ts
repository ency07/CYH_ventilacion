import { z } from "zod";

export const RequestServiceSchema = z.object({
  title: z.string().min(3, "El asunto debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción del problema debe tener al menos 10 caracteres."),
  urgency: z.enum(["baja", "media", "alta", "critica"]),
  plantId: z.string().uuid("ID de planta inválido.").optional().nullable(),
  newPlantName: z.string().optional().nullable(),
  city: z.string().optional().nullable(), // required only when newPlantName is supplied
  serviceType: z.string().optional().nullable(),
  operationalImpact: z.string().optional().nullable(),
  affectedAsset: z.string().optional().nullable(),
  assetId: z.string().uuid("ID de activo inválido.").optional().nullable(),
});

export type RequestServiceInput = z.infer<typeof RequestServiceSchema>;
