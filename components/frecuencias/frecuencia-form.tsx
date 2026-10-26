"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { z } from "zod"

import {
  actualizarFrecuencia,
  crearFrecuencia,
} from "@/app/(dashboard)/frecuencias/actions"
import { ChoiceChips } from "@/components/shared/choice-chips"
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
import type { Frecuencia } from "@/lib/frecuencias/queries"
import { TIPOS_FRECUENCIA, type TipoFrecuencia } from "@/lib/frecuencias/tipos"

const formSchema = z.object({
  tipo_frecuencia: z.enum([
    "nota_tecnica_viva",
    "ejecucion_servicios",
    "asegurador",
  ]),
  nombre_nota_tecnica: z.string().min(1, "Ingresa el nombre de la nota técnica"),
  sede_id: z.string().min(1, "Selecciona la sede"),
  regimen_id: z.string().min(1, "Selecciona el régimen"),
  asegurador_eps_id: z.string().min(1, "Selecciona el asegurador"),
  version: z
    .string()
    .min(1, "Ingresa la versión")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Solo letras, números, punto, guion y guion bajo"
    ),
  servicios: z
    .array(
      z.object({
        servicio_id: z.string().min(1, "Selecciona el servicio"),
        frecuencia: z.string().min(1, "Ingresa la frecuencia"),
      })
    )
    .min(1, "Agrega al menos un servicio"),
})

type FormValues = z.infer<typeof formSchema>

export type FrecuenciaFormOpciones = {
  sedes: { id: string; nombre: string }[]
  regimenes: { id: string; nombre: string }[]
  aseguradores: { id: string; nombre: string }[]
  servicios: { id: string; nombre: string; grupo: string | null }[]
}

type FrecuenciaFormProps = {
  mode: "crear" | "editar"
  frecuencia?: Frecuencia
  opciones: FrecuenciaFormOpciones
}

function toItems(items: { id: string; nombre: string }[]) {
  return Object.fromEntries(items.map((item) => [item.id, item.nombre]))
}

const SERVICIO_VACIO = { servicio_id: "", frecuencia: "" }

