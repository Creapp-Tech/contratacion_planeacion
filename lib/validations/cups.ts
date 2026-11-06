import { z } from "zod"

const idOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().uuid("Identificador inválido").nullable()
)

const textoOpcional = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional()

const fechaSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")

const fechaOpcional = fechaSchema.or(z.literal("")).optional()

export const codigoSchema = z.string()
  .trim()
  .min(6, "El código debe tener 6 dígitos")
  .max(6, "El código debe tener 6 dígitos")
  .regex(/^\d{6}$/, "El código debe contener solo números")

export const cupsSchema = z.object({
  codigo: codigoSchema,
  nombre: z.string().trim().min(1, "Ingresa el nombre"),
  descripcion: textoOpcional,
  capitulo: textoOpcional,
  seccion: textoOpcional,
  extra_vii: textoOpcional,
  extra_viii: textoOpcional,
  extra_ix: textoOpcional,
  grupo_id: idOpcional,
  servicio_id: idOpcional,
  version_resolucion: z.string().trim().min(1, "Ingresa la versión de la resolución"),
  fecha_inicio: fechaSchema,
  fecha_fin: fechaOpcional,
  activo: z.boolean().default(true),
})

export type CupsInput = z.input<typeof cupsSchema>
export type CupsOutput = z.output<typeof cupsSchema>
