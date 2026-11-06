"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition, type CSSProperties } from "react"
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

const ALL = "__all__"

// El popup se dimensiona al contenido para que las etiquetas largas
// no queden recortadas, pero nunca por debajo del ancho del disparador
// ni fuera de la pantalla.
const POPUP_STYLE: CSSProperties = {
  width: "max-content",
  minWidth: "var(--anchor-width)",
  maxWidth: "min(28rem, calc(100vw - 1rem))",
}

type GrupoOption = { id: string; nombre: string }
type ServicioOption = { id: string; nombre: string }

type FiltroSelectProps = {
  id: string
  value: string | undefined
  placeholder: string
  items: Record<string, string>
  options: { value: string; label: string }[]
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

function FiltroSelect({
  id,
  value,
  placeholder,
  items,
  options,
  onChange,
  disabled = false,
}: FiltroSelectProps) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) =>
        onChange(next === ALL || next == null ? undefined : next)
      }
      items={items}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full sm:w-52">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent style={POPUP_STYLE}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CupsFiltros({
  grupos,
  capitulos,
  secciones,
  q,
  capitulo,
  seccion,
  grupo_id,
  servicio_id,
}: {
  grupos: GrupoOption[]
  capitulos: string[]
  secciones: string[]
  q?: string
  capitulo?: string
  seccion?: string
  grupo_id?: string
  servicio_id?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [qState, setQ] = useState(q ?? "")
  const [qPrevio, setQPrevio] = useState(q)
  // Servicios almacenados por grupo para evitar recargas innecesarias y errores de setState en efecto
  const [serviciosPorGrupo, setServiciosPorGrupo] = useState<Record<string, ServicioOption[]>>({})

  if (q !== qPrevio) {
    setQPrevio(q)
    setQ(q ?? "")
  }

  // Cargar los servicios del grupo seleccionado (incluye la carga inicial
  // cuando la vista se abre con un grupo ya filtrado en la URL).
  useEffect(() => {
    if (!grupo_id) return

    let cancelado = false
    // Evitar solicitud si ya tenemos servicios para este grupo
    if (serviciosPorGrupo[grupo_id] !== undefined) return

    obtenerServiciosPorGrupo(grupo_id)
      .then((result) => {
        if (cancelado) return
        setServiciosPorGrupo((prev) => ({ ...prev, [grupo_id]: "success" in result ? result.servicios : [] }))
      })
      .catch(() => {
        if (cancelado) return
        setServiciosPorGrupo((prev) => ({ ...prev, [grupo_id]: [] }))
      })

    return () => {
      cancelado = true
    }
  }, [grupo_id, serviciosPorGrupo])

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const grupoOptions = [
    { value: ALL, label: "Todos los grupos" },
    ...grupos.map((grupo) => ({ value: grupo.id, label: grupo.nombre })),
  ]

  // Servicios actuales para el grupo seleccionado (o vacío si no hay grupo)
  const serviciosActuales = grupo_id ? serviciosPorGrupo[grupo_id] || [] : []

  const servicioOptions = [
    { value: ALL, label: "Todos los servicios" },
    ...serviciosActuales.map((servicio) => ({
      value: servicio.id,
      label: servicio.nombre,
    })),
  ]

  const capituloOptions = [
    { value: ALL, label: "Todos los capítulos" },
    ...capitulos.map((valor) => ({ value: valor, label: valor })),
  ]

  const seccionOptions = [
    { value: ALL, label: "Todas las secciones" },
    ...secciones.map((valor) => ({ value: valor, label: valor })),
  ]

  const hasFiltros = Boolean(
    q || capitulo || seccion || grupo_id || servicio_id
  )

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
          placeholder="Buscar por código, nombre o descripción"
          className="pl-8"
          aria-label="Buscar CUPS por código, nombre o descripción"
        />
      </form>

      <FiltroSelect
        id="filtro-grupo"
        value={grupo_id}
        placeholder="Grupo de servicio"
        items={Object.fromEntries(
          grupoOptions.map((option) => [option.value, option.label])
        )}
        options={grupoOptions}
        onChange={(value) =>
          updateParams({ grupo: value, servicio: undefined })
        }
      />

      <FiltroSelect
        id="filtro-servicio"
        value={servicio_id}
        placeholder="Servicio"
        items={Object.fromEntries(
          servicioOptions.map((option) => [option.value, option.label])
        )}
        options={servicioOptions}
        onChange={(value) => updateParams({ servicio: value })}
        disabled={!grupo_id}
      />

      <FiltroSelect
        id="filtro-capitulo"
        value={capitulo}
        placeholder="Capítulo"
        items={Object.fromEntries(
          capituloOptions.map((option) => [option.value, option.label])
        )}
        options={capituloOptions}
        onChange={(value) => updateParams({ capitulo: value })}
      />

      <FiltroSelect
        id="filtro-seccion"
        value={seccion}
        placeholder="Sección"
        items={Object.fromEntries(
          seccionOptions.map((option) => [option.value, option.label])
        )}
        options={seccionOptions}
        onChange={(value) => updateParams({ seccion: value })}
      />

      {hasFiltros ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ("")
            startTransition(() => router.replace(pathname))
          }}
        >
          <XIcon />
          Limpiar
        </Button>
      ) : null}

      {pending ? (
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  )
}