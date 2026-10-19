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
import type { Servicio } from "@/lib/servicios/queries"

const SIN_VALOR = "__sin_valor__"

const formSchema = z.object({
  nombre: z.string().min(1, "Ingresa el nombre del servicio"),
  grupo: z.string(),
  area_id: z.string(),
  tipo_personal: z.string().min(1, "Selecciona el tipo de personal"),
})

type FormValues = z.infer<typeof formSchema>

type ServicioFormProps = {
  mode: "crear" | "editar"
  servicio?: Servicio
  areas: Area[]
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

function toTipoPersonalItems(tipos: CatalogoItem[]) {
  return Object.fromEntries([
    ...tipos.map((tipo) => [tipo.nombre, tipo.nombre]),
  ])
}

export function ServicioForm({
  mode,
  servicio,
  areas,
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
      grupo: servicio?.grupo ?? "",
      area_id: servicio?.area_id ?? "",
      tipo_personal: servicio?.tipo_personal ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const payload = {
      nombre: values.nombre,
      grupo: values.grupo || null,
      area_id: values.area_id === SIN_VALOR ? null : values.area_id || null,
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
          <FieldLabel htmlFor="grupo">Grupo</FieldLabel>
          <Input
            id="grupo"
            autoComplete="off"
            {...register("grupo")}
          />
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