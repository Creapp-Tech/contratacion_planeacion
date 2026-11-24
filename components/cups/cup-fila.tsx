"use client"

import { Fragment, useState, useTransition, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"

import { actualizarCupsInline } from "@/app/(dashboard)/configuracion/cups/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import type {
  CupsRow,
  GrupoServicioOption,
  ServicioOption,
} from "@/lib/cups/queries"

import { CupAcciones } from "./cups-acciones"

const SIN_ASIGNAR = "__none__"

// Evita que las etiquetas largas se corten dentro de la tabla.
const POPUP_STYLE: CSSProperties = {
  width: "max-content",
  minWidth: "var(--anchor-width)",
  maxWidth: "min(28rem, calc(100vw - 1rem))",
}

type CupFilaProps = {
  cup: CupsRow
  grupos: GrupoServicioOption[]
  servicios: ServicioOption[]
  puedeEditar: boolean
}

export function CupFila({
  cup,
  grupos,
  servicios,
  puedeEditar,
}: CupFilaProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [grupoId, setGrupoId] = useState(cup.grupo_id ?? SIN_ASIGNAR)
  const [servicioId, setServicioId] = useState(cup.servicio_id ?? SIN_ASIGNAR)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const grupoActual = cup.grupo_id
    ? {
        id: cup.grupo_id,
        nombre: cup.grupos_servicio?.nombre ?? "Grupo actual",
      }
    : null

  const servicioActual = cup.servicio_id
    ? {
        id: cup.servicio_id,
        nombre: cup.servicios?.nombre ?? "Servicio actual",
        grupo_id: cup.grupo_id,
      }
    : null

  const gruposOpciones = grupoActual && !grupos.some((g) => g.id === grupoActual.id)
    ? [...grupos, grupoActual]
    : grupos

  function serviciosDelGrupo(grupo: string): ServicioOption[] {
    const grupoIdReal = grupo === SIN_ASIGNAR ? null : grupo
    return servicios.filter((s) => s.grupo_id === grupoIdReal)
  }

  // Se incluye siempre el servicio guardado aunque esté inactivo o pertenezca
  // a otro grupo, para que el valor actual no aparezca vacío al editar.
  const serviciosOpciones = serviciosDelGrupo(grupoId)
  if (servicioActual && !serviciosOpciones.some((s) => s.id === servicioActual.id)) {
    serviciosOpciones.push(servicioActual)
  }

  function onEditar() {
    setError(null)
    setGrupoId(cup.grupo_id ?? SIN_ASIGNAR)
    setServicioId(cup.servicio_id ?? SIN_ASIGNAR)
    setEditing(true)
  }

  function onCancelar() {
    setError(null)
    setGrupoId(cup.grupo_id ?? SIN_ASIGNAR)
    setServicioId(cup.servicio_id ?? SIN_ASIGNAR)
    setEditing(false)
  }

  function onGuardar() {
    setError(null)
    startTransition(async () => {
      const result = await actualizarCupsInline(cup.id, {
        grupo_id: grupoId === SIN_ASIGNAR ? null : grupoId,
        servicio_id: servicioId === SIN_ASIGNAR ? null : servicioId,
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      setEditing(false)
      router.refresh()
    })
  }

  function cambiarGrupo(valor: string | null) {
    const siguiente = !valor || valor === SIN_ASIGNAR ? SIN_ASIGNAR : valor
    setGrupoId(siguiente)
    setServicioId((actual) => {
      if (actual === SIN_ASIGNAR) return actual
      return serviciosDelGrupo(siguiente).some((s) => s.id === actual)
        ? actual
        : SIN_ASIGNAR
    })
  }

  function cambiarServicio(valor: string | null) {
    const siguiente = !valor || valor === SIN_ASIGNAR ? SIN_ASIGNAR : valor
    setServicioId(siguiente)

    if (siguiente === SIN_ASIGNAR) return

    const servicio = servicios.find((s) => s.id === siguiente) ?? servicioActual
    setGrupoId(servicio?.grupo_id ?? SIN_ASIGNAR)
  }

  function celdaValor(valor: string | null, etiqueta: string) {
    if (!puedeEditar) {
      return <span className="text-muted-foreground">{valor ?? "—"}</span>
    }

    return (
      <button
        type="button"
        className="w-full cursor-pointer rounded text-left text-muted-foreground outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onEditar}
        aria-label={`Editar ${etiqueta} de ${cup.codigo}`}
        title="Haz clic para editar"
      >
        {valor ?? "—"}
      </button>
    )
  }

  function celdaSelect(
    etiqueta: string,
    valor: string,
    opciones: { value: string; label: string }[],
    onChange: (valor: string | null) => void,
    disabled = false,
    autoFocus = false
  ) {
    return (
      <TableCell className="p-1.5">
        <Select
          value={valor}
          onValueChange={onChange}
          items={Object.fromEntries(opciones.map((o) => [o.value, o.label]))}
          disabled={disabled || pending}
        >
          <SelectTrigger
            size="sm"
            className="w-full min-w-40"
            aria-label={`${etiqueta} de ${cup.codigo}`}
            autoFocus={autoFocus}
          >
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent style={POPUP_STYLE}>
            {opciones.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    )
  }

  return (
    <Fragment>
      <TableRow
        className={editing ? "bg-muted/40" : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape" && editing) onCancelar()
        }}
      >
        <TableCell className="font-medium">{cup.codigo}</TableCell>
        <TableCell>{cup.nombre}</TableCell>

        {editing
          ? celdaSelect(
              "Grupo de servicio",
              grupoId,
              [
                { value: SIN_ASIGNAR, label: "Sin asignar" },
                ...gruposOpciones.map((g) => ({ value: g.id, label: g.nombre })),
              ],
              cambiarGrupo,
              false,
              true
            )
          : (
            <TableCell>
              {celdaValor(cup.grupos_servicio?.nombre ?? null, "grupo de servicio")}
            </TableCell>
          )}

        {editing
          ? celdaSelect(
              "Servicio",
              servicioId,
              [
                { value: SIN_ASIGNAR, label: "Sin asignar" },
                ...serviciosOpciones.map((s) => ({ value: s.id, label: s.nombre })),
              ],
              cambiarServicio,
              grupoId === SIN_ASIGNAR
            )
          : (
            <TableCell>
              {celdaValor(cup.servicios?.nombre ?? null, "servicio")}
            </TableCell>
          )}

        <TableCell>{cup.version_resolucion}</TableCell>

        <TableCell>
          {editing ? (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Guardar cambios de ${cup.codigo}`}
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
            <CupAcciones
              id={cup.id}
              nombre={cup.nombre}
              codigo={cup.codigo}
              onEditar={onEditar}
              puedeEditar={puedeEditar}
            />
          )}
        </TableCell>
      </TableRow>

      {error && editing ? (
        <TableRow>
          <TableCell colSpan={6} className="p-0">
            <Alert variant="destructive" className="m-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  )
}
