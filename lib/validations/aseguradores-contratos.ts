import { z } from "zod"

const uuidOpcional = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.string().uuid("Selecciona una opción válida").nullable()
)

const numeroOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Ingresa un número válido" })
    .finite("Ingresa un número válido")
    .min(0, "El valor no puede ser negativo")
    .nullable()
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
  cme_contratado: numeroOpcional,
})

export const editarCmeSchema = z.object({
  id: z.string().uuid("Registro inválido"),
  cme_contratado: numeroOpcional,
})

export type ServicioCupsInput = z.input<typeof servicioCupsSchema>
export type ServicioCupsOutput = z.output<typeof servicioCupsSchema>
export type EditarCmeInput = z.input<typeof editarCmeSchema>
