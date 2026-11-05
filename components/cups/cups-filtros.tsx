"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, type CSSProperties } from "react"
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { obtenerServiciosPorGrupo } from "@/app/(dashboard)/configuracion/cups/actions"

const POPUP_STYLE: CSSProperties = {
  width: "max-content",
  minWidth: "var(--anchor-width)",
  maxWidth: "min(28rem, calc(100vw - 1rem))",
}

type GrupoOption = { id: string; nombre: string }
type ServicioOption = { id: string; nombre: string }

export function CupsFiltros({
  grupos,
  q,
  seccion,
  version,
  activo,
  grupo_id,
  servicio_id,
}: {
  grupos: GrupoOption[]
  q?: string
  seccion?: string
  version?: string
  activo?: boolean | string
  grupo_id?: string
  servicio_id?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [qState, setQ] = useState(q ?? "")
  const [servicios, setServicios] = useState<ServicioOption[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(grupo_id ?? "")
  const [servicioSeleccionadoNombre, setServicioSeleccionadoNombre] = useState("")

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const activoValue = activo === true || activo === "true" ? "true" : activo === false || activo === "false" ? "false" : undefined

  async function manejarCambioGrupo(value: string) {
    if (value === "") {
      setGrupoSeleccionado("")
      setServicioSeleccionadoNombre("")
      updateParams({ grupo: undefined, servicio: undefined })
      setServicios([])
      return
    }

    setGrupoSeleccionado(value)
    setServicioSeleccionadoNombre("")

    const result = await obtenerServiciosPorGrupo(value)
    if ("error" in result) {
      setServicios([])
      return
    }
    setServicios(result.servicios)

    updateParams({ grupo: value, servicio: undefined })
  }

  const grupoOptions = [
    { value: "", label: "Todos los grupos" },
    ...grupos.map((g) => ({ value: g.id, label: g.nombre })),
  ]

  const servicioOptions = [
    { value: "", label: "Todos los servicios" },
    ...servicios.map((s: ServicioOption) => ({ value: s.id, label: s.nombre })),
  ]

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative w-full sm:w-64 sm:flex-none"
        onSubmit={(event) => {
          event.preventDefault()
          updateParams({ q: qState.trim() || undefined })
        }}
      >
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={qState}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por código o descripción"
          className="pl-8"
          aria-label="Buscar CUPS por código o descripción"
        />
      </form>

      <div className="flex gap-2 sm:items-center">
        <Select
          value={grupoSeleccionado}
          onValueChange={(value) => manejarCambioGrupo(value === null ? "" : value)}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Grupo de servicio">
              {grupoSeleccionado === ""
                ? "Todos los grupos"
                : grupos.find((g) => g.id === grupoSeleccionado)?.nombre}
            </SelectValue>
          </SelectTrigger>
          <SelectContent style={POPUP_STYLE}>
            {grupoOptions.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={servicio_id ?? ""}
          onValueChange={(value) => {
            const val = value === null ? "" : String(value)
            if (!val) {
              setServicioSeleccionadoNombre("")
              updateParams({ servicio: undefined })
              return
            }
            const svc = servicios.find((s) => s.id === val)
            setServicioSeleccionadoNombre(svc ? svc.nombre : "")
            updateParams({ servicio: val })
          }}
          disabled={!grupoSeleccionado}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Servicio">
              {servicioSeleccionadoNombre}
            </SelectValue>
          </SelectTrigger>
          <SelectContent style={POPUP_STYLE}>
            {servicioOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateParams({ seccion: undefined })}
          disabled={!seccion}
        >
          {seccion ? `Quitar: ${seccion}` : "Sección"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateParams({ version: undefined })}
          disabled={!version}
        >
          {version ? `Quitar: ${version}` : "Versión"}
        </Button>

        {activoValue !== undefined ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateParams({ activo: undefined })}
          >
            {activoValue === "true" ? "Mostrar inactivos" : "Mostrar activos"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateParams({ activo: "true" })}
          >
            Mostrar activos
          </Button>
        )}

        {pending ? (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {Boolean(qState) || seccion || version || grupo_id || servicio_id || activoValue !== undefined ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ("")
            setGrupoSeleccionado("")
            setServicios([])
            startTransition(() => router.replace(pathname))
          }}
        >
          <XIcon /> Limpiar
        </Button>
      ) : null}
    </div>
  )
}
