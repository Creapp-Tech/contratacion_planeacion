"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon, PlusIcon } from "lucide-react"

import {
  actualizarContrato,
  crearContrato,
} from "@/app/(dashboard)/direccionamiento/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Combobox,
} from "@/components/ui/combobox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ESTADO_VIGENCIA } from "@/lib/direccionamiento/constantes"
import type {
  ContratoEspecialistaRow,
  OpcionesDireccionamiento,
} from "@/lib/direccionamiento/types"
import { CLASE_SELECT, CLASE_TEXTAREA } from "@/lib/direccionamiento/ui"
import {
  contratoEspecialistaSchema,
  type ContratoEspecialistaInput,
} from "@/lib/validations/direccionamiento"

export function ContratoDialog({
  especialistaId,
  opciones,
  contrato,
}: {
  especialistaId: string
  opciones: OpcionesDireccionamiento
  contrato?: ContratoEspecialistaRow
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const valores: ContratoEspecialistaInput = {
    especialista_id: especialistaId,
    asegurador_eps_id: contrato?.asegurador_eps_id ?? "",
    regimen_id: contrato?.regimen_id ?? null,
    numero_contrato: contrato?.numero_contrato ?? "",
    modalidad_prestacion: contrato?.modalidad_prestacion ?? "",
    fecha_inicio: contrato?.fecha_inicio ?? "",
    fecha_terminacion: contrato?.fecha_terminacion ?? "",
    estado: (contrato?.estado as ContratoEspecialistaInput["estado"]) ?? "activo",
    observaciones: contrato?.observaciones ?? "",
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContratoEspecialistaInput>({
    resolver: zodResolver(contratoEspecialistaSchema),
    defaultValues: valores,
  })


  async function onSubmit(values: ContratoEspecialistaInput) {
    setServerError(null)
    const resultado = contrato
      ? await actualizarContrato(contrato.id, values)
      : await crearContrato(values)

    if ("error" in resultado) {
      setServerError(resultado.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(siguiente) => {
        setOpen(siguiente)
        if (siguiente) {
          reset(valores)
          setServerError(null)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={contrato ? "ghost" : "default"}
            size={contrato ? "sm" : "default"}
          />
        }
      >
        {contrato ? <PencilIcon /> : <PlusIcon />}
        {contrato ? "Editar" : "Nuevo contrato"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contrato ? "Editar contrato" : "Nuevo contrato con asegurador"}
          </DialogTitle>
          <DialogDescription>
            Un especialista puede tener varios contratos con aseguradores
            distintos. Cada contrato administra sus propios servicios CUPS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.asegurador_eps_id}>
              <FieldLabel>Asegurador EPS</FieldLabel>
              <Controller
                control={control}
                name="asegurador_eps_id"
                render={({ field }) => (
                  <Combobox
                    options={opciones.aseguradores.map((item) => ({
                      value: item.id,
                      label: item.nombre,
                    }))}
                    value={field.value || null}
                    onValueChange={(valor) => field.onChange(valor ?? "")}
                    placeholder="Selecciona un asegurador"
                    searchPlaceholder="Buscar asegurador..."
                    aria-invalid={!!errors.asegurador_eps_id}
                  />
                )}
              />
              <FieldError>{errors.asegurador_eps_id?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.regimen_id}>
              <FieldLabel>Régimen</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.regimen_id}
                {...register("regimen_id")}
              >
                <option value="">Sin régimen</option>
                {opciones.regimenes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
              <FieldError>{errors.regimen_id?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.numero_contrato}>
              <FieldLabel htmlFor="numero_contrato">Número de contrato</FieldLabel>
              <Input
                id="numero_contrato"
                placeholder="Ej. CT-2026-001"
                aria-invalid={!!errors.numero_contrato}
                {...register("numero_contrato")}
              />
              <FieldError>{errors.numero_contrato?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.modalidad_prestacion}>
              <FieldLabel>Modalidad de prestación</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.modalidad_prestacion}
                {...register("modalidad_prestacion")}
              >
                <option value="">Sin definir</option>
                {opciones.modalidadesPrestacion.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError>{errors.modalidad_prestacion?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.fecha_inicio}>
              <FieldLabel htmlFor="fecha_inicio">Fecha de inicio</FieldLabel>
              <Input
                id="fecha_inicio"
                type="date"
                aria-invalid={!!errors.fecha_inicio}
                {...register("fecha_inicio")}
              />
              <FieldError>{errors.fecha_inicio?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.fecha_terminacion}>
              <FieldLabel htmlFor="fecha_terminacion">
                Fecha de terminación
              </FieldLabel>
              <Input
                id="fecha_terminacion"
                type="date"
                aria-invalid={!!errors.fecha_terminacion}
                {...register("fecha_terminacion")}
              />
              <FieldError>{errors.fecha_terminacion?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.estado}>
              <FieldLabel>Estado de vigencia</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.estado}
                {...register("estado")}
              >
                {ESTADO_VIGENCIA.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.estado?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.observaciones}>
              <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
              <textarea
                id="observaciones"
                className={CLASE_TEXTAREA}
                aria-invalid={!!errors.observaciones}
                {...register("observaciones")}
              />
              <FieldError>{errors.observaciones?.message}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : contrato ? "Guardar" : "Crear contrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
