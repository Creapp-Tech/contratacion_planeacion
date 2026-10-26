"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"

import {
  actualizarIpcNacional,
  crearIpcNacional,
} from "@/app/(dashboard)/configuracion/ipc-nacional/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PAIS_IPC_COMPARACION } from "@/lib/ipc/constantes"
import type { IpcNacionalRow } from "@/lib/ipc/queries"
import {
  ipcNacionalSchema,
  type IpcNacionalInput,
} from "@/lib/validations/ipc"

type IpcNacionalFormProps =
  | { mode: "crear"; anioActual: number }
  | { mode: "editar"; registro: IpcNacionalRow }

function aNumero(value: string) {
  return value === "" ? undefined : Number(value)
}

export function IpcNacionalForm(props: IpcNacionalFormProps) {
  const mode = props.mode
  const registro = props.mode === "editar" ? props.registro : null
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IpcNacionalInput>({
    resolver: zodResolver(ipcNacionalSchema),
    defaultValues: {
      pais: registro?.pais ?? PAIS_IPC_COMPARACION,
      anio: registro?.anio ?? (props.mode === "crear" ? props.anioActual : 0),
      porcentaje_ipc: registro?.porcentaje_ipc,
      valor_upc_contributivo: registro?.valor_upc_contributivo,
      valor_upc_subsidiado: registro?.valor_upc_subsidiado ?? undefined,
    },
  })

  async function onSubmit(values: IpcNacionalInput) {
    setServerError(null)

    const result = registro
      ? await actualizarIpcNacional(registro.id, values)
      : await crearIpcNacional(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/configuracion/ipc-nacional")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.pais}>
          <FieldLabel htmlFor="pais">País</FieldLabel>
          <Input
            id="pais"
            autoComplete="off"
            placeholder="Colombia"
            aria-invalid={!!errors.pais}
            {...register("pais")}
          />
          <FieldDescription>
            El comparativo del dashboard usa el registro de{" "}
            {PAIS_IPC_COMPARACION}.
          </FieldDescription>
          <FieldError errors={[errors.pais]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field data-invalid={!!errors.anio}>
            <FieldLabel htmlFor="anio">Año</FieldLabel>
            <Input
              id="anio"
              type="number"
              step={1}
              min={2000}
              max={2100}
              aria-invalid={!!errors.anio}
              {...register("anio", { setValueAs: aNumero })}
            />
            <FieldError errors={[errors.anio]} />
          </Field>

          <Field data-invalid={!!errors.porcentaje_ipc}>
            <FieldLabel htmlFor="porcentaje_ipc">% IPC</FieldLabel>
            <Input
              id="porcentaje_ipc"
              type="number"
              step={0.001}
              min={-100}
              max={100}
              placeholder="0.000"
              aria-invalid={!!errors.porcentaje_ipc}
              {...register("porcentaje_ipc", { setValueAs: aNumero })}
            />
            <FieldError errors={[errors.porcentaje_ipc]} />
          </Field>

          <Field data-invalid={!!errors.valor_upc_contributivo}>
            <FieldLabel htmlFor="valor_upc_contributivo">
              Valor UPC (Régimen Contributivo)
            </FieldLabel>
            <Input
              id="valor_upc_contributivo"
              type="number"
              step={0.01}
              min={0}
              placeholder="0.00"
              aria-invalid={!!errors.valor_upc_contributivo}
              {...register("valor_upc_contributivo", {
                setValueAs: aNumero,
              })}
            />
            <FieldError errors={[errors.valor_upc_contributivo]} />
          </Field>

          <Field data-invalid={!!errors.valor_upc_subsidiado}>
            <FieldLabel htmlFor="valor_upc_subsidiado">
              Valor UPC (Régimen Subsidiado)
            </FieldLabel>
            <Input
              id="valor_upc_subsidiado"
              type="number"
              step={0.01}
              min={0}
              placeholder="0.00"
              aria-invalid={!!errors.valor_upc_subsidiado}
              {...register("valor_upc_subsidiado", { setValueAs: aNumero })}
            />
            <FieldDescription>
              Opcional si aún no se tiene el valor.
            </FieldDescription>
            <FieldError errors={[errors.valor_upc_subsidiado]} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear registro" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
