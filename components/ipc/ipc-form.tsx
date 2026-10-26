"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangleIcon, Loader2Icon } from "lucide-react"
import { cn } from "cn"

import {
  actualizarIpc,
  crearIpc,
} from "@/app/(dashboard)/ipc/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { formatearPorcentaje } from "@/lib/ipc/constantes"
import type {
  ContratoIpcOpcion,
  IpcConReferencia,
} from "@/lib/ipc/queries"
import { ipcSchema, type IpcInput } from "@/lib/validations/ipc"

type IpcFormProps = {
  mode: "crear" | "editar"
  contratos: ContratoIpcOpcion[]
  registro?: IpcConReferencia
  anioActual?: number
}

function aNumero(value: string) {
  return value === "" ? undefined : Number(value)
}

export function IpcForm({
  mode,
  contratos,
  registro,
  anioActual,
}: IpcFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IpcInput>({
    resolver: zodResolver(ipcSchema),
    defaultValues: {
      contrato_id: registro?.contrato_id ?? "",
      anio: registro?.anio ?? anioActual ?? new Date().getFullYear(),
      costo_usuario: registro?.costo_usuario,
      porcentaje_ipc: registro?.porcentaje_ipc,
    },
  })

  const contratoId = useWatch({ control, name: "contrato_id" })

  const aseguradores = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const contrato of contratos) {
      mapa.set(contrato.asegurador_id, contrato.asegurador_nombre)
    }
    return [...mapa.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
  }, [contratos])

  const [aseguradorSeleccionado, setAseguradorSeleccionado] = useState(
    registro?.contratos.asegurador_id ?? ""
  )

  const contratosDisponibles = useMemo(
    () =>
      aseguradorSeleccionado
        ? contratos.filter(
            (contrato) => contrato.asegurador_id === aseguradorSeleccionado
          )
        : [],
    [aseguradorSeleccionado, contratos]
  )

  const contratoSeleccionado = contratosDisponibles.find(
    (contrato) => contrato.id === contratoId
  )

  const aseguradoresItems = Object.fromEntries(
    aseguradores.map((asegurador) => [asegurador.id, asegurador.nombre])
  )

  const contratosItems = Object.fromEntries(
    contratosDisponibles.map((contrato) => [
      contrato.id,
      `${contrato.numero_contrato} — ${contrato.nombre}${
        contrato.en_ejecucion ? "" : " · No ejecución"
      }`,
    ])
  )

  async function onSubmit(values: IpcInput) {
    setServerError(null)

    const result = registro
      ? await actualizarIpc(registro.id, values)
      : await crearIpc(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/ipc")
    router.refresh()
  }

  const esEdicion = mode === "editar"

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-6"
    >
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-heading">Datos del registro IPC</CardTitle>
          <CardDescription>
            Selecciona el contrato y registra el costo usuario y el % IPC del año. Solo puede existir
            un registro por contrato y año.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Asegurador</FieldLabel>
                <Select
                  value={aseguradorSeleccionado}
                  onValueChange={(value) => {
                    setAseguradorSeleccionado(value ?? "")
                    setValue("contrato_id", "", { shouldValidate: false })
                  }}
                  items={aseguradoresItems}
                >
                  <SelectTrigger className="w-full" aria-label="Asegurador">
                    <SelectValue placeholder="Selecciona un asegurador" />
                  </SelectTrigger>
                  <SelectContent>
                    {aseguradores.map((asegurador) => (
                      <SelectItem key={asegurador.id} value={asegurador.id}>
                        {asegurador.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field data-invalid={!!errors.contrato_id}>
                <FieldLabel>Contrato</FieldLabel>
                <Controller
                  control={control}
                  name="contrato_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={contratosItems}
                      disabled={!aseguradorSeleccionado}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label="Contrato"
                        aria-invalid={!!errors.contrato_id}
                      >
                        <SelectValue
                          placeholder={
                            aseguradorSeleccionado
                              ? "Selecciona un contrato"
                              : "Primero selecciona un asegurador"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {contratosDisponibles.map((contrato) => (
                          <SelectItem
                            key={contrato.id}
                            value={contrato.id}
                            className={cn(
                              !contrato.en_ejecucion &&
                                "text-amber-800 data-highlighted:bg-amber-500/10 dark:text-amber-500"
                            )}
                          >
                            {contrato.numero_contrato} — {contrato.nombre}
                            {contrato.en_ejecucion ? null : " · No ejecución"}
                          </SelectItem>
                        ))}
                        {contratosDisponibles.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Este asegurador no tiene contratos disponibles.
                          </div>
                        ) : null}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.contrato_id]} />
                {contratoSeleccionado && !contratoSeleccionado.en_ejecucion ? (
                  <p className="flex items-start gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-500">
                    <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                    Este contrato no está en ejecución (
                    {contratoSeleccionado.estado_ejecucion ?? "sin estado"}). Se
                    registrará su IPC histórico.
                  </p>
                ) : null}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

              <Field data-invalid={!!errors.costo_usuario}>
                <FieldLabel htmlFor="costo_usuario">Costo usuario</FieldLabel>
                <Input
                  id="costo_usuario"
                  type="number"
                  step={0.01}
                  min={0}
                  placeholder="0.00"
                  aria-invalid={!!errors.costo_usuario}
                  {...register("costo_usuario", { setValueAs: aNumero })}
                />
                <FieldError errors={[errors.costo_usuario]} />
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
            </div>

            {registro?.ipc_nacional != null ? (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground">
                  IPC nacional de referencia ({registro.anio}):{" "}
                </span>
                <span className="font-semibold">
                  {formatearPorcentaje(registro.ipc_nacional)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · El % IPC actual del contrato es{" "}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    registro.estado === "debajo" && "text-destructive"
                  )}
                >
                  {formatearPorcentaje(registro.porcentaje_ipc)}
                </span>
              </div>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link
          href="/ipc"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Volver
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {esEdicion ? "Guardar cambios" : "Crear registro"}
        </Button>
      </div>
    </form>
  )
}
