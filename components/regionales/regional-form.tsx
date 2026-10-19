"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import {
  actualizarRegional,
  crearRegional,
} from "@/app/(dashboard)/configuracion/regionales/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Regional } from "@/lib/regionales/queries"
import { regionalSchema } from "@/lib/validations/regional"

type RegionalFormValues = z.infer<typeof regionalSchema>

type RegionalFormProps =
  | { mode: "crear" }
  | { mode: "editar"; regional: Regional }

export function RegionalForm(props: RegionalFormProps) {
  const mode = props.mode
  const regional = props.mode === "editar" ? props.regional : null
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegionalFormValues>({
    resolver: zodResolver(regionalSchema),
    defaultValues: {
      nombre: regional?.nombre ?? "",
    },
  })

  async function onSubmit(values: RegionalFormValues) {
    setServerError(null)

    const result = regional
      ? await actualizarRegional(regional.id, values)
      : await crearRegional(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/configuracion/regionales")
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
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear regional" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
