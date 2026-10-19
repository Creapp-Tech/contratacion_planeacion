"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"

import {
  actualizarCatalogo,
  crearCatalogo,
} from "@/lib/catalogos/actions"
import { CATALOGOS, type CatalogoDominio } from "@/lib/catalogos/dominios"
import type { CatalogoItem } from "@/lib/catalogos/queries"
import { catalogoSchema, type CatalogoInput } from "@/lib/validations/catalogo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type CatalogoFormProps =
  | { mode: "crear"; dominio: CatalogoDominio }
  | { mode: "editar"; dominio: CatalogoDominio; item: CatalogoItem }

export function CatalogoForm(props: CatalogoFormProps) {
  const { mode, dominio } = props
  const config = CATALOGOS[dominio]
  const item = props.mode === "editar" ? props.item : null
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CatalogoInput>({
    resolver: zodResolver(catalogoSchema),
    defaultValues: {
      nombre: item?.nombre ?? "",
      descripcion: item?.descripcion ?? "",
    },
  })

  async function onSubmit(values: CatalogoInput) {
    setServerError(null)

    const result =
      mode === "editar" && item
        ? await actualizarCatalogo(dominio, item.id, values)
        : await crearCatalogo(dominio, values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push(config.ruta)
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

        {config.usaDescripcion ? (
          <Field data-invalid={!!errors.descripcion}>
            <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
            <Textarea
              id="descripcion"
              rows={3}
              autoComplete="off"
              aria-invalid={!!errors.descripcion}
              {...register("descripcion")}
            />
            <FieldError errors={[errors.descripcion]} />
          </Field>
        ) : null}
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? `Crear ${config.singular}` : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
