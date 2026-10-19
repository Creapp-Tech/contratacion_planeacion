import { z } from "zod"

export const areaSchema = z.object({
  categoria: z
    .string()
    .trim()
    .min(1, "Selecciona el grupo")
    .max(100, "El grupo es demasiado largo"),
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del área")
    .max(150, "El nombre es demasiado largo"),
  medida: z
    .number({ error: "Ingresa una medida válida" })
    .int("La medida debe ser un número entero")
    .min(1, "La medida debe ser al menos 1"),
  mide_capacidad_ocupacion: z.boolean(),
})

export type AreaInput = z.infer<typeof areaSchema>
