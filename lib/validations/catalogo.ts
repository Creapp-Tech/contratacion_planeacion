import { z } from "zod"

export const catalogoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre")
    .max(150, "El nombre es demasiado largo"),
  descripcion: z
    .string()
    .trim()
    .max(300, "La descripción es demasiado larga"),
})

export type CatalogoInput = z.infer<typeof catalogoSchema>
