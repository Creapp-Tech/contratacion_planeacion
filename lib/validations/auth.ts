import { z } from "zod"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * El campo "usuario" acepta un nombre de usuario simple o un correo.
 * Si contiene "@", debe tener formato de correo válido.
 */
export const loginSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(64, "El usuario es demasiado largo")
    .refine(
      (value) => !value.includes("@") || EMAIL_REGEX.test(value),
      "Ingresa un usuario o correo electrónico válido"
    ),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128, "La contraseña es demasiado larga"),
  redirectTo: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
