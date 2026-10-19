"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"

import {
  actualizarAsegurador,
  crearAsegurador,
} from "@/lib/aseguradores/actions"
import type { AseguradorAdmin } from "@/lib/aseguradores/queries"
import {
  aseguradorSchema,
  type AseguradorInput,
} from "@/lib/validations/asegurador"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AseguradorFormProps =
  | { mode: "crear" }
  | { mode: "editar"; asegurador: AseguradorAdmin }

export function AseguradorForm(props: AseguradorFormProps) {
  const mode = props.mode
  const asegurador = props.mode === "editar" ? props.asegurador : null
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AseguradorInput>({
    resolver: zodResolver(aseguradorSchema),
    defaultValues: {
      nombre_eps: asegurador?.nombre_eps ?? "",
    },
  })

  async function onSubmit(values: AseguradorInput) {
    setServerError(null)

    const result = asegurador
      ? await actualizarAsegurador(asegurador.id, values)
      : await crearAsegurador(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/configuracion/aseguradores")
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
        <Field data-invalid={!!errors.nombre_eps}>
          <FieldLabel htmlFor="nombre_eps">Nombre</FieldLabel>
          <Input
            id="nombre_eps"
            autoComplete="off"
            aria-invalid={!!errors.nombre_eps}
            {...register("nombre_eps")}
          />
          <FieldError errors={[errors.nombre_eps]} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear asegurador" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
