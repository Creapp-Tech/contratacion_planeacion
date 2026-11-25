"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon, PlusIcon } from "lucide-react"

import {
  actualizarNovedad,
  crearNovedad,
} from "@/app/(dashboard)/prestadores-contratos/actions"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ESTADO_VALIDACION } from "@/lib/prestadores-contratos/constantes"
import type {
  AsignacionDetalle,
  ContratoDetalle,
  NovedadRow,
  OpcionesPrestadoresContratos,
  ServicioDetalle,
} from "@/lib/prestadores-contratos/types"
import { CLASE_SELECT, CLASE_TEXTAREA } from "@/lib/prestadores-contratos/ui"
import {
  novedadSchema,
  type NovedadInput,
} from "@/lib/validations/prestadores-contratos"

function contratoLabel(contrato: ContratoDetalle) {
  return `${contrato.aseguradores_eps?.nombre_eps ?? "Asegurador"} · ${contrato.numero_contrato || "Sin número"}`
}

function servicioLabel(servicio: ServicioDetalle) {
  return `${servicio.cups?.codigo ?? "CUPS"} — ${servicio.cups?.nombre ?? "Sin nombre"}`
}

export function NovedadDialog({
  especialistaId,
  contratos,
  servicios,
  asignaciones,
  opciones,
  novedad,
}: {
  especialistaId: string
  contratos: ContratoDetalle[]
  servicios: ServicioDetalle[]
  asignaciones: AsignacionDetalle[]
  opciones: OpcionesPrestadoresContratos
  novedad?: NovedadRow
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const valores: NovedadInput = {
    especialista_id: especialistaId,
    contrato_especialista_id: novedad?.contrato_especialista_id ?? "",
    servicio_contratado_id: novedad?.servicio_contratado_id ?? "",
    asignacion_sede_id: novedad?.asignacion_sede_id ?? "",
    tipo_novedad: novedad?.tipo_novedad ?? "",
    fecha_inicio: novedad?.fecha_inicio ?? "",
    fecha_terminacion: novedad?.fecha_terminacion ?? "",
    observaciones: novedad?.observaciones ?? "",
    estado_validacion:
      (novedad?.estado_validacion as NovedadInput["estado_validacion"]) ??
      "pendiente",
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NovedadInput>({
    resolver: zodResolver(novedadSchema),
    defaultValues: valores,
  })

  const contratoSeleccionado = useWatch({
    control,
    name: "contrato_especialista_id",
  })
  const serviciosFiltrados = servicios.filter(
    (servicio) => servicio.contrato_especialista_id === contratoSeleccionado
  )
  const asignacionesFiltradas = asignaciones.filter(
    (asignacion) => asignacion.contrato_especialista_id === contratoSeleccionado
  )


  async function onSubmit(values: NovedadInput) {
    setServerError(null)
    const resultado = novedad
      ? await actualizarNovedad(novedad.id, values)
      : await crearNovedad(values)

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
            variant={novedad ? "ghost" : "default"}
            size={novedad ? "sm" : "default"}
          />
        }
      >
        {novedad ? <PencilIcon /> : <PlusIcon />}
        {novedad ? "Editar" : "Nueva novedad"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {novedad ? "Editar novedad" : "Registrar novedad"}
          </DialogTitle>
          <DialogDescription>
            Las novedades registran cambios de vigencia, tarifas y relaciones.
            No reemplazan las condiciones anteriores: quedan en el historial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" data-invalid={!!errors.tipo_novedad}>
              <FieldLabel>Tipo de novedad</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.tipo_novedad}
                {...register("tipo_novedad")}
              >
                <option value="">Selecciona el tipo</option>
                {opciones.tiposNovedad.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError>{errors.tipo_novedad?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.contrato_especialista_id}>
              <FieldLabel>Contrato relacionado (opcional)</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.contrato_especialista_id}
                {...register("contrato_especialista_id")}
              >
                <option value="">Sin contrato</option>
                {contratos.map((contrato) => (
                  <option key={contrato.id} value={contrato.id}>
                    {contratoLabel(contrato)}
                  </option>
                ))}
              </select>
              <FieldError>{errors.contrato_especialista_id?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.servicio_contratado_id}>
              <FieldLabel>Servicio CUPS relacionado (opcional)</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.servicio_contratado_id}
                {...register("servicio_contratado_id")}
              >
                <option value="">Sin servicio</option>
                {serviciosFiltrados.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicioLabel(servicio)}
                  </option>
                ))}
              </select>
              <FieldError>{errors.servicio_contratado_id?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.asignacion_sede_id}>
              <FieldLabel>Asignación de sede relacionada (opcional)</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.asignacion_sede_id}
                {...register("asignacion_sede_id")}
              >
                <option value="">Sin asignación</option>
                {asignacionesFiltradas.map((asignacion) => (
                  <option key={asignacion.id} value={asignacion.id}>
                    {asignacion.sedes?.nombre ?? "Sede"} ·{" "}
                    {asignacion.servicios_contratados_especialistas?.cups?.codigo ?? "CUPS"}
                  </option>
                ))}
              </select>
              <FieldError>{errors.asignacion_sede_id?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.fecha_inicio}>
              <FieldLabel htmlFor="fecha_inicio_novedad">Fecha de inicio</FieldLabel>
              <Input
                id="fecha_inicio_novedad"
                type="date"
                aria-invalid={!!errors.fecha_inicio}
                {...register("fecha_inicio")}
              />
              <FieldError>{errors.fecha_inicio?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.fecha_terminacion}>
              <FieldLabel htmlFor="fecha_fin_novedad">
                Fecha de terminación
              </FieldLabel>
              <Input
                id="fecha_fin_novedad"
                type="date"
                aria-invalid={!!errors.fecha_terminacion}
                {...register("fecha_terminacion")}
              />
              <FieldError>{errors.fecha_terminacion?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.estado_validacion}>
              <FieldLabel>Estado de validación</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.estado_validacion}
                {...register("estado_validacion")}
              >
                {ESTADO_VALIDACION.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.estado_validacion?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.observaciones}>
              <FieldLabel htmlFor="observaciones_novedad">
                Observaciones
              </FieldLabel>
              <textarea
                id="observaciones_novedad"
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
              {isSubmitting ? "Guardando..." : novedad ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
