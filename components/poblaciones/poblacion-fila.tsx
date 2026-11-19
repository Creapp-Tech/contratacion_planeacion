"use client"

import { Fragment, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"

import { actualizarPoblacionInline } from "@/lib/poblaciones/actions"
import type { PoblacionFila } from "@/lib/poblaciones/queries"
import { formatoNumero } from "@/lib/sedes/ocupacion-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"

import { PoblacionAcciones } from "./poblacion-acciones"

type Valores = {
  activa: string
  pagada: string
  certificada: string
}

function valoresDe(fila: PoblacionFila): Valores {
  return {
    activa: String(fila.poblacion_activa ?? 0),
    pagada: String(fila.poblacion_pagada ?? 0),
    certificada: String(fila.poblacion_certificada ?? 0),
  }
}

function aNumero(valor: string) {
  const texto = valor.trim()
  return texto === "" ? NaN : Number(texto)
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—"
  const partes = fecha.split("-")
  if (partes.length !== 3) return fecha
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
    new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  )
}

export function PoblacionFila({
  fila,
  puedeEditar,
}: {
  fila: PoblacionFila
  puedeEditar: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [valores, setValores] = useState<Valores>(() => valoresDe(fila))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const nombre = `${fila.sedes?.nombre ?? "Sede"} · ${
    fila.aseguradores_eps?.nombre_eps ?? "Asegurador"
  } · ${fila.regimenes?.nombre ?? "Régimen"}`

  function onEditar() {
    setError(null)
    setValores(valoresDe(fila))
    setEditing(true)
  }

  function onCancelar() {
    setError(null)
    setValores(valoresDe(fila))
    setEditing(false)
  }

  function onGuardar() {
    setError(null)
    startTransition(async () => {
      const result = await actualizarPoblacionInline(fila.id, {
        poblacion_activa: aNumero(valores.activa),
        poblacion_pagada: aNumero(valores.pagada),
        poblacion_certificada: aNumero(valores.certificada),
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      setEditing(false)
      router.refresh()
    })
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      onGuardar()
    }
    if (event.key === "Escape") onCancelar()
  }

  function celdaEditable(
    campo: keyof Valores,
    etiqueta: string,
    valor: number | null,
    autoFocus = false
  ) {
    if (editing) {
      return (
        <Input
          type="number"
          min={0}
          step={1}
          className="h-8 w-full min-w-24 text-right tabular-nums"
          autoFocus={autoFocus}
          value={valores[campo]}
          aria-label={`${etiqueta} de ${nombre}`}
          aria-invalid={!!error}
          disabled={pending}
          onChange={(event) =>
            setValores((actuales) => ({
              ...actuales,
              [campo]: event.target.value,
            }))
          }
          onKeyDown={onKeyDown}
        />
      )
    }

    if (!puedeEditar) {
      return <span className="tabular-nums">{formatoNumero(valor)}</span>
    }

    return (
      <button
        type="button"
        className="w-full cursor-pointer rounded text-right tabular-nums outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onEditar}
        aria-label={`Editar ${etiqueta} de ${nombre}`}
        title="Haz clic para editar"
      >
        {formatoNumero(valor)}
      </button>
    )
  }

  return (
    <Fragment>
      <TableRow className={editing ? "bg-muted/40" : undefined}>
        <TableCell className="font-medium">
          {fila.sedes?.nombre ?? "—"}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {fila.aseguradores_eps?.nombre_eps ?? "—"}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {fila.regimenes?.nombre ?? "—"}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {celdaEditable("activa", "Población activa", fila.poblacion_activa, true)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {celdaEditable("pagada", "Población pagada", fila.poblacion_pagada)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {celdaEditable(
            "certificada",
            "Población certificada",
            fila.poblacion_certificada
          )}
        </TableCell>
        <TableCell
          className="text-muted-foreground"
          title="Se actualiza automáticamente al guardar"
        >
          {formatearFecha(fila.fecha_actualizacion)}
        </TableCell>
        <TableCell>
          {editing ? (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Guardar población"
                disabled={pending}
                onClick={onGuardar}
              >
                {pending ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <CheckIcon />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Cancelar edición"
                disabled={pending}
                onClick={onCancelar}
              >
                <XIcon />
              </Button>
            </div>
          ) : (
            <PoblacionAcciones
              id={fila.id}
              nombre={nombre}
              puedeEditar={puedeEditar}
              onEditar={onEditar}
            />
          )}
        </TableCell>
      </TableRow>

      {error && editing ? (
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <Alert variant="destructive" className="m-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  )
}
