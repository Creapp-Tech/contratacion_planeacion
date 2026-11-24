import { z } from "zod"

import {
  ESTADO_ESPECIALISTA_VALUES,
  ESTADO_VALIDACION_VALUES,
  ESTADO_VIGENCIA_VALUES,
  TIPO_PERSONA_VALUES,
  TIPO_RED_VALUES,
} from "@/lib/direccionamiento/constantes"

const textoOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().trim().max(300).nullable()
)

const textoLargoOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().trim().max(10_000).nullable()
)

const fechaOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida")
    .nullable()
)

const numeroOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z.number({ error: "Ingresa un número válido" }).nullable()
)

const enteroOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Ingresa un número válido" })
    .int("Debe ser un número entero")
    .nullable()
)

const porcentaje = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? 0 : Number(value),
  z
    .number({ error: "Ingresa un porcentaje válido" })
    .min(-100, "El descuento no puede superar el 100%")
    .max(100, "El incremento no puede superar el 100%")
)

function validarRangoFechas<
  T extends { fecha_inicio?: string | null; fecha_terminacion?: string | null },
>(data: T, ctx: z.RefinementCtx<T>) {
  if (
    data.fecha_inicio &&
    data.fecha_terminacion &&
    data.fecha_terminacion < data.fecha_inicio
  ) {
    ctx.addIssue({
      code: "custom",
      message: "La fecha de terminación no puede ser anterior al inicio",
      path: ["fecha_terminacion"],
    })
  }
}

export const especialistaSchema = z.object({
  tipo_identificacion: z.string().trim().min(1, "Selecciona el tipo de identificación"),
  numero_identificacion: z
    .string()
    .trim()
    .min(3, "Ingresa el número de identificación")
    .max(50, "El número de identificación es demasiado largo"),
  nombre_completo: z
    .string()
    .trim()
    .min(3, "Ingresa el nombre completo")
    .max(200, "El nombre es demasiado largo"),
  tipo_persona: z.enum(TIPO_PERSONA_VALUES, "Selecciona el tipo de persona"),
  especialidad: z.string().trim().min(1, "Selecciona la especialidad"),
  ciudad: z.string().trim().min(1, "Ingresa la ciudad").max(120),
  estado: z.enum(ESTADO_ESPECIALISTA_VALUES, "Selecciona el estado"),
})

export const contratoEspecialistaSchema = z
  .object({
    especialista_id: z.string().uuid("Especialista inválido"),
    asegurador_eps_id: z.string().uuid("Selecciona un asegurador"),
    regimen_id: z.preprocess(
      (value) => (value === "" ? null : value),
      z.string().uuid("Régimen inválido").nullable()
    ),
    numero_contrato: textoOpcional,
    modalidad_prestacion: textoOpcional,
    fecha_inicio: fechaOpcional,
    fecha_terminacion: fechaOpcional,
    estado: z.enum(ESTADO_VIGENCIA_VALUES, "Selecciona el estado"),
    observaciones: textoLargoOpcional,
  })
  .superRefine(validarRangoFechas)

export const servicioContratadoSchema = z
  .object({
    contrato_especialista_id: z.string().uuid("Selecciona un contrato"),
    cups_id: z.string().uuid("Selecciona un servicio CUPS"),
    agrupador: textoOpcional,
    especialidad: textoOpcional,
    tipo_imagen: textoOpcional,
    manual_tarifario: textoOpcional,
    porcentaje_descuento_incremento: porcentaje,
    modalidad_contratacion: textoOpcional,
    valor_tarifa: numeroOpcional,
    atenciones_por_hora: enteroOpcional,
    modalidad_prestacion: textoOpcional,
  })
  .superRefine((data, ctx) => {
    if (data.valor_tarifa !== null && data.valor_tarifa < 0) {
      ctx.addIssue({
        code: "custom",
        message: "La tarifa no puede ser negativa",
        path: ["valor_tarifa"],
      })
    }
    if (data.atenciones_por_hora !== null && data.atenciones_por_hora < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Las atenciones no pueden ser negativas",
        path: ["atenciones_por_hora"],
      })
    }
  })

const asignacionSedeBase = z.object({
  especialista_id: z.string().uuid("Especialista inválido"),
  contrato_especialista_id: z.string().uuid("Selecciona un contrato"),
  servicio_contratado_id: z.string().uuid("Selecciona un servicio CUPS"),
  tipo_red: z.enum(TIPO_RED_VALUES, "Selecciona el tipo de red"),
  observaciones: textoLargoOpcional,
})

const sedeIdsSchema = z
  .array(z.string().uuid("Selecciona una sede válida"))
  .min(1, "Selecciona al menos una sede")

function validarSedeIdsDuplicados<T extends { sede_ids: string[] }>(
  data: T,
  ctx: z.RefinementCtx<T>
) {
  if (new Set(data.sede_ids).size !== data.sede_ids.length) {
    ctx.addIssue({
      code: "custom",
      message: "No selecciones la misma sede más de una vez",
      path: ["sede_ids"],
    })
  }
}

export const asignacionSedeCrearSchema = asignacionSedeBase
  .extend({ sede_ids: sedeIdsSchema })
  .superRefine(validarSedeIdsDuplicados)

export const asignacionSedeActualizarSchema = asignacionSedeBase
  .extend({ sede_ids: sedeIdsSchema })
  .superRefine(validarSedeIdsDuplicados)

export const novedadSchema = z
  .object({
    especialista_id: z.string().uuid("Especialista inválido"),
    contrato_especialista_id: z.preprocess(
      (value) => (value === "" ? null : value),
      z.string().uuid("Contrato inválido").nullable()
    ),
    servicio_contratado_id: z.preprocess(
      (value) => (value === "" ? null : value),
      z.string().uuid("Servicio inválido").nullable()
    ),
    asignacion_sede_id: z.preprocess(
      (value) => (value === "" ? null : value),
      z.string().uuid("Asignación inválida").nullable()
    ),
    tipo_novedad: z.string().trim().min(1, "Selecciona el tipo de novedad"),
    fecha_inicio: fechaOpcional,
    fecha_terminacion: fechaOpcional,
    observaciones: textoLargoOpcional,
    estado_validacion: z.enum(
      ESTADO_VALIDACION_VALUES,
      "Selecciona el estado de validación"
    ),
  })
  .superRefine(validarRangoFechas)

export const validacionNovedadSchema = z.object({
  estado_validacion: z.enum(ESTADO_VALIDACION_VALUES, "Selecciona un estado"),
})

export type EspecialistaInput = z.input<typeof especialistaSchema>
export type EspecialistaOutput = z.output<typeof especialistaSchema>
export type ContratoEspecialistaInput = z.input<typeof contratoEspecialistaSchema>
export type ContratoEspecialistaOutput = z.output<typeof contratoEspecialistaSchema>
export type ServicioContratadoInput = z.input<typeof servicioContratadoSchema>
export type ServicioContratadoOutput = z.output<typeof servicioContratadoSchema>
export type AsignacionSedeInput = z.input<typeof asignacionSedeCrearSchema>
export type AsignacionSedeOutput = z.output<typeof asignacionSedeCrearSchema>
export type AsignacionSedeActualizarInput = z.input<
  typeof asignacionSedeActualizarSchema
>
export type NovedadInput = z.input<typeof novedadSchema>
export type NovedadOutput = z.output<typeof novedadSchema>
