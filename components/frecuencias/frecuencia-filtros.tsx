"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useTransition } from "react"
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
import type {
  FrecuenciaFiltros,
  OpcionesFiltrosFrecuencias,
} from "@/lib/frecuencias/queries"
import { listMunicipiosByDepartamento } from "@/lib/sedes/queries"

const ALL = "__all__"

function toItems(placeholder: string, values: string[]) {
  return Object.fromEntries([
    [ALL, placeholder],
    ...values.map((value) => [value, value]),
  ])
}

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
      <SelectTrigger id={id} className="w-full sm:w-48">
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

export function FrecuenciaFiltros({
  opciones,
  filtros,
}: {
  opciones: OpcionesFiltrosFrecuencias
  filtros: FrecuenciaFiltros
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [departamento, setDepartamento] = useState<string | undefined>(
    filtros.departamento
  )
  const [municipio, setMunicipio] = useState<string | undefined>(filtros.municipio)

  const [municipioOptions, setMunicipioOptions] = useState<{
    value: string
    label: string
  }[]>([])

  const { q, tipo_frecuencia, sede_id, regional, regimen_id, asegurador_eps_id } =
    filtros

  useEffect(() => {
    async function cargarMunicipios() {
      if (departamento) {
        const municipios = await listMunicipiosByDepartamento(departamento)
        setMunicipioOptions(
          municipios.map((m) => ({ value: m, label: m }))
        )
        setMunicipio(undefined)
      } else {
        setMunicipioOptions(
          opciones.departamentos
            .filter((d) => d !== ALL)
            .map((d) => ({ value: d, label: d }))
        )
        setMunicipio(undefined)
      }
    }
    cargarMunicipios()
  }, [departamento])

  const tipoSelect = {
    items: Object.fromEntries([
      [ALL, "Todos los tipos"],
      ...TIPOS_FRECUENCIA.map((item) => [item.value, item.label]),
    ]),
    options: [
      { value: ALL, label: "Todos los tipos" },
      ...TIPOS_FRECUENCIA.map((item) => ({ value: item.value, label: item.label })),
    ],
  }

  const regionalSelect = {
    items: Object.fromEntries([
      [ALL, "Todas las regionales"],
      ...opciones.regionales.map((nombre) => [nombre, nombre]),
    ]),
    options: [
      { value: ALL, label: "Todas las regionales" },
      ...opciones.regionales.map((nombre) => ({ value: nombre, label: nombre })),
    ],
  }

  const sedeSelect = {
    items: Object.fromEntries([
      [ALL, "Todas las sedes"],
      ...opciones.sedes.map((sede) => [sede.id, sede.nombre]),
    ]),
    options: [
      { value: ALL, label: "Todas las sedes" },
      ...opciones.sedes.map((sede) => ({ value: sede.id, label: sede.nombre })),
    ],
  }

  const regimenSelect = {
    items: Object.fromEntries([
      [ALL, "Todos los regímenes"],
      ...opciones.regimenes.map((item) => [item.id, item.nombre]),
    ]),
    options: [
      { value: ALL, label: "Todos los regímenes" },
      ...opciones.regimenes.map((item) => ({ value: item.id, label: item.nombre })),
    ],
  }

  const aseguradorSelect = {
    items: Object.fromEntries([
      [ALL, "Todos los aseguradores"],
      ...opciones.aseguradores.map((item) => [item.id, item.nombre]),
    ]),
    options: [
      { value: ALL, label: "Todos los aseguradores" },
      ...opciones.aseguradores.map((item) => ({ value: item.id, label: item.nombre })),
    ],
  }

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

  const hasFiltros = Boolean(
    q ||
      tipo_frecuencia ||
      sede_id ||
      regional ||
      regimen_id ||
      asegurador_eps_id ||
      departamento ||
      municipio
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative flex-1 sm:min-w-64"
        onSubmit={(event) => {
          event.preventDefault()
          updateParams({ q: q.trim() || undefined })
        }}
      >
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por nota técnica"
          className="pl-8"
          aria-label="Buscar frecuencias"
        />
      </form>

      <FiltroSelect
        id="filtro-tipo"
        value={tipo_frecuencia}
        placeholder="Tipo de frecuencia"
        items={tipoSelect.items}
        options={tipoSelect.options}
        onChange={(value) => updateParams({ tipo_frecuencia: value })}
      />

      <FiltroSelect
        id="filtro-regional"
        value={regional}
        placeholder="Regional"
        items={regionalSelect.items}
        options={regionalSelect.options}
        onChange={(value) => updateParams({ regional: value })}
      />

      <FiltroSelect
        id="filtro-departamento"
        value={departamento ?? ALL}
        placeholder="Departamento"
        items={toItems("Todos los departamentos", opciones.departamentos)}
        options={departamentoOptions}
        onChange={(value) => {
          setDepartamento(value === ALL ? undefined : value)
          setMunicipioOptions([])
          setMunicipio(undefined)
        }}
      />

      <FiltroSelect
        id="filtro-municipio"
        value={
          municipio ?? (departamento ? municipioOptions.find((o) => o.value === filtros.municipio)?.value ?? undefined : undefined)
        }
        placeholder="Municipio"
        items={toItems("Todos los municipios", municipioOptions.map((o) => o.value))}
        options={municipioOptions.length > 0 ? municipioOptions : opciones.departamentos.map((d) => ({ value: d, label: d }))}
        onChange={(value) => setMunicipio(value)}
      />

      <FiltroSelect
        id="filtro-sede"
        value={sede_id}
        placeholder="Sede"
        items={sedeSelect.items}
        options={sedeSelect.options}
        onChange={(value) => updateParams({ sede_id: value })}
      />

      <FiltroSelect
        id="filtro-regimen"
        value={regimen_id}
        placeholder="Régimen"
        items={regimenSelect.items}
        options={regimenSelect.options}
        onChange={(value) => updateParams({ regimen_id: value })}
      />

      <FiltroSelect
        id="filtro-asegurador"
        value={asegurador_eps_id}
        placeholder="Asegurador"
        items={aseguradorSelect.items}
        options={aseguradorSelect.options}
        onChange={(value) => updateParams({ asegurador_eps_id: value })}
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