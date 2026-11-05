import { z } from "zod"

const idOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().uuid("Identificador inválido").nullable()
)

export const codigoSchema = z.string()
  .trim()
  .min(6, "El código debe tener 6 dígitos")
  .max(6, "El código debe tener 6 dígitos")
  .regex(/^\d{6}$/, "El código debe contener solo números")

export const cupsSchema = z.object({
  codigo: codigoSchema,
  descripcion: z.string().trim().min(1, "Ingresa la descripción"),
  grupo_id: idOpcional,
  servicio_id: idOpcional,
  seccion: z.string().trim().min(1, "Ingresa la sección"),
  version_resolucion: z.string().trim().min(1, "Ingresa la versión de la resolución"),
  fecha_inicio: z.date(),
  fecha_fin: z.date().optional(),
  activo: z.boolean().default(true),
})

export type CupsInput = z.input<typeof cupsSchema>
export type CupsOutput = z.output<typeof cupsSchema>
