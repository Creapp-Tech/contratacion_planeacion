"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
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
import type { MapaFiltros, OpcionesMapa } from "@/lib/sedes/ocupacion"
import { createAdminClient } from "@/lib/supabase/admin"

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
      <SelectTrigger id={id} className="w-full sm:w-52">
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

export function MapaFiltros({
  opciones,
  filtros,
}: {
  opciones: OpcionesMapa
  filtros: MapaFiltros
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [departamento, setDepartamento] = useState<string | undefined>(
    filtros.departamento
  )
  const [municipio, setMunicipio] = useState<string | undefined>(
    filtros.municipio
  )

  const [municipioOptions, setMunicipioOptions] = useState<{ value: string; label: string }[]>([])

  const regionalOptions = [
    { value: ALL, label: "Todas las regionales" },
    ...opciones.regionales.map((value) => ({ value, label: value })),
  ]
  const zonalOptions = [
    { value: ALL, label: "Todas las zonales" },
    ...opciones.zonales.map((value) => ({ value, label: value })),
  ]
  const marcaOptions = [
    { value: ALL, label: "Todas las marcas" },
    ...opciones.marcas.map((value) => ({ value, label: value })),
  ]
  const tipoIpsOptions = [
    { value: ALL, label: "Todos los tipos de IPS" },
    ...opciones.tiposIps.map((value) => ({ value, label: value })),
  ]
  const departamentoOptions = [
    { value: ALL, label: "Todos los departamentos" },
    ...opciones.departamentos.map((value) => ({ value, label: value })),
  ]
  const municipioOptionsRaw = useMemo(
    () => [
      { value: ALL, label: "Todos los municipios" },
      ...opciones.municipios.map((value) => ({ value, label: value })),
    ],
    [opciones.municipios]
  )
  const aseguradorOptions = [
    { value: ALL, label: "Todos los aseguradores" },
    ...opciones.aseguradores.map((eps) => ({
      value: eps.id,
      label: eps.nombre_eps,
    })),
  ]
  const sedeOptions = [
    { value: ALL, label: "Todas las sedes" },
    ...opciones.sedes.map((sede) => ({ value: sede.id, label: sede.nombre })),
  ]

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

  // Efecto: cargar municipios cuando cambia el departamento
  useEffect(() => {
    async function cargarMunicipios() {
      if (departamento) {
        const { data, error } = await createAdminClient()
          .from("sedes")
          .select("municipio")
          .eq("departamento", departamento)

        if (error) throw error
        const municipios = [...new Set((data ?? []).map((f) => f.municipio).filter(Boolean) as string[])].
          sort((a, b) => a.localeCompare(b))
        setMunicipioOptions(
          municipios.map((m) => ({ value: m as string, label: m as string }))
        )
        setMunicipio(undefined)
      } else {
        setMunicipioOptions(
          municipioOptionsRaw.filter((o) => o.value !== ALL).map((o) => ({ value: o.value, label: o.label }))
        )
        setMunicipio(undefined)
      }
    }
    cargarMunicipios()
  }, [departamento, municipioOptionsRaw])

  const hasFiltros = Boolean(
    filtros.regional ||
      filtros.zonal ||
      filtros.marca ||
      filtros.tipoIps ||
      filtros.departamento ||
      filtros.municipio ||
      filtros.asegurador ||
      filtros.sede
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <FiltroSelect
        id="mapa-regional"
        value={filtros.regional}
        placeholder="Regional"
        items={toItems("Todas las regionales", opciones.regionales)}
        options={regionalOptions}
        onChange={(value) => updateParams({ regional: value })}
      />

      <FiltroSelect
        id="mapa-zonal"
        value={filtros.zonal}
        placeholder="Zonal"
        items={toItems("Todas las zonales", opciones.zonales)}
        options={zonalOptions}
        onChange={(value) => updateParams({ zonal: value })}
      />

      <FiltroSelect
        id="mapa-marca"
        value={filtros.marca}
        placeholder="Marca"
        items={toItems("Todas las marcas", opciones.marcas)}
        options={marcaOptions}
        onChange={(value) => updateParams({ marca: value })}
      />

      <FiltroSelect
        id="mapa-tipo-ips"
        value={filtros.tipoIps}
        placeholder="Tipo de IPS"
        items={toItems("Todos los tipos de IPS", opciones.tiposIps)}
        options={tipoIpsOptions}
        onChange={(value) => updateParams({ tipoIps: value })}
      />

      <FiltroSelect
        id="mapa-departamento"
        value={departamento ?? filtros.departamento}
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
        id="mapa-municipio"
        value={
          municipio ?? (departamento ? municipioOptions.find((o) => o.value === filtros.municipio)?.value ?? undefined : undefined)
        }
        placeholder="Municipio"
        items={toItems("Todos los municipios", municipioOptions.map((o) => o.value))}
        options={municipioOptions.length > 0 ? municipioOptions : municipioOptionsRaw}
        onChange={(value) => setMunicipio(value)}
      />

      <FiltroSelect
        id="mapa-asegurador"
        value={filtros.asegurador}
        placeholder="Asegurador"
        items={toItems(
          "Todos los aseguradores",
          opciones.aseguradores.map((eps) => eps.id)
        )}
        options={aseguradorOptions}
        onChange={(value) => updateParams({ asegurador: value })}
      />

      <FiltroSelect
        id="mapa-sede"
        value={filtros.sede}
        placeholder="Sede"
        items={toItems(
          "Todas las sedes",
          opciones.sedes.map((sede) => sede.id)
        )}
        options={sedeOptions}
        onChange={(value) => updateParams({ sede: value })}
      />

      {hasFiltros ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
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