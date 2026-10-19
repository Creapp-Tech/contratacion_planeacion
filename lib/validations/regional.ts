import { z } from "zod"

export const regionalSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre de la regional")
    .max(100, "El nombre es demasiado largo"),
})

export type RegionalInput = z.infer<typeof regionalSchema>
