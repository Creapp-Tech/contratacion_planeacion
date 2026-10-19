import { z } from "zod"

import { SEDE_ESTADO_VALUES } from "@/lib/sedes/estados"

const textoOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().trim().max(300).nullable()
)

const numeroOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Ingresa un número válido" })
    .nonnegative("No puede ser negativo")
    .nullable()
)

const enteroOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Ingresa un número válido" })
    .int("Debe ser un número entero")
    .nonnegative("No puede ser negativo")
    .nullable()
)

const pisosOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Ingresa un número válido" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 piso")
    .nullable()
)

const latitudOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Latitud inválida" })
    .min(-90, "Latitud fuera de rango")
    .max(90, "Latitud fuera de rango")
    .nullable()
)

const longitudOpcional = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z
    .number({ error: "Longitud inválida" })
    .min(-180, "Longitud fuera de rango")
    .max(180, "Longitud fuera de rango")
    .nullable()
)

const areaSedeSchema = z
  .object({
    area_id: z.string().uuid("Área inválida"),
    cantidad: z.coerce.number().int().min(1, "Mínimo 1"),
    cantidad_habilitada: z.coerce
      .number()
      .int()
      .min(0, "No puede ser negativo")
      .optional(),
  })
  .superRefine((area, ctx) => {
    const habilitada = area.cantidad_habilitada ?? area.cantidad
    if (habilitada > area.cantidad) {
      ctx.addIssue({
        code: "custom",
        message: "No puede haber más unidades habilitadas que existentes",
        path: ["cantidad_habilitada"],
      })
    }
  })

export const sedeSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre de la sede")
    .max(200, "El nombre es demasiado largo"),
  marca: z.string().trim().min(1, "Selecciona la marca"),
  tipo_ips: z.string().trim().min(1, "Selecciona el tipo de IPS"),
  nivel: textoOpcional,
  codigo_reps: textoOpcional,
  departamento: textoOpcional,
  municipio: textoOpcional,
  barrio: textoOpcional,
  direccion: textoOpcional,
  pais: textoOpcional,
  latitud: latitudOpcional,
  longitud: longitudOpcional,
  gerente: textoOpcional,
  fecha_apertura: textoOpcional,
  regional: textoOpcional,
  zonal: textoOpcional,
  estado: z.enum(SEDE_ESTADO_VALUES),
  fecha_cierre: textoOpcional,
  metros_cuadrado: numeroOpcional,
  capacidad_inicial: enteroOpcional,
  capacidad_usuarios: enteroOpcional,
  numero_pisos: pisosOpcional,
  observaciones: textoOpcional,
  areas: z.array(areaSedeSchema).default([]),
  aseguradores: z.array(z.string().uuid()).default([]),
})

export type SedeInput = z.input<typeof sedeSchema>
export type SedeOutput = z.output<typeof sedeSchema>
