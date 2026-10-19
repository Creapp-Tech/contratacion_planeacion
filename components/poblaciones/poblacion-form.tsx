"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"

import {
  actualizarPoblacion,
  crearPoblacion,
} from "@/lib/poblaciones/actions"
import type { PoblacionFila, PoblacionOpciones } from "@/lib/poblaciones/queries"
import {
  poblacionSchema,
  type PoblacionInput,
} from "@/lib/validations/poblacion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PoblacionFormProps =
  | { mode: "crear"; opciones: PoblacionOpciones }
  | { mode: "editar"; opciones: PoblacionOpciones; poblacion: PoblacionFila }

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export function PoblacionForm(props: PoblacionFormProps) {
  const { opciones } = props
  const poblacion = props.mode === "editar" ? props.poblacion : null
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PoblacionInput>({
    resolver: zodResolver(poblacionSchema),
    defaultValues: {
      sede_id: poblacion?.sede_id ?? opciones.sedes[0]?.id ?? "",
      asegurador_eps_id:
        poblacion?.asegurador_eps_id ?? opciones.aseguradores[0]?.id ?? "",
      regimen_id: poblacion?.regimen_id ?? opciones.regimenes[0]?.id ?? "",
      poblacion_activa: poblacion?.poblacion_activa ?? 0,
      poblacion_pagada: poblacion?.poblacion_pagada ?? 0,
      poblacion_certificada: poblacion?.poblacion_certificada ?? 0,
      fecha_actualizacion: poblacion?.fecha_actualizacion ?? hoy(),
    },
  })

  async function onSubmit(values: PoblacionInput) {
    setServerError(null)

    const result = poblacion
      ? await actualizarPoblacion(poblacion.id, values)
      : await crearPoblacion(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/poblaciones")
    router.refresh()
  }

  const sedeItems = Object.fromEntries(
    opciones.sedes.map((sede) => [sede.id, sede.nombre])
  )
  const aseguradorItems = Object.fromEntries(
    opciones.aseguradores.map((eps) => [eps.id, eps.nombre_eps])
  )
  const regimenItems = Object.fromEntries(
    opciones.regimenes.map((regimen) => [regimen.id, regimen.nombre])
  )

  if (
    opciones.sedes.length === 0 ||
    opciones.aseguradores.length === 0 ||
    opciones.regimenes.length === 0
  ) {
    return (
      <Alert>
        <AlertDescription>
          Se requiere al menos una sede activa, un asegurador y un régimen para
          registrar poblaciones.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={!!errors.sede_id}>
          <FieldLabel>Sede</FieldLabel>
          <Controller
            control={control}
            name="sede_id"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={sedeItems}
              >
                <SelectTrigger id="sede_id" className="w-full">
                  <SelectValue placeholder="Selecciona la sede" />
                </SelectTrigger>
                <SelectContent>
                  {opciones.sedes.map((sede) => (
                    <SelectItem key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.sede_id]} />
        </Field>

        <Field data-invalid={!!errors.asegurador_eps_id}>
          <FieldLabel>Asegurador</FieldLabel>
          <Controller
            control={control}
            name="asegurador_eps_id"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={aseguradorItems}
              >
                <SelectTrigger id="asegurador_eps_id" className="w-full">
                  <SelectValue placeholder="Selecciona el asegurador" />
                </SelectTrigger>
                <SelectContent>
                  {opciones.aseguradores.map((eps) => (
                    <SelectItem key={eps.id} value={eps.id}>
                      {eps.nombre_eps}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.asegurador_eps_id]} />
        </Field>

        <Field data-invalid={!!errors.regimen_id}>
          <FieldLabel>Régimen</FieldLabel>
          <Controller
            control={control}
            name="regimen_id"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={regimenItems}
              >
                <SelectTrigger id="regimen_id" className="w-full">
                  <SelectValue placeholder="Selecciona el régimen" />
                </SelectTrigger>
                <SelectContent>
                  {opciones.regimenes.map((regimen) => (
                    <SelectItem key={regimen.id} value={regimen.id}>
                      {regimen.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.regimen_id]} />
        </Field>

        <Field data-invalid={!!errors.poblacion_activa}>
          <FieldLabel htmlFor="poblacion_activa">Población activa</FieldLabel>
          <Input
            id="poblacion_activa"
            type="number"
            min={0}
            step={1}
            aria-invalid={!!errors.poblacion_activa}
            {...register("poblacion_activa", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.poblacion_activa]} />
        </Field>

        <Field data-invalid={!!errors.poblacion_pagada}>
          <FieldLabel htmlFor="poblacion_pagada">Población pagada</FieldLabel>
          <Input
            id="poblacion_pagada"
            type="number"
            min={0}
            step={1}
            aria-invalid={!!errors.poblacion_pagada}
            {...register("poblacion_pagada", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.poblacion_pagada]} />
        </Field>

        <Field data-invalid={!!errors.poblacion_certificada}>
          <FieldLabel htmlFor="poblacion_certificada">
            Población certificada
          </FieldLabel>
          <Input
            id="poblacion_certificada"
            type="number"
            min={0}
            step={1}
            aria-invalid={!!errors.poblacion_certificada}
            {...register("poblacion_certificada", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.poblacion_certificada]} />
        </Field>

        <Field data-invalid={!!errors.fecha_actualizacion}>
          <FieldLabel htmlFor="fecha_actualizacion">
            Fecha de actualización
          </FieldLabel>
          <Input
            id="fecha_actualizacion"
            type="date"
            aria-invalid={!!errors.fecha_actualizacion}
            {...register("fecha_actualizacion")}
          />
          <FieldError errors={[errors.fecha_actualizacion]} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {props.mode === "crear" ? "Crear población" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
