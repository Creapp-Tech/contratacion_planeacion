import { z } from "zod"

export const grupoServicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del grupo")
    .max(100, "El nombre es demasiado largo"),
})

export type GrupoServicioInput = z.infer<typeof grupoServicioSchema>
