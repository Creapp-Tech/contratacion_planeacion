import { z } from "zod"

const idOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().uuid("Identificador inválido").nullable()
)

export const duracionMinutosSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null
    if (typeof value === "string") {
      const limpio = value.trim()
      if (limpio === "") return null
      return Number(limpio)
    }
    return value
  },
  z
    .number()
    .int("La duración debe ser un número entero")
    .min(1, "La duración mínima es 1 minuto")
    .max(1440, "La duración máxima es 1440 minutos")
    .nullable()
)

export const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del servicio")
    .max(200, "El nombre es demasiado largo"),
  grupo_id: idOpcional,
  area_id: idOpcional,
  duracion_minutos: duracionMinutosSchema,
  tipo_personal: z
    .string()
    .trim()
    .min(1, "Selecciona el tipo de personal")
    .max(150, "El tipo de personal es demasiado largo"),
})

export type ServicioInput = z.input<typeof servicioSchema>
export type ServicioOutput = z.output<typeof servicioSchema>