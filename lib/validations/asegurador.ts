import { z } from "zod"

export const aseguradorSchema = z.object({
  nombre_eps: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del asegurador")
    .max(150, "El nombre es demasiado largo"),
})

export type AseguradorInput = z.infer<typeof aseguradorSchema>
