import { z } from "zod"

import {
  ANIO_IPC_MAX,
  ANIO_IPC_MIN,
  IPC_PORCENTAJE_MAX,
  IPC_PORCENTAJE_MIN,
} from "@/lib/ipc/constantes"

const anioSchema = z
  .number({ error: "Ingresa un año válido" })
  .int("El año debe ser un número entero")
  .min(ANIO_IPC_MIN, `El año debe ser mayor o igual a ${ANIO_IPC_MIN}`)
  .max(ANIO_IPC_MAX, `El año debe ser menor o igual a ${ANIO_IPC_MAX}`)

const porcentajeIpcSchema = z
  .number({ error: "Ingresa el % IPC" })
  .min(
    IPC_PORCENTAJE_MIN,
    `El % IPC debe ser mayor o igual a ${IPC_PORCENTAJE_MIN}`
  )
  .max(
    IPC_PORCENTAJE_MAX,
    `El % IPC debe ser menor o igual a ${IPC_PORCENTAJE_MAX}`
  )

export const ipcSchema = z.object({
  contrato_id: z.string().uuid("Selecciona el contrato"),
  anio: anioSchema,
  costo_usuario: z
    .number({ error: "Ingresa el costo usuario" })
    .min(0, "El costo usuario no puede ser negativo"),
  porcentaje_ipc: porcentajeIpcSchema,
})

export type IpcInput = z.infer<typeof ipcSchema>

export const ipcNacionalSchema = z.object({
  pais: z
    .string()
    .trim()
    .min(1, "Ingresa el país")
    .max(80, "El país es demasiado largo"),
  anio: anioSchema,
  porcentaje_ipc: porcentajeIpcSchema,
  valor_upc_contributivo: z
    .number({ error: "Ingresa el valor de la UPC contributiva" })
    .min(0, "El valor de la UPC contributiva no puede ser negativo"),
  valor_upc_subsidiado: z
    .number({ error: "Ingresa el valor de la UPC subsidiada" })
    .min(0, "El valor de la UPC subsidiada no puede ser negativo")
    .nullable()
    .optional(),
})

export type IpcNacionalInput = z.infer<typeof ipcNacionalSchema>
