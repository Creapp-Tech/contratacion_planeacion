import { z } from "zod"

export const loginSchema = z.object({
  usuario: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(64, "El usuario es demasiado largo"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128, "La contraseña es demasiado larga"),
})

export type LoginInput = z.infer<typeof loginSchema>
