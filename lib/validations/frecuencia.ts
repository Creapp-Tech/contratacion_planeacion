import { z } from "zod"

import { TIPO_FRECUENCIA_VALUES } from "@/lib/frecuencias/tipos"

const decimalRequerido = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : Number(value),
  z
    .number({ error: "Ingresa un valor numérico válido" })
    .nonnegative("No puede ser negativo")
)

export const frecuenciaServicioSchema = z.object({
  servicio_id: z.string().uuid("Selecciona el servicio"),
  frecuencia: decimalRequerido,
})

export const frecuenciaSchema = z.object({
  tipo_frecuencia: z.enum(TIPO_FRECUENCIA_VALUES, {
    error: "Selecciona el tipo de frecuencia",
  }),
  nombre_nota_tecnica: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre de la nota técnica")
    .max(200, "El nombre de la nota técnica es demasiado largo"),
  sede_id: z.string().uuid("Selecciona la sede"),
  regimen_id: z.string().uuid("Selecciona el régimen"),
  asegurador_eps_id: z.string().uuid("Selecciona el asegurador"),
  version: z
    .string()
    .trim()
    .min(1, "Ingresa la versión")
    .max(50, "La versión es demasiado larga")
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Solo letras, números, punto, guion y guion bajo"),
  servicios: z
    .array(frecuenciaServicioSchema)
    .min(1, "Agrega al menos un servicio")
    .refine(
      (servicios) =>
        new Set(servicios.map((servicio) => servicio.servicio_id)).size ===
        servicios.length,
      "No puedes repetir el mismo servicio"
    ),
})

export const frecuenciaServicioEditarSchema = z.object({
  frecuencia: decimalRequerido,
})

export type FrecuenciaInput = z.input<typeof frecuenciaSchema>
export type FrecuenciaOutput = z.output<typeof frecuenciaSchema>
export type FrecuenciaServicioInput = z.input<typeof frecuenciaServicioSchema>
export type FrecuenciaServicioEditarInput = z.input<
  typeof frecuenciaServicioEditarSchema
>
