"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon, PlusIcon } from "lucide-react"

import {
  actualizarAsignacionSede,
  crearAsignacionSede,
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
import { MultiSelectChips } from "@/components/shared/multi-select-chips"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type {
  AsignacionSedeRow,
  ContratoDetalle,
  ServicioDetalle,
} from "@/lib/direccionamiento/types"
import { CLASE_SELECT, CLASE_TEXTAREA } from "@/lib/direccionamiento/ui"
import {
  asignacionSedeActualizarSchema,
  asignacionSedeCrearSchema,
  type AsignacionSedeInput,
} from "@/lib/validations/direccionamiento"

function etiquetaServicio(servicio: ServicioDetalle) {
  const codigo = servicio.cups?.codigo ?? "CUPS"
  const nombre = servicio.cups?.nombre ? ` — ${servicio.cups.nombre}` : ""
  return `${codigo}${nombre}`
}

export function AsignacionSedeDialog({
  especialistaId,
  contratos,
  servicios,
  sedes,
  asignacion,
}: {
  especialistaId: string
  contratos: ContratoDetalle[]
  servicios: ServicioDetalle[]
  sedes: { id: string; nombre: string; regional: string | null }[]
  asignacion?: AsignacionSedeRow
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const sedesFijas = asignacion ? [asignacion.sede_id] : []

  const valores: AsignacionSedeInput = {
    especialista_id: especialistaId,
    contrato_especialista_id:
      asignacion?.contrato_especialista_id ?? contratos[0]?.id ?? "",
    servicio_contratado_id:
      asignacion?.servicio_contratado_id ?? servicios[0]?.id ?? "",
    sede_ids: sedesFijas,
    tipo_red: (asignacion?.tipo_red as AsignacionSedeInput["tipo_red"]) ?? "interna",
    observaciones: asignacion?.observaciones ?? "",
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AsignacionSedeInput>({
    resolver: zodResolver(
      asignacion ? asignacionSedeActualizarSchema : asignacionSedeCrearSchema
    ),
    defaultValues: valores,
  })

  const contratoSeleccionado = useWatch({
    control,
    name: "contrato_especialista_id",
  })
  const serviciosDelContrato = servicios.filter(
    (servicio) => servicio.contrato_especialista_id === contratoSeleccionado
  )
  const sedesFiltradas = sedes.filter((sede) => {
    const etiqueta = `${sede.nombre}${sede.regional ? ` · ${sede.regional}` : ""}`
    return etiqueta
      .toLocaleLowerCase("es")
      .includes(busqueda.trim().toLocaleLowerCase("es"))
  })


  async function onSubmit(values: AsignacionSedeInput) {
    setServerError(null)
    const resultado = asignacion
      ? await actualizarAsignacionSede(asignacion.id, values)
      : await crearAsignacionSede(values)

    if ("error" in resultado) {
      setServerError(resultado.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  const sinDatos = contratos.length === 0 || servicios.length === 0 || sedes.length === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(siguiente) => {
        setOpen(siguiente)
        if (siguiente) {
          reset(valores)
          setBusqueda("")
          setServerError(null)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={asignacion ? "ghost" : "default"}
            size={asignacion ? "sm" : "default"}
            disabled={sinDatos && !asignacion}
          />
        }
      >
        {asignacion ? <PencilIcon /> : <PlusIcon />}
        {asignacion ? "Editar" : "Asignar sede"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {asignacion ? "Editar asignación de sede" : "Asignar sede a un servicio"}
          </DialogTitle>
          <DialogDescription>
            Puedes asignar una o varias sedes en un solo envío. Cada combinación
            contrato + CUPS + sede se administra de forma independiente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" data-invalid={!!errors.contrato_especialista_id}>
              <FieldLabel>Contrato</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.contrato_especialista_id}
                disabled={!!asignacion}
                {...register("contrato_especialista_id")}
              >
                {contratos.map((contrato) => (
                  <option key={contrato.id} value={contrato.id}>
                    {contrato.aseguradores_eps?.nombre_eps ?? "Asegurador"} ·{" "}
                    {contrato.numero_contrato || "Sin número"}
                  </option>
                ))}
              </select>
              <FieldError>{errors.contrato_especialista_id?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.servicio_contratado_id}>
              <FieldLabel>Servicio CUPS del contrato</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.servicio_contratado_id}
                disabled={!!asignacion}
                {...register("servicio_contratado_id")}
              >
                <option value="">Selecciona un servicio</option>
                {serviciosDelContrato.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {etiquetaServicio(servicio)}
                  </option>
                ))}
              </select>
              <FieldError>{errors.servicio_contratado_id?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.sede_ids}>
              <FieldLabel>Sedes</FieldLabel>
              <Input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar sede..."
                aria-label="Buscar sede"
              />
              <Controller
                control={control}
                name="sede_ids"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <MultiSelectChips
                      options={sedesFiltradas.map((sede) => ({
                        value: sede.id,
                        label: sede.nombre,
                        hint: sede.regional ?? undefined,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      disabledValues={sedesFijas}
                      emptyMessage="No hay sedes que coincidan con la búsqueda"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={sedesFiltradas.length === 0}
                        onClick={() =>
                          field.onChange(
                            Array.from(
                              new Set([
                                ...field.value,
                                ...sedesFiltradas.map((sede) => sede.id),
                              ])
                            )
                          )
                        }
                      >
                        Seleccionar visibles
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={field.value.length === sedesFijas.length}
                        onClick={() => field.onChange(sedesFijas)}
                      >
                        {asignacion ? "Quitar agregadas" : "Limpiar"}
                      </Button>
                    </div>
                  </div>
                )}
              />
              <p className="text-xs text-muted-foreground">
                {asignacion
                  ? "La sede original se conserva; marca otras sedes para agregarlas al mismo contrato y servicio CUPS."
                  : "Selecciona una o varias sedes para este contrato y servicio CUPS."}
              </p>
              <FieldError>{errors.sede_ids?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.tipo_red}>
              <FieldLabel>Tipo de red</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.tipo_red}
                {...register("tipo_red")}
              >
                <option value="interna">Interna</option>
                <option value="externa">Externa</option>
              </select>
              <FieldError>{errors.tipo_red?.message}</FieldError>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.observaciones}>
              <FieldLabel htmlFor="observaciones_asignacion">
                Observaciones
              </FieldLabel>
              <textarea
                id="observaciones_asignacion"
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
              {isSubmitting ? "Guardando..." : asignacion ? "Guardar" : "Asignar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
