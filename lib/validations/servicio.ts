import { z } from "zod"

const textoOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().trim().max(150).nullable()
)

const areaIdOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().uuid("Área inválida").nullable()
)

export const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del servicio")
    .max(200, "El nombre es demasiado largo"),
  grupo: textoOpcional,
  area_id: areaIdOpcional,
  tipo_personal: z
    .string()
    .trim()
    .min(1, "Selecciona el tipo de personal")
    .max(150, "El tipo de personal es demasiado largo"),
})

export type ServicioInput = z.input<typeof servicioSchema>
export type ServicioOutput = z.output<typeof servicioSchema>