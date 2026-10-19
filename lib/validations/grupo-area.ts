import { z } from "zod"

export const grupoAreaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del grupo")
    .max(100, "El nombre es demasiado largo"),
})

export type GrupoAreaInput = z.infer<typeof grupoAreaSchema>
