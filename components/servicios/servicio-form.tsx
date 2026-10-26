"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import {
  actualizarServicio,
  crearServicio,
} from "@/app/(dashboard)/servicios/actions"
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
import type { Area } from "@/lib/areas/queries"
import type { CatalogoItem } from "@/lib/catalogos/queries"
import type { GrupoServicio, Servicio } from "@/lib/servicios/queries"

const SIN_VALOR = "__sin_valor__"

const formSchema = z.object({
  nombre: z.string().min(1, "Ingresa el nombre del servicio"),
  grupo_id: z.string(),
  area_id: z.string(),
  duracion_minutos: z
    .string()
    .refine(
      (valor) => valor.trim() === "" || /^\d+$/.test(valor.trim()),
      "Ingresa un número entero"
    )
    .refine(
      (valor) => {
        if (valor.trim() === "") return true
        const n = Number(valor)
        return n >= 1 && n <= 1440
      },
      "La duración debe estar entre 1 y 1440 minutos"
    ),
  tipo_personal: z.string().min(1, "Selecciona el tipo de personal"),
})

type FormValues = z.infer<typeof formSchema>

type ServicioFormProps = {
  mode: "crear" | "editar"
  servicio?: Servicio
  areas: Area[]
  grupos: GrupoServicio[]
  tiposPersonal: CatalogoItem[]
}

function toAreaItems(areas: Area[]) {
  return Object.fromEntries([
    [SIN_VALOR, "Sin definir"],
    ...areas.map((area) => [
      area.id,
      `${area.categoria} · ${area.nombre}`,
    ]),
  ])
}

function toGrupoItems(grupos: GrupoServicio[]) {
  return Object.fromEntries([
    [SIN_VALOR, "Sin grupo"],
    ...grupos.map((grupo) => [grupo.id, grupo.nombre]),
  ])
}

function toTipoPersonalItems(tipos: CatalogoItem[]) {
  return Object.fromEntries([
    ...tipos.map((tipo) => [tipo.nombre, tipo.nombre]),
  ])
}

export function ServicioForm({
  mode,
  servicio,
  areas,
  grupos,
  tiposPersonal,
}: ServicioFormProps) {
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
      nombre: servicio?.nombre ?? "",
      grupo_id: servicio?.grupo_id ?? "",
      area_id: servicio?.area_id ?? "",
      duracion_minutos:
        servicio?.duracion_minutos != null
          ? String(servicio.duracion_minutos)
          : "",
      tipo_personal: servicio?.tipo_personal ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const payload = {
      nombre: values.nombre,
      grupo_id: values.grupo_id === SIN_VALOR ? null : values.grupo_id || null,
      area_id: values.area_id === SIN_VALOR ? null : values.area_id || null,
      duracion_minutos:
        values.duracion_minutos.trim() === ""
          ? null
          : Number(values.duracion_minutos),
      tipo_personal: values.tipo_personal,
    }

    const result =
      mode === "editar" && servicio
        ? await actualizarServicio(servicio.id, payload)
        : await crearServicio(payload)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/servicios")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={!!errors.nombre}>
          <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
          <Input
            id="nombre"
            autoComplete="off"
            aria-invalid={!!errors.nombre}
            {...register("nombre")}
          />
          <FieldError errors={[errors.nombre]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="grupo_id">Grupo</FieldLabel>
          <Controller
            control={control}
            name="grupo_id"
            render={({ field }) => (
              <Select
                value={field.value || SIN_VALOR}
                onValueChange={(value) =>
                  field.onChange(value === SIN_VALOR ? "" : value)
                }
                items={toGrupoItems(grupos)}
              >
                <SelectTrigger id="grupo_id" className="w-full">
                  <SelectValue placeholder="Selecciona el grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_VALOR}>Sin grupo</SelectItem>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.duracion_minutos}>
          <FieldLabel htmlFor="duracion_minutos">
            Duración (minutos)
          </FieldLabel>
          <Input
            id="duracion_minutos"
            type="number"
            min={1}
            max={1440}
            step={1}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Opcional"
            aria-invalid={!!errors.duracion_minutos}
            {...register("duracion_minutos")}
          />
          <FieldError errors={[errors.duracion_minutos]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="area_id">Área relacionada</FieldLabel>
          <Controller
            control={control}
            name="area_id"
            render={({ field }) => (
              <Select
                value={field.value || SIN_VALOR}
                onValueChange={(value) =>
                  field.onChange(value === SIN_VALOR ? "" : value)
                }
                items={toAreaItems(areas)}
              >
                <SelectTrigger id="area_id" className="w-full">
                  <SelectValue placeholder="Selecciona el área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_VALOR}>Sin definir</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.categoria} · {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.tipo_personal}>
          <FieldLabel htmlFor="tipo_personal">Tipo de personal</FieldLabel>
          <Controller
            control={control}
            name="tipo_personal"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={toTipoPersonalItems(tiposPersonal)}
              >
                <SelectTrigger id="tipo_personal" className="w-full">
                  <SelectValue placeholder="Selecciona el tipo de personal" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPersonal.map((tipo) => (
                    <SelectItem key={tipo.nombre} value={tipo.nombre}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.tipo_personal]} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear servicio" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}