"use client"

import { useMemo, useState } from "react"

import type { ContratoDashboard } from "@/lib/contratos/dashboard-queries"

import { DashboardFiltros } from "./dashboard-filtros"
import { DashboardGraficas } from "./dashboard-graficas"
import { DashboardTabla } from "./dashboard-tabla"
import { DashboardTarjetas } from "./dashboard-tarjetas"
import {
  calcularIndicadores,
  crearFiltrosIniciales,
  crearOpcionesFiltros,
  cumpleFiltros,
  hayFiltrosActivos,
  type FiltrosDashboard,
} from "./dashboard-utils"

export function DashboardContratosContenido({
  contratos,
  errorMessage,
}: {
  contratos: ContratoDashboard[]
  errorMessage: string | null
}) {
  const opciones = useMemo(() => crearOpcionesFiltros(contratos), [contratos])
  const [filtros, setFiltros] = useState<FiltrosDashboard>(() =>
    crearFiltrosIniciales(opciones)
  )

  // Si la consulta se refresca con otro conjunto de datos, se reinician los
  // filtros para que no queden valores que ya no existen.
  const [opcionesPrevias, setOpcionesPrevias] = useState(opciones)
  if (opciones !== opcionesPrevias) {
    setOpcionesPrevias(opciones)
    setFiltros(crearFiltrosIniciales(opciones))
  }

  const contratosFiltrados = useMemo(
    () => contratos.filter((contrato) => cumpleFiltros(contrato, filtros)),
    [contratos, filtros]
  )

  const filtrosActivos = useMemo(
    () => hayFiltrosActivos(filtros, opciones),
    [filtros, opciones]
  )

  const indicadores = useMemo(
    () => calcularIndicadores(contratosFiltrados),
    [contratosFiltrados]
  )

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
      >
        No se pudieron cargar los contratos. {errorMessage}
      </div>
    )
  }

  function cambiarFiltro(clave: keyof FiltrosDashboard, valores: string[]) {
    setFiltros((actual) => ({ ...actual, [clave]: valores }))
  }

  function limpiarFiltros() {
    setFiltros(crearFiltrosIniciales(opciones))
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardFiltros
        opciones={opciones}
        filtros={filtros}
        onCambiar={cambiarFiltro}
        onLimpiar={limpiarFiltros}
        hayFiltros={filtrosActivos}
      />

      <section
        aria-labelledby="dashboard-tarjetas"
        className="flex flex-col gap-2"
      >
        <h2
          id="dashboard-tarjetas"
          className="font-heading text-lg font-semibold"
        >
          Indicadores
        </h2>
        <DashboardTarjetas
          indicadores={indicadores}
          totalGeneral={contratos.length}
        />
      </section>

      <section
        aria-labelledby="dashboard-graficas"
        className="flex flex-col gap-2"
      >
        <h2
          id="dashboard-graficas"
          className="font-heading text-lg font-semibold"
        >
          Gráficas
        </h2>
        <DashboardGraficas contratos={contratosFiltrados} />
      </section>

      <section
        aria-labelledby="dashboard-tabla"
        className="flex flex-col gap-2"
      >
        <h2
          id="dashboard-tabla"
          className="font-heading text-lg font-semibold"
        >
          Contratos
        </h2>
        <DashboardTabla contratos={contratosFiltrados} />
      </section>
    </div>
  )
}
