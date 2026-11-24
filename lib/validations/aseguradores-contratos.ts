import { z } from "zod"

import { CAMPOS_OPCION } from "@/lib/aseguradores-contratos/constantes"

const uuidOpcional = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.string().uuid("Selecciona una opción válida").nullable()
)

const numeroOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Ingresa un número válido" })
    .min(0, "El valor no puede ser negativo")
    .nullable()
)

const numeroRequerido = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? NaN : Number(value)),
  z
    .number({ error: "Ingresa un valor válido" })
    .min(0, "El valor no puede ser negativo")
)

export const servicioCupsSchema = z.object({
  asegurador_id: z.string().uuid("Selecciona un asegurador"),
  contrato_id: z.string().uuid("Selecciona un contrato"),
  cups_asegurador: z
    .string()
    .trim()
    .min(2, "Ingresa el CUPS del asegurador")
    .max(200, "El CUPS del asegurador es demasiado largo"),
  cups_id: uuidOpcional,
  frecuencia_uso_contratada: numeroOpcional,
  cme_contratado: numeroRequerido,
  primera_opcion_especialista_id: uuidOpcional,
  segunda_opcion_especialista_id: uuidOpcional,
})

export const editarCmeSchema = z.object({
  id: z.string().uuid("Registro inválido"),
  cme_contratado: numeroRequerido,
})

export const editarOpcionSchema = z.object({
  id: z.string().uuid("Registro inválido"),
  campo: z.enum(CAMPOS_OPCION, "Campo no permitido"),
  especialista_id: uuidOpcional,
})

export const cambioMasivoSchema = z.object({
  ids: z
    .array(z.string().uuid("Registro inválido"))
    .min(1, "Selecciona al menos un servicio")
    .max(200, "Máximo 200 servicios por operación"),
  campo: z.enum(CAMPOS_OPCION, "Campo no permitido"),
  especialista_id: uuidOpcional,
})

export type ServicioCupsInput = z.input<typeof servicioCupsSchema>
export type ServicioCupsOutput = z.output<typeof servicioCupsSchema>
export type EditarCmeInput = z.input<typeof editarCmeSchema>
export type EditarOpcionInput = z.input<typeof editarOpcionSchema>
export type CambioMasivoInput = z.input<typeof cambioMasivoSchema>