export function FrecuenciaForm({
  mode,
  frecuencia,
  opciones,
}: FrecuenciaFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_frecuencia:
        (frecuencia?.tipo_frecuencia as TipoFrecuencia) ?? "nota_tecnica_viva",
      nombre_nota_tecnica: frecuencia?.nombre_nota_tecnica ?? "",
      sede_id: frecuencia?.sede_id ?? "",
      regimen_id: frecuencia?.regimen_id ?? "",
      asegurador_eps_id: frecuencia?.asegurador_eps_id ?? "",
      version: frecuencia?.version ?? "",
      servicios:
        frecuencia && frecuencia.servicios.length > 0
          ? frecuencia.servicios.map((servicio) => ({
              servicio_id: servicio.servicio_id,
              frecuencia: String(servicio.frecuencia),
            }))
          : [{ ...SERVICIO_VACIO }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "servicios",
  })

  const serviciosError = errors.servicios as unknown as
    | { message?: string; root?: { message?: string } }
    | undefined
  const mensajeServicios =
    serviciosError?.root?.message ?? serviciosError?.message

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const payload = {
      tipo_frecuencia: values.tipo_frecuencia,
      nombre_nota_tecnica: values.nombre_nota_tecnica.trim(),
      sede_id: values.sede_id,
      regimen_id: values.regimen_id,
      asegurador_eps_id: values.asegurador_eps_id,
      version: values.version.trim(),
      servicios: values.servicios.map((servicio) => ({
        servicio_id: servicio.servicio_id,
        frecuencia: servicio.frecuencia,
      })),
    }

    const result =
      mode === "editar" && frecuencia
        ? await actualizarFrecuencia(frecuencia.id, payload)
        : await crearFrecuencia(payload)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/frecuencias")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold">Encabezado</h2>
        <FieldGroup>
          <Field data-invalid={!!errors.tipo_frecuencia}>
            <FieldLabel>Tipo de frecuencia</FieldLabel>
            <Controller
              control={control}
              name="tipo_frecuencia"
              render={({ field }) => (
                <ChoiceChips
                  options={TIPOS_FRECUENCIA.map((tipo) => ({
                    value: tipo.value,
                    label: tipo.label,
                  }))}
                  value={field.value}
                  onChange={(value) => field.onChange(value as TipoFrecuencia)}
                />
              )}
            />
            <FieldError errors={[errors.tipo_frecuencia]} />
          </Field>

          <Field data-invalid={!!errors.nombre_nota_tecnica}>
            <FieldLabel htmlFor="nombre_nota_tecnica">
              Nombre de la nota técnica
            </FieldLabel>
            <Input
              id="nombre_nota_tecnica"
              autoComplete="off"
              aria-invalid={!!errors.nombre_nota_tecnica}
              {...register("nombre_nota_tecnica")}
            />
            <FieldError errors={[errors.nombre_nota_tecnica]} />
          </Field>

          <Field data-invalid={!!errors.sede_id}>
            <FieldLabel htmlFor="sede_id">Sede</FieldLabel>
            <Controller
              control={control}
              name="sede_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={toItems(opciones.sedes)}
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

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={!!errors.regimen_id}>
              <FieldLabel htmlFor="regimen_id">Régimen</FieldLabel>
              <Controller
                control={control}
                name="regimen_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={toItems(opciones.regimenes)}
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

            <Field data-invalid={!!errors.asegurador_eps_id}>
              <FieldLabel htmlFor="asegurador_eps_id">Asegurador</FieldLabel>
              <Controller
                control={control}
                name="asegurador_eps_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={toItems(opciones.aseguradores)}
                  >
                    <SelectTrigger id="asegurador_eps_id" className="w-full">
                      <SelectValue placeholder="Selecciona el asegurador" />
                    </SelectTrigger>
                    <SelectContent>
                      {opciones.aseguradores.map((asegurador) => (
                        <SelectItem key={asegurador.id} value={asegurador.id}>
                          {asegurador.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.asegurador_eps_id]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.version}>
            <FieldLabel htmlFor="version">Versión</FieldLabel>
            <Input
              id="version"
              autoComplete="off"
              aria-invalid={!!errors.version}
              {...register("version")}
            />
            <FieldError errors={[errors.version]} />
          </Field>
        </FieldGroup>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-semibold">Servicios</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...SERVICIO_VACIO })}
          >
            <PlusIcon />
            Agregar servicio
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid items-start gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_10rem_auto]"
            >
              <Field data-invalid={!!errors.servicios?.[index]?.servicio_id}>
                <FieldLabel htmlFor={`servicios.${index}.servicio_id`}>
                  Servicio
                </FieldLabel>
                <Controller
                  control={control}
                  name={`servicios.${index}.servicio_id`}
                  render={({ field: servicioField }) => (
                    <Select
                      value={servicioField.value}
                      onValueChange={servicioField.onChange}
                      items={toItems(
                        opciones.servicios.map((servicio) => ({
                          id: servicio.id,
                          nombre: servicio.grupo
                            ? `${servicio.nombre} (${servicio.grupo})`
                            : servicio.nombre,
                        }))
                      )}
                    >
                      <SelectTrigger
                        id={`servicios.${index}.servicio_id`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Selecciona el servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {opciones.servicios.map((servicio) => (
                          <SelectItem key={servicio.id} value={servicio.id}>
                            {servicio.grupo
                              ? `${servicio.nombre} (${servicio.grupo})`
                              : servicio.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError
                  errors={[errors.servicios?.[index]?.servicio_id]}
                />
              </Field>

              <Field data-invalid={!!errors.servicios?.[index]?.frecuencia}>
                <FieldLabel htmlFor={`servicios.${index}.frecuencia`}>
                  Frecuencia
                </FieldLabel>
                <Input
                  id={`servicios.${index}.frecuencia`}
                  type="number"
                  step="any"
                  min={0}
                  autoComplete="off"
                  aria-invalid={!!errors.servicios?.[index]?.frecuencia}
                  {...register(`servicios.${index}.frecuencia`)}
                />
                <FieldError
                  errors={[errors.servicios?.[index]?.frecuencia]}
                />
              </Field>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-6"
                aria-label="Quitar servicio"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
        {mensajeServicios ? (
          <FieldError errors={[{ message: mensajeServicios }]} />
        ) : null}
      </section>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear frecuencia" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
