"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import type { z } from "zod"

import {
  actualizarArea,
  crearArea,
} from "@/app/(dashboard)/configuracion/areas/actions"
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Area, GrupoArea } from "@/lib/areas/queries"
import { areaSchema } from "@/lib/validations/area"

type FormValues = z.infer<typeof areaSchema>

type AreaFormProps =
  | { mode: "crear"; grupos: GrupoArea[] }
  | { mode: "editar"; area: Area; grupos: GrupoArea[] }

export function AreaForm(props: AreaFormProps) {
  const mode = props.mode
  const area = mode === "editar" ? props.area : null
  const grupos = props.grupos
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      categoria: area?.categoria ?? "",
      nombre: area?.nombre ?? "",
      medida: area?.medida ?? 1,
      mide_capacidad_ocupacion: area?.mide_capacidad_ocupacion ?? false,
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const result = area
      ? await actualizarArea(area.id, values)
      : await crearArea(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/configuracion/areas")
    router.refresh()
  }

  const grupoItems = Object.fromEntries(
    grupos
      .filter((grupo) => grupo.activo)
      .map((grupo) => [grupo.nombre, grupo.nombre])
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={!!errors.categoria}>
          <FieldLabel htmlFor="categoria">Grupo</FieldLabel>
          <Controller
            control={control}
            name="categoria"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={grupoItems}
              >
                <SelectTrigger id="categoria" className="w-full">
                  <SelectValue placeholder="Selecciona el grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {grupos
                      .filter((grupo) => grupo.activo)
                      .map((grupo) => (
                        <SelectItem key={grupo.nombre} value={grupo.nombre}>
                          {grupo.nombre}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.categoria]} />
        </Field>

        <Field data-invalid={!!errors.nombre}>
          <FieldLabel htmlFor="nombre">Nombre del área</FieldLabel>
          <Input
            id="nombre"
            autoComplete="off"
            aria-invalid={!!errors.nombre}
            {...register("nombre")}
          />
          <FieldError errors={[errors.nombre]} />
        </Field>

        <Field data-invalid={!!errors.medida}>
          <FieldLabel htmlFor="medida">Medida</FieldLabel>
          <Input
            id="medida"
            type="number"
            min={1}
            aria-invalid={!!errors.medida}
            {...register("medida", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.medida]} />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="mide_capacidad_ocupacion">
            ¿Mide capacidad?
          </FieldLabel>
          <Controller
            control={control}
            name="mide_capacidad_ocupacion"
            render={({ field }) => (
              <Switch
                id="mide_capacidad_ocupacion"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear área" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
