import { z } from "zod"

export const planeacionSchema = z.object({
  regional: z.string().nullish(),
  poblacion: z.coerce.number().nullish(),
  nombre: z.string().min(1, "Nombre requerido"),
  version: z.string().nullish(),
  regimen: z.string().nullish(),
  asegurador: z.string().nullish(),
  tiene_nota_tecnica: z.boolean(),
  frecuencias_referencia: z.array(z.string()),
  servicios_seleccionados: z.array(
    z.object({
      grupo_id: z.string(),
      servicio_id: z.string(),
      valor_frecuencia: z.string().optional(),
      checked: z.boolean(),
    })
  ),
})

export type PlaneacionFormValues = z.infer<typeof planeacionSchema>
