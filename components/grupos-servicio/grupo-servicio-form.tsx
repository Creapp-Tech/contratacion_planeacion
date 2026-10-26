"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import type { z } from "zod"

import {
  actualizarGrupoServicio,
  crearGrupoServicio,
} from "@/app/(dashboard)/configuracion/grupos-servicio/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { GrupoServicio } from "@/lib/servicios/queries"
import { grupoServicioSchema } from "@/lib/validations/grupo-servicio"

type FormValues = z.infer<typeof grupoServicioSchema>

type GrupoServicioFormProps =
  | { mode: "crear" }
  | { mode: "editar"; grupo: GrupoServicio }

export function GrupoServicioForm(props: GrupoServicioFormProps) {
  const mode = props.mode
  const grupo = mode === "editar" ? props.grupo : null
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(grupoServicioSchema),
    defaultValues: {
      nombre: grupo?.nombre ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const result = grupo
      ? await actualizarGrupoServicio(grupo.id, values)
      : await crearGrupoServicio(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/configuracion/grupos-servicio")
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
          <FieldLabel htmlFor="nombre">Nombre del grupo</FieldLabel>
          <Input
            id="nombre"
            autoComplete="off"
            aria-invalid={!!errors.nombre}
            {...register("nombre")}
          />
          <FieldError errors={[errors.nombre]} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear grupo" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
