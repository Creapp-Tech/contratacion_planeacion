"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  crearServicioCups,
  actualizarServicioCups,
} from "@/app/(dashboard)/aseguradores-contratos/actions"
import { BuscadorCups } from "@/components/prestadores-contratos/buscador-cups"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import { RUTA } from "@/lib/aseguradores-contratos/constantes"
import type {
  OpcionesAseguradoresContratos,
  ServicioCupsListaFila,
} from "@/lib/aseguradores-contratos/types"
import { CLASE_SELECT } from "@/lib/prestadores-contratos/ui"
import {
  servicioCupsSchema,
  type ServicioCupsInput,
} from "@/lib/validations/aseguradores-contratos"

function texto(valor: unknown): string {
  return valor == null ? "" : String(valor)
}

export function ServicioCupsForm({
  opciones,
  servicio,
}: {
  opciones: OpcionesAseguradoresContratos
  servicio?: ServicioCupsListaFila
}) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const aseguradorInicial =
    servicio?.asegurador_id ?? opciones.aseguradores[0]?.id ?? ""
  const contratoInicial =
    servicio?.contrato_id ??
    opciones.contratos.find(
      (contrato) => contrato.asegurador_id === aseguradorInicial
    )?.id ??
    ""
  const valores: ServicioCupsInput = {
    asegurador_id: aseguradorInicial,
    contrato_id: contratoInicial,
    cups_asegurador: servicio?.cups_asegurador ?? "",
    cups_id: servicio?.cups_id ?? "",
    frecuencia_uso_contratada: texto(servicio?.frecuencia_uso_contratada ?? ""),
    cme_contratado: texto(servicio?.cme_contratado ?? ""),
  }

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServicioCupsInput>({
    resolver: zodResolver(servicioCupsSchema),
    defaultValues: valores,
  })

  const aseguradorId = useWatch({ control, name: "asegurador_id" })
  const cupsId = useWatch({ control, name: "cups_id" })
  const contratos = opciones.contratos.filter(
    (contrato) => contrato.asegurador_id === aseguradorId
  )

  async function onSubmit(values: ServicioCupsInput) {
    setServerError(null)
    const resultado = servicio
      ? await actualizarServicioCups(servicio.id, values)
      : await crearServicioCups(values)

    if ("error" in resultado) {
      setServerError(resultado.error)
      return
    }
    router.push(RUTA)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {servicio ? "Editar servicio CUPS" : "Nuevo servicio CUPS"}
        </CardTitle>
        <CardDescription>
          Asocia el CUPS manejado por el asegurador con su contrato y define la
          frecuencia de uso y el CME.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.asegurador_id}>
              <FieldLabel htmlFor="asegurador_id">Asegurador</FieldLabel>
              <select
                id="asegurador_id"
                className={CLASE_SELECT}
                aria-invalid={!!errors.asegurador_id}
                {...register("asegurador_id", {
                  onChange: (event) => {
                    const id = (event.target as HTMLSelectElement).value
                    const primero = opciones.contratos.find(
                      (contrato) => contrato.asegurador_id === id
                    )?.id
                    setValue("contrato_id", primero ?? "")
                  },
                })}
              >
                <option value="">Selecciona un asegurador</option>
                {opciones.aseguradores.map((asegurador) => (
                  <option key={asegurador.id} value={asegurador.id}>
                    {asegurador.nombre}
                  </option>
                ))}
              </select>
              <FieldError>{errors.asegurador_id?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.contrato_id}>
              <FieldLabel htmlFor="contrato_id">Contrato</FieldLabel>
              <select
                id="contrato_id"
                className={CLASE_SELECT}
                disabled={!aseguradorId || contratos.length === 0}
                aria-invalid={!!errors.contrato_id}
                {...register("contrato_id")}
              >
                <option value="">
                  {contratos.length === 0
                    ? "Sin contratos para el asegurador"
                    : "Selecciona un contrato"}
                </option>
                {contratos.map((contrato) => (
                  <option key={contrato.id} value={contrato.id}>
                    {contrato.numero_contrato} · {contrato.nombre}
                  </option>
                ))}
              </select>
              <FieldError>{errors.contrato_id?.message}</FieldError>
            </Field>

            <Field className="md:col-span-2" data-invalid={!!errors.cups_asegurador}>
              <FieldLabel htmlFor="cups_asegurador">CUPS asegurador</FieldLabel>
              <Input
                id="cups_asegurador"
                placeholder="Código o descripción manejada por el asegurador"
                aria-invalid={!!errors.cups_asegurador}
                {...register("cups_asegurador")}
              />
              <FieldError>{errors.cups_asegurador?.message}</FieldError>
            </Field>

            <Field className="md:col-span-2" data-invalid={!!errors.cups_id}>
              <FieldLabel>CUPS resolución (opcional)</FieldLabel>
              <div className="flex items-start gap-2">
                <Controller
                  control={control}
                  name="cups_id"
                  render={({ field }) => (
                    <div className="flex-1">
                      <BuscadorCups
                        value={texto(field.value)}
                        onValueChange={field.onChange}
                        labelInicial={
                          servicio?.cupsResolucion
                            ? `${servicio.cupsResolucion.codigo} — ${
                                servicio.cupsResolucion.nombre ?? ""
                              }`
                            : null
                        }
                        ariaInvalid={!!errors.cups_id}
                      />
                    </div>
                  )}
                />
                {cupsId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue("cups_id", "")}
                  >
                    Quitar
                  </Button>
                ) : null}
              </div>
              <FieldError>{errors.cups_id?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.frecuencia_uso_contratada}>
              <FieldLabel htmlFor="frecuencia_uso_contratada">
                Frecuencia de uso contratada (opcional)
              </FieldLabel>
              <Input
                id="frecuencia_uso_contratada"
                type="number"
                min="0"
                step="any"
                placeholder="Ej. 1.55555555"
                aria-invalid={!!errors.frecuencia_uso_contratada}
                {...register("frecuencia_uso_contratada")}
              />
              <FieldError>{errors.frecuencia_uso_contratada?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.cme_contratado}>
              <FieldLabel htmlFor="cme_contratado">
                CME Asegurador (opcional)
              </FieldLabel>
              <Input
                id="cme_contratado"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 125000"
                aria-invalid={!!errors.cme_contratado}
                {...register("cme_contratado")}
              />
              <FieldError>{errors.cme_contratado?.message}</FieldError>
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {servicio ? "Guardar cambios" : "Crear servicio CUPS"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push(RUTA)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
