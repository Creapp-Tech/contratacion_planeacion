"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  actualizarEspecialista,
  crearEspecialista,
} from "@/app/(dashboard)/direccionamiento/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Combobox,
  type ComboboxOption,
} from "@/components/ui/combobox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ESTADO_ESPECIALISTA,
  TIPO_PERSONA,
} from "@/lib/direccionamiento/constantes"
import type {
  EspecialistaRow,
  OpcionesDireccionamiento,
} from "@/lib/direccionamiento/types"
import {
  especialistaSchema,
  type EspecialistaInput,
} from "@/lib/validations/direccionamiento"

function aOpciones(valores: string[]): ComboboxOption[] {
  return valores.map((valor) => ({ value: valor, label: valor }))
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">{titulo}</CardTitle>
        {descripcion ? <CardDescription>{descripcion}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EspecialistaForm({
  mode,
  especialista,
  opciones,
}: {
  mode: "crear" | "editar"
  especialista?: EspecialistaRow
  opciones: OpcionesDireccionamiento
}) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const valoresIniciales: EspecialistaInput = {
    tipo_identificacion: especialista?.tipo_identificacion ?? "",
    numero_identificacion: especialista?.numero_identificacion ?? "",
    nombre_completo: especialista?.nombre_completo ?? "",
    tipo_persona: (especialista?.tipo_persona as EspecialistaInput["tipo_persona"]) ?? "natural",
    especialidad: especialista?.especialidad ?? "",
    ciudad: especialista?.ciudad ?? "",
    estado: (especialista?.estado as EspecialistaInput["estado"]) ?? "activo",
  }

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EspecialistaInput>({
    resolver: zodResolver(especialistaSchema),
    defaultValues: valoresIniciales,
  })

  async function onSubmit(values: EspecialistaInput) {
    setServerError(null)
    const resultado =
      mode === "editar" && especialista
        ? await actualizarEspecialista(especialista.id, values)
        : await crearEspecialista(values)

    if ("error" in resultado) {
      setServerError(resultado.error)
      return
    }

    const destino = resultado.id ?? especialista?.id
    router.push(destino ? `/direccionamiento/${destino}` : "/direccionamiento")
    router.refresh()
  }

  const opcionesTipoId = aOpciones(opciones.tiposIdentificacion)
  const opcionesEspecialidad = aOpciones(opciones.especialidades)
  const opcionesPersona = TIPO_PERSONA.map((item) => ({
    value: item.value,
    label: item.label,
  }))
  const opcionesEstado = ESTADO_ESPECIALISTA.map((item) => ({
    value: item.value,
    label: item.label,
  }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Seccion
          titulo="Identificación del especialista"
          descripcion="Un especialista es único por tipo y número de identificación; puede tener varios contratos, servicios y sedes."
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.tipo_identificacion}>
              <FieldLabel>Tipo de identificación</FieldLabel>
              <Controller
                control={control}
                name="tipo_identificacion"
                render={({ field }) => (
                  <Combobox
                    id="tipo_identificacion"
                    options={opcionesTipoId}
                    value={field.value || null}
                    onValueChange={(valor) => field.onChange(valor ?? "")}
                    placeholder="Selecciona el tipo"
                    searchPlaceholder="Buscar tipo..."
                    aria-invalid={!!errors.tipo_identificacion}
                  />
                )}
              />
              <FieldError>{errors.tipo_identificacion?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.numero_identificacion}>
              <FieldLabel htmlFor="numero_identificacion">
                Número de identificación
              </FieldLabel>
              <Input
                id="numero_identificacion"
                placeholder="Ej. 901234567"
                aria-invalid={!!errors.numero_identificacion}
                {...register("numero_identificacion")}
              />
              <FieldError>{errors.numero_identificacion?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.nombre_completo}>
              <FieldLabel htmlFor="nombre_completo">Nombre completo</FieldLabel>
              <Input
                id="nombre_completo"
                placeholder="Nombre y apellidos o razón social"
                aria-invalid={!!errors.nombre_completo}
                {...register("nombre_completo")}
              />
              <FieldError>{errors.nombre_completo?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.tipo_persona}>
              <FieldLabel>Tipo de persona</FieldLabel>
              <Controller
                control={control}
                name="tipo_persona"
                render={({ field }) => (
                  <Combobox
                    id="tipo_persona"
                    options={opcionesPersona}
                    value={field.value || null}
                    onValueChange={(valor) => field.onChange(valor)}
                    aria-invalid={!!errors.tipo_persona}
                  />
                )}
              />
              <FieldError>{errors.tipo_persona?.message}</FieldError>
            </Field>
          </FieldGroup>
        </Seccion>

        <Seccion
          titulo="Clasificación y ubicación"
          descripcion="Las regionales de un especialista se derivan de las sedes donde es asignado; se definen en la ficha, no aquí."
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.especialidad}>
              <FieldLabel>Especialidad</FieldLabel>
              <Controller
                control={control}
                name="especialidad"
                render={({ field }) => (
                  <Combobox
                    id="especialidad"
                    options={opcionesEspecialidad}
                    value={field.value || null}
                    onValueChange={(valor) => field.onChange(valor ?? "")}
                    placeholder="Selecciona la especialidad"
                    searchPlaceholder="Buscar especialidad..."
                    aria-invalid={!!errors.especialidad}
                  />
                )}
              />
              <FieldError>{errors.especialidad?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.ciudad}>
              <FieldLabel htmlFor="ciudad">Ciudad</FieldLabel>
              <Input
                id="ciudad"
                placeholder="Ej. Bogotá"
                aria-invalid={!!errors.ciudad}
                {...register("ciudad")}
              />
              <FieldError>{errors.ciudad?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.estado}>
              <FieldLabel>Estado</FieldLabel>
              <Controller
                control={control}
                name="estado"
                render={({ field }) => (
                  <Combobox
                    id="estado"
                    options={opcionesEstado}
                    value={field.value || null}
                    onValueChange={(valor) => field.onChange(valor)}
                    aria-invalid={!!errors.estado}
                  />
                )}
              />
              <FieldError>{errors.estado?.message}</FieldError>
            </Field>
          </FieldGroup>
        </Seccion>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : mode === "crear"
              ? "Crear especialista"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
