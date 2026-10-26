import { z } from "zod"

import {
  MODALIDAD_VALUES,
  PERIODICIDAD_VALUES,
} from "@/lib/contratos/constantes"

const uuidOpcional = z.string().uuid("Selecciona una opción válida").nullable()

const fechaOpcional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida")
  .nullable()

const numeroOpcional = z
  .number()
  .min(0, "El valor no puede ser negativo")
  .nullable()

const enteroOpcional = z
  .number()
  .int("La población debe ser un número entero")
  .min(0, "La población no puede ser negativa")
  .nullable()

const valorRegimenSchema = z.object({
  regimen_id: uuidOpcional,
  poblacion: enteroOpcional,
  valor_total: numeroOpcional,
  valor_percapita_manual: numeroOpcional,
})

export const contratoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "Ingresa el nombre del contrato")
      .max(200, "El nombre es demasiado largo"),
    asegurador_id: z.string().uuid("Selecciona el asegurador"),
    numero_contrato: z
      .string()
      .trim()
      .min(1, "Ingresa el número de contrato")
      .max(100, "El número de contrato es demasiado largo"),
    regional_id: z.string().uuid("Selecciona la regional"),
    ciudad: z
      .string()
      .trim()
      .min(1, "Ingresa la ciudad")
      .max(120, "La ciudad es demasiado larga"),
    modalidad: z.enum(MODALIDAD_VALUES, {
      error: "Selecciona una modalidad válida",
    }),
    responsable_id: z.string().uuid("Selecciona el responsable"),
    categoria_contrato_id: uuidOpcional,
    tipo_contrato_id: uuidOpcional,
    estado_legalizacion_id: uuidOpcional,
    estado_ejecucion_id: uuidOpcional,
    fecha_inicio: fechaOpcional,
    fecha_fin: fechaOpcional,
    prorroga_automatica: z.boolean(),
    periodicidad: z
      .enum(PERIODICIDAD_VALUES, {
        error: "Selecciona una periodicidad válida",
      })
      .nullable(),
    poblacion_total: enteroOpcional,
    valor_total: numeroOpcional,
    valor_percapita_manual: numeroOpcional,
    tiene_programas: z.boolean(),
    sede_ids: z.array(z.string().uuid()),
    programa_ids: z.array(z.string().uuid()),
    valores: z.array(valorRegimenSchema),
    url_ubicacion: z
      .string()
      .trim()
      .max(500, "La URL es demasiado larga")
      .nullable()
      .refine(
        (value) =>
          value == null || value === "" || /^https?:\/\/\S+$/i.test(value),
        "Ingresa una URL válida (http o https)"
      ),
    notas: z.string().trim().max(2000, "Las notas son demasiado largas").nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.fecha_inicio &&
      data.fecha_fin &&
      data.fecha_fin < data.fecha_inicio
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["fecha_fin"],
        message: "La fecha de fin no puede ser anterior a la fecha de inicio",
      })
    }

    if (data.tiene_programas && data.programa_ids.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["programa_ids"],
        message: "Selecciona al menos un programa",
      })
    }

    if (data.sede_ids.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["sede_ids"],
        message: "Selecciona al menos una sede",
      })
    }

    if (new Set(data.sede_ids).size !== data.sede_ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["sede_ids"],
        message: "No puedes repetir una sede",
      })
    }

    if (new Set(data.programa_ids).size !== data.programa_ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["programa_ids"],
        message: "No puedes repetir un programa",
      })
    }

    const regimens = data.valores.map((valor) => valor.regimen_id ?? "total")
    if (new Set(regimens).size !== regimens.length) {
      ctx.addIssue({
        code: "custom",
        path: ["valores"],
        message: "No puedes repetir un régimen en los valores",
      })
    }
  })

export type ContratoInput = z.infer<typeof contratoSchema>
