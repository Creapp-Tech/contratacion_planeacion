import { z } from "zod"

import { ESTADO_VALUES, ROL_VALUES } from "@/lib/constants/roles"

const nombreCompleto = z
  .string()
  .min(3, "Ingresa el nombre completo")
  .max(120, "El nombre es demasiado largo")

const telefono = z.string().max(30, "El teléfono es demasiado largo").optional()

const rol = z.enum(ROL_VALUES)

const regionalId = z
  .union([z.string().uuid("Regional inválida"), z.literal("")])
  .nullable()
  .optional()

export const crearUsuarioSchema = z
  .object({
    email: z.string().email("Ingresa un correo válido"),
    nombre_completo: nombreCompleto,
    telefono,
    rol,
    regional_id: regionalId,
    estado: z.enum(ESTADO_VALUES),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .refine((data) => data.rol !== "gerente_regional" || !!data.regional_id, {
    message: "La regional es obligatoria para el rol Gerente regional",
    path: ["regional_id"],
  })

export const actualizarUsuarioSchema = z
  .object({
    nombre_completo: nombreCompleto,
    telefono,
    rol,
    regional_id: regionalId,
    estado: z.enum(ESTADO_VALUES),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .or(z.literal(""))
      .optional(),
  })
  .refine((data) => data.rol !== "gerente_regional" || !!data.regional_id, {
    message: "La regional es obligatoria para el rol Gerente regional",
    path: ["regional_id"],
  })

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>
