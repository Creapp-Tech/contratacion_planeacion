"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { IpcFiltros, OpcionesIpc } from "@/lib/ipc/queries"

const ALL = "__all__"

type FiltroSelectProps = {
  id: string
  value: string | undefined
  placeholder: string
  items: Record<string, string>
  options: { value: string; label: string }[]
  onChange: (value: string | undefined) => void
}

function FiltroSelect({
  id,
  value,
  placeholder,
  items,
  options,
  onChange,
}: FiltroSelectProps) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) =>
        onChange(next === ALL || next == null ? undefined : next)
      }
      items={items}
    >
      <SelectTrigger id={id} className="w-full sm:w-52" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function IpcFiltros({
  opciones,
  filtros,
  verRegional,
}: {
  opciones: OpcionesIpc
  filtros: IpcFiltros
  verRegional: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

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
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  const aseguradorItems = Object.fromEntries([
    [ALL, "Todos los aseguradores"],
    ...opciones.aseguradores.map((asegurador) => [
      asegurador.id,
      asegurador.nombre,
    ]),
  ])

  const aseguradorOptions = [
    { value: ALL, label: "Todos los aseguradores" },
    ...opciones.aseguradores.map((asegurador) => ({
      value: asegurador.id,
      label: asegurador.nombre,
    })),
  ]

  const contratos = filtros.asegurador
    ? opciones.contratos.filter(
        (contrato) => contrato.asegurador_id === filtros.asegurador
      )
    : opciones.contratos

  const contratoItems = Object.fromEntries([
    [ALL, "Todos los contratos"],
    ...contratos.map((contrato) => [
      contrato.id,
      `${contrato.numero_contrato} — ${contrato.nombre}`,
    ]),
  ])

  const contratoOptions = [
    { value: ALL, label: "Todos los contratos" },
    ...contratos.map((contrato) => ({
      value: contrato.id,
      label: `${contrato.numero_contrato} — ${contrato.nombre}`,
    })),
  ]

  const anios = filtros.anio
    ? [...new Set([...opciones.anios, Number(filtros.anio)])]
    : opciones.anios

  const anioItems = Object.fromEntries([
    [ALL, "Todos los años"],
    ...anios.map((anio) => [String(anio), String(anio)]),
  ])

  const anioOptions = [
    { value: ALL, label: "Todos los años" },
    ...anios.map((anio) => ({ value: String(anio), label: String(anio) })),
  ]

  const regionalItems = Object.fromEntries([
    [ALL, "Todas las regionales"],
    ...opciones.regionales.map((regional) => [regional.id, regional.nombre]),
  ])

  const regionalOptions = [
    { value: ALL, label: "Todas las regionales" },
    ...opciones.regionales.map((regional) => ({
      value: regional.id,
      label: regional.nombre,
    })),
  ]

  const hasFiltros = Boolean(
    filtros.regional || filtros.contrato || filtros.asegurador || filtros.anio
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <FiltroSelect
        id="filtro-ipc-asegurador"
        value={filtros.asegurador}
        placeholder="Asegurador"
        items={aseguradorItems}
        options={aseguradorOptions}
        onChange={(value) =>
          updateParams({ asegurador: value, contrato: undefined })
        }
      />

      <FiltroSelect
        id="filtro-ipc-contrato"
        value={filtros.contrato}
        placeholder="Contrato"
        items={contratoItems}
        options={contratoOptions}
        onChange={(value) => updateParams({ contrato: value })}
      />

      {verRegional ? (
        <FiltroSelect
          id="filtro-ipc-regional"
          value={filtros.regional}
          placeholder="Regional"
          items={regionalItems}
          options={regionalOptions}
          onChange={(value) => updateParams({ regional: value })}
        />
      ) : null}

      <FiltroSelect
        id="filtro-ipc-anio"
        value={filtros.anio}
        placeholder="Año"
        items={anioItems}
        options={anioOptions}
        onChange={(value) => updateParams({ anio: value })}
      />

      {hasFiltros ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            const tab = searchParams.get("tab")
            startTransition(() => {
              router.replace(tab ? `${pathname}?tab=${tab}` : pathname)
            })
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
