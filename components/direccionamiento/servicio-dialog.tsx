"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon, PlusIcon } from "lucide-react"

import {
  actualizarServicioContratado,
  crearServicioContratado,
} from "@/app/(dashboard)/direccionamiento/actions"
import { BuscadorCups } from "@/components/direccionamiento/buscador-cups"
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
import type {
  ContratoDetalle,
  OpcionesDireccionamiento,
  ServicioContratadoRow,
} from "@/lib/direccionamiento/types"
import { CLASE_SELECT } from "@/lib/direccionamiento/ui"
import {
  servicioContratadoSchema,
  type ServicioContratadoInput,
} from "@/lib/validations/direccionamiento"

function texto(valor: unknown): string {
  return valor == null ? "" : String(valor)
}

export function ServicioDialog({
  contratos,
  opciones,
  servicio,
  cupsLabel = null,
}: {
  contratos: ContratoDetalle[]
  opciones: OpcionesDireccionamiento
  servicio?: ServicioContratadoRow
  cupsLabel?: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const contratoInicial =
    servicio?.contrato_especialista_id ?? contratos[0]?.id ?? ""

  const valores: ServicioContratadoInput = {
    contrato_especialista_id: contratoInicial,
    cups_id: servicio?.cups_id ?? "",
    agrupador: servicio?.agrupador ?? "",
    especialidad: servicio?.especialidad ?? "",
    tipo_imagen: servicio?.tipo_imagen ?? "",
    manual_tarifario: servicio?.manual_tarifario ?? "",
    porcentaje_descuento_incremento: texto(
      servicio?.porcentaje_descuento_incremento ?? 0
    ),
    modalidad_contratacion: servicio?.modalidad_contratacion ?? "",
    valor_tarifa: texto(servicio?.valor_tarifa ?? ""),
    atenciones_por_hora: texto(servicio?.atenciones_por_hora ?? ""),
    modalidad_prestacion: servicio?.modalidad_prestacion ?? "",
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServicioContratadoInput>({
    resolver: zodResolver(servicioContratadoSchema),
    defaultValues: valores,
  })

  const agrupador = useWatch({ control, name: "agrupador" })
  const especialidad = useWatch({ control, name: "especialidad" })


  async function onSubmit(values: ServicioContratadoInput) {
    setServerError(null)
    const resultado = servicio
      ? await actualizarServicioContratado(servicio.id, values)
      : await crearServicioContratado(values)

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
            variant={servicio ? "ghost" : "default"}
            size={servicio ? "sm" : "default"}
            disabled={contratos.length === 0}
          />
        }
      >
        {servicio ? <PencilIcon /> : <PlusIcon />}
        {servicio ? "Editar" : "Nuevo servicio"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {servicio ? "Editar servicio contratado" : "Nuevo servicio CUPS"}
          </DialogTitle>
          <DialogDescription>
            El servicio pertenece a un contrato. La asignación de sedes se hace
            después, de forma independiente, para cada servicio.
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

            <Field className="sm:col-span-2" data-invalid={!!errors.cups_id}>
              <FieldLabel>Servicio CUPS</FieldLabel>
              <Controller
                control={control}
                name="cups_id"
                render={({ field }) => (
                  <BuscadorCups
                    value={texto(field.value)}
                    onValueChange={field.onChange}
                    onSeleccion={(opcion) => {
                      setValue("agrupador", opcion.agrupador ?? "")
                      setValue("especialidad", opcion.especialidad ?? "")
                    }}
                    labelInicial={cupsLabel}
                    ariaInvalid={!!errors.cups_id}
                  />
                )}
              />
              <FieldError>{errors.cups_id?.message}</FieldError>
            </Field>

            {/* Los valores se envían ocultos: el servidor los recalcula desde
                cups -> grupos_servicio / servicios antes de guardar. */}
            <input type="hidden" {...register("agrupador")} />
            <input type="hidden" {...register("especialidad")} />

            <Field>
              <FieldLabel>Agrupador</FieldLabel>
              <Input value={texto(agrupador) || "—"} readOnly />
              <p className="text-xs text-muted-foreground">
                Tomado del catálogo CUPS (grupo de servicio).
              </p>
            </Field>

            <Field>
              <FieldLabel>Especialidad del servicio</FieldLabel>
              <Input value={texto(especialidad) || "—"} readOnly />
              <p className="text-xs text-muted-foreground">
                Tomada del catálogo CUPS (servicio).
              </p>
            </Field>

            <Field data-invalid={!!errors.tipo_imagen}>
              <FieldLabel>Tipo de imagen</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.tipo_imagen}
                {...register("tipo_imagen")}
              >
                <option value="">Sin definir</option>
                {opciones.tiposImagen.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError>{errors.tipo_imagen?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.manual_tarifario}>
              <FieldLabel>Manual tarifario</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.manual_tarifario}
                {...register("manual_tarifario")}
              >
                <option value="">Sin definir</option>
                {opciones.manualesTarifario.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError>{errors.manual_tarifario?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.modalidad_contratacion}>
              <FieldLabel>Modalidad de contratación</FieldLabel>
              <select
                className={CLASE_SELECT}
                aria-invalid={!!errors.modalidad_contratacion}
                {...register("modalidad_contratacion")}
              >
                <option value="">Sin definir</option>
                {opciones.modalidadesContratacion.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError>{errors.modalidad_contratacion?.message}</FieldError>
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

            <Field data-invalid={!!errors.porcentaje_descuento_incremento}>
              <FieldLabel htmlFor="porcentaje">
                % descuento / incremento
              </FieldLabel>
              <Input
                id="porcentaje"
                type="number"
                step="0.01"
                aria-invalid={!!errors.porcentaje_descuento_incremento}
                {...register("porcentaje_descuento_incremento")}
              />
              <FieldError>
                {errors.porcentaje_descuento_incremento?.message}
              </FieldError>
            </Field>

            <Field data-invalid={!!errors.valor_tarifa}>
              <FieldLabel htmlFor="valor_tarifa">Valor tarifa</FieldLabel>
              <Input
                id="valor_tarifa"
                type="number"
                step="0.01"
                aria-invalid={!!errors.valor_tarifa}
                {...register("valor_tarifa")}
              />
              <FieldError>{errors.valor_tarifa?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.atenciones_por_hora}>
              <FieldLabel htmlFor="atenciones">Atenciones por hora</FieldLabel>
              <Input
                id="atenciones"
                type="number"
                step="1"
                aria-invalid={!!errors.atenciones_por_hora}
                {...register("atenciones_por_hora")}
              />
              <FieldError>{errors.atenciones_por_hora?.message}</FieldError>
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
              {isSubmitting ? "Guardando..." : servicio ? "Guardar" : "Crear servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
