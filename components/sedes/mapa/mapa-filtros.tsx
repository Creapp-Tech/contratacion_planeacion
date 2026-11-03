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
import type { MapaFiltros, OpcionesMapa } from "@/lib/sedes/ocupacion-utils"

const ALL = "__all__"

type Opcion = { value: string; label: string }

type FiltroSelectProps = {
  id: string
  value: string | undefined
  placeholder: string
  options: Opcion[]
  onChange: (value: string | undefined) => void
}

function FiltroSelect({
  id,
  value,
  placeholder,
  options,
  onChange,
}: FiltroSelectProps) {
  // Base UI usa este mapa para resolver la etiqueta del valor seleccionado en
  // el trigger (por eso cada value debe apuntar a su label, no a sí mismo).
  const items = Object.fromEntries(
    options.map((option) => [option.value, option.label])
  )

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

function opcionesTexto(placeholder: string, valores: string[]): Opcion[] {
  return [
    { value: ALL, label: placeholder },
    ...valores.map((valor) => ({ value: valor, label: valor })),
  ]
}

function opcionesIdNombre(
  placeholder: string,
  opciones: { id: string; nombre: string }[]
): Opcion[] {
  return [
    { value: ALL, label: placeholder },
    ...opciones.map((opcion) => ({
      value: opcion.id,
      label: opcion.nombre,
    })),
  ]
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

  const regionalOptions = opcionesTexto("Todas las regionales", opciones.regionales)
  const zonalOptions = opcionesTexto("Todas las zonales", opciones.zonales)
  const marcaOptions = opcionesTexto("Todas las marcas", opciones.marcas)
  const tipoIpsOptions = opcionesTexto(
    "Todos los tipos de IPS",
    opciones.tiposIps
  )
  const departamentoOptions = opcionesTexto(
    "Todos los departamentos",
    opciones.departamentos
  )

  const municipiosDisponibles = filtros.departamento
    ? opciones.municipiosPorDepartamento[filtros.departamento] ?? []
    : opciones.municipios
  const municipioOptions = opcionesTexto(
    "Todos los municipios",
    municipiosDisponibles
  )

  const aseguradorOptions = opcionesIdNombre(
    "Todos los aseguradores",
    opciones.aseguradores.map((eps) => ({
      id: eps.id,
      nombre: eps.nombre_eps,
    }))
  )
  const sedeOptions = opcionesIdNombre("Todas las sedes", opciones.sedes)

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

  function onDepartamentoChange(value: string | undefined) {
    const municipios = value
      ? opciones.municipiosPorDepartamento[value] ?? []
      : opciones.municipios
    const municipioValido =
      filtros.municipio && municipios.includes(filtros.municipio)

    updateParams({
      departamento: value,
      municipio: municipioValido ? filtros.municipio : undefined,
    })
  }

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
        options={regionalOptions}
        onChange={(value) => updateParams({ regional: value })}
      />

      <FiltroSelect
        id="mapa-zonal"
        value={filtros.zonal}
        placeholder="Zonal"
        options={zonalOptions}
        onChange={(value) => updateParams({ zonal: value })}
      />

      <FiltroSelect
        id="mapa-marca"
        value={filtros.marca}
        placeholder="Marca"
        options={marcaOptions}
        onChange={(value) => updateParams({ marca: value })}
      />

      <FiltroSelect
        id="mapa-tipo-ips"
        value={filtros.tipoIps}
        placeholder="Tipo de IPS"
        options={tipoIpsOptions}
        onChange={(value) => updateParams({ tipoIps: value })}
      />

      <FiltroSelect
        id="mapa-departamento"
        value={filtros.departamento}
        placeholder="Departamento"
        options={departamentoOptions}
        onChange={onDepartamentoChange}
      />

      <FiltroSelect
        id="mapa-municipio"
        value={filtros.municipio}
        placeholder="Municipio"
        options={municipioOptions}
        onChange={(value) => updateParams({ municipio: value })}
      />

      <FiltroSelect
        id="mapa-asegurador"
        value={filtros.asegurador}
        placeholder="Asegurador"
        options={aseguradorOptions}
        onChange={(value) => updateParams({ asegurador: value })}
      />

      <FiltroSelect
        id="mapa-sede"
        value={filtros.sede}
        placeholder="Sede"
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
