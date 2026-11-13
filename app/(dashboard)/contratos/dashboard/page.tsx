import type { Metadata } from "next"
import { ClockIcon } from "lucide-react"

import { DashboardContratosContenido } from "@/components/contratos/dashboard/dashboard-contenido"
import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import {
  formatearFechaHoraBogota,
  ultimaActualizacionDe,
} from "@/lib/contratos/dashboard-fechas"
import {
  listContratosDashboard,
  type ContratoDashboard,
} from "@/lib/contratos/dashboard-queries"

export const metadata: Metadata = {
  title: "Dashboard de contratos",
}

export default async function DashboardContratosPage() {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  let contratos: ContratoDashboard[] = []
  let errorMessage: string | null = null

  try {
    contratos = await listContratosDashboard(alcance)
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al cargar los contratos."
  }

  const actualizadoEn = ultimaActualizacionDe(contratos)

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Dashboard de contratos
        </h1>
        <p className="text-sm text-muted-foreground">
          Indicadores y análisis de los contratos activos nacionales e
          internacionales. El gerente regional ve únicamente los contratos de su
          regional.
        </p>
        {actualizadoEn ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" aria-hidden="true" />
            Última actualización: {formatearFechaHoraBogota(actualizadoEn)} (hora
            de Bogotá)
          </p>
        ) : null}
      </div>

      <DashboardContratosContenido
        contratos={contratos}
        errorMessage={errorMessage}
      />
    </div>
  )
}
