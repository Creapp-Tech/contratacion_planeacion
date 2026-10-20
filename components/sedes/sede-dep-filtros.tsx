"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAdminClient } from "@/lib/supabase/admin"

import type { SedeRow } from "@/lib/sedes/queries"

const SIN_SELECCIONAR = "__sin_seleccionar__"

type ModoFiltro = "geografico" | "administrativo"

type DepFiltrosProps = {
  modo: ModoFiltro
  valorInicialDepartamento?: string
  valorInicialMunicipio?: string
  valorInicialRegional?: string
  valorInicialZonal?: string
  onSedeSeleccionada: (sede: SedeRow) => void
}

export function DepFiltrosSedes({
  modo,
  valorInicialDepartamento,
  valorInicialMunicipio,
  valorInicialRegional,
  valorInicialZonal,
  onSedeSeleccionada,
}: DepFiltrosProps) {
  const [departamento, setDepartamento] = useState<string | undefined>(
    valorInicialDepartamento
  )
  const [municipio, setMunicipio] = useState<string | undefined>(valorInicialMunicipio)
  const [regional, setRegional] = useState<string | undefined>(valorInicialRegional)
  const [zonal, setZonal] = useState<string | undefined>(valorInicialZonal)

  const [municipiosOptions, setMunicipiosOptions] = useState<string[]>([])
  const [zonalesOptions, setZonalesOptions] = useState<string[]>([])
  const [sedesOptions, setSedesOptions] = useState<SedeRow[]>([])
  const [regionalesOptions, setRegionalesOptions] = useState<string[]>([])

  useEffect(() => {
    async function cargarInicial() {

      if (modo === "geografico") {
        const { data: depts, error } = await createAdminClient()
          .from("sedes")
          .select("departamento")
          .not("departamento", "is", null)

        if (error) throw error
        const departments = [...new Set((depts ?? []).map((f) => f.departamento).filter(Boolean))].sort(
          (a: string, b: string) => a.localeCompare(b)
        )
        setMunicipiosOptions(departments)
        setRegionalesOptions([])
        setMunicipio(undefined)
        setZonalesOptions([])
        setZonal(undefined)
        setSedesOptions([])
        setDepartamento(undefined)
      } else if (modo === "administrativo") {
        const { data: regs, error: regError } = await createAdminClient()
          .from("sedes")
          .select("regional")
          .not("regional", "is", null)

        if (regError) throw regError
        const regionals = [...new Set((regs ?? []).map((f) => f.regional).filter(Boolean))].sort(
          (a: string, b: string) => a.localeCompare(b)
        )
        setRegionalesOptions(regionals)
        setMunicipiosOptions([])
        setRegional(undefined)
        setZonalesOptions([])
        setZonal(undefined)
        setSedesOptions([])
      }
    }
    cargarInicial()
  }, [modo])

  useEffect(() => {
    async function cargarDependientes() {

      if (modo === "geografico" && departamento) {
        const { data: municipios, error: munError } = await createAdminClient()
          .from("sedes")
          .select("municipio")
          .eq("departamento", departamento)

        if (munError) throw munError
        const cities = [...new Set((municipios ?? []).map((f) => f.municipio).filter(Boolean))].sort(
          (a: string, b: string) => a.localeCompare(b)
        )
        setMunicipiosOptions(cities)
        setMunicipio(undefined)
        setSedesOptions([])
      } else if (modo === "geografico" && !departamento) {
        setMunicipiosOptions([])
        setMunicipio(undefined)
        setSedesOptions([])
      } else if (modo === "administrativo" && regional) {
        const { data: zonales, error: zError } = await createAdminClient()
          .from("sedes")
          .select("zonal")
          .eq("regional", regional)

        if (zError) throw zError
        const zones = [...new Set((zonales ?? []).map((f) => f.zonal).filter(Boolean))].sort(
          (a: string, b: string) => a.localeCompare(b)
        )
        setZonalesOptions(zones)
        setZonal(undefined)
        setSedesOptions([])
      } else if (modo === "administrativo" && !regional) {
        setZonalesOptions([])
        setZonal(undefined)
        setSedesOptions([])
      }
    }
    cargarDependientes()
  }, [modo, departamento, regional])

  useEffect(() => {
    async function cargarSedes() {

      if (modo === "geografico" && municipio) {
        const sedes = await createAdminClient()
          .from("sedes")
          .select("*")
          .eq("municipio", municipio)

        if (sedes.error) throw sedes.error
        setSedesOptions(sedes.data ?? [])
        if (sedes.data?.length > 0) {
          onSedeSeleccionada(sedes.data[0])
        }
      } else if (modo === "administrativo" && zonal) {
        const sedes = await createAdminClient()
          .from("sedes")
          .select("*")
          .eq("zonal", zonal)

        if (sedes.error) throw sedes.error
        setSedesOptions(sedes.data ?? [])
        if (sedes.data?.length > 0) {
          onSedeSeleccionada(sedes.data[0])
        }
      } else if (modo === "geografico" && !municipio) {
        setSedesOptions([])
      } else if (modo === "administrativo" && !zonal) {
        setSedesOptions([])
      }
    }
    cargarSedes()
  }, [modo, municipio, zonal, onSedeSeleccionada])

  function manejarCambioDepartamento(value: string | null) {
    const val = value === SIN_SELECCIONAR || value == null ? undefined : value
    setDepartamento(val)
    setMunicipio(undefined)
    setMunicipiosOptions([])
    setSedesOptions([])
  }

  function manejarCambioMunicipio(value: string | null) {
    const val = value == null ? undefined : value
    setMunicipio(val)
  }

  function manejarCambioZonal(value: string | null) {
    const val = value == null ? undefined : value
    setZonal(val)
  }

  // Determine sede display based on mode and current selection
  let sedeContent: React.ReactNode
  if (modo === "geografico") {
    if (municipio) {
      sedeContent = (
        <div>
          <label className="block text-sm font-medium">Sede</label>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sedes disponibles" />
            </SelectTrigger>
            <SelectContent>
              {sedesOptions.map((sede) => (
                <SelectItem key={sede.id} value={sede.id}>
                  {sede.nombre}
                </SelectItem>
              ))}
              {sedesOptions.length === 0 && (
                <SelectItem value="" disabled>No hay sedes para este municipio</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )
    } else {
      sedeContent = (
        <div>
          <label className="block text-sm font-medium">Sede</label>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecciona un departamento primero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" disabled>Primero selecciona un departamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
  } else {
    // modo === "administrativo"
    if (zonal) {
      sedeContent = (
        <div>
          <label className="block text-sm font-medium">Sede</label>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sedes disponibles" />
            </SelectTrigger>
            <SelectContent>
              {sedesOptions.map((sede) => (
                <SelectItem key={sede.id} value={sede.id}>
                  {sede.nombre}
                </SelectItem>
              ))}
              {sedesOptions.length === 0 && (
                <SelectItem value="" disabled>No hay sedes para esta zonal</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )
    } else {
      sedeContent = (
        <div>
          <label className="block text-sm font-medium">Sede</label>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecciona una regional/zonal primero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" disabled>Primero selecciona una regional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="block text-sm font-medium">
          {modo === "geografico" ? "Departamento" : "Regional"}
        </label>

        <Select
          value={departamento !== undefined ? departamento : SIN_SELECCIONAR}
          onValueChange={(value) => manejarCambioDepartamento(value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue
              placeholder={
                modo === "geografico" ? "Selecciona un departamento" : "Selecciona una regional"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {modo === "geografico" ? (
              <>
                <SelectItem value={SIN_SELECCIONAR}>Seleccionar departamento</SelectItem>
                {regionalesOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </>
            ) : (
              <>
                <SelectItem value={SIN_SELECCIONAR}>Seleccionar regional</SelectItem>
                {regionalesOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col space-y-2">
        {modo === "geografico" ? (
          <div>
            <label className="block text-sm font-medium">Municipio</label>
            <Select
              value={municipio !== undefined ? municipio : SIN_SELECCIONAR}
              onValueChange={(value) => manejarCambioMunicipio(value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Selecciona un municipio" />
              </SelectTrigger>
              <SelectContent>
                {municipiosOptions.length > 0 ? (
                  municipiosOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>Cargando...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium">Zonal</label>
            <Select
              value={zonal !== undefined ? zonal : SIN_SELECCIONAR}
              onValueChange={(value) => manejarCambioZonal(value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Selecciona una zonal" />
              </SelectTrigger>
              <SelectContent>
                {zonalesOptions.length > 0 ? (
                  zonalesOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>Cargando...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-2">{sedeContent}</div>
    </div>
  )
}