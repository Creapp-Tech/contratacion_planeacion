import { z } from "zod"

const poblacionEntera = (campo: string) =>
  z
    .number({ error: `Ingresa ${campo}` })
    .int(`${campo} debe ser un número entero`)
    .min(0, `${campo} no puede ser negativa`)

export const poblacionSchema = z.object({
  sede_id: z.string().uuid("Selecciona una sede"),
  asegurador_eps_id: z.string().uuid("Selecciona un asegurador"),
  regimen_id: z.string().uuid("Selecciona un régimen"),
  poblacion_activa: poblacionEntera("la población activa"),
  poblacion_pagada: poblacionEntera("la población pagada"),
  poblacion_certificada: poblacionEntera("la población certificada"),
  fecha_actualizacion: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha de actualización"),
})

export type PoblacionInput = z.infer<typeof poblacionSchema>
