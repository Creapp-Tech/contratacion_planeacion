import type { ReactNode } from "react"
import {
  BadgeCheckIcon,
  Building2Icon,
  FileTextIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ShieldXIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

import type { IndicadoresDashboard } from "./dashboard-utils"

const formateador = new Intl.NumberFormat("es-CO")

function formatear(valor: number): string {
  return formateador.format(valor)
}

function TarjetaIndicador({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string
  valor: number
  detalle: string
  icono: ReactNode
}) {
  return (
    <Card size="sm" className="gap-1">
      <CardContent className="flex flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {titulo}
          </span>
          {icono}
        </span>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {formatear(valor)}
        </span>
        <span className="text-xs text-muted-foreground">{detalle}</span>
      </CardContent>
    </Card>
  )
}

export function DashboardTarjetas({
  indicadores,
  totalGeneral,
}: {
  indicadores: IndicadoresDashboard
  totalGeneral: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <TarjetaIndicador
        titulo="Contratos"
        valor={indicadores.totalContratos}
        detalle={
          totalGeneral > indicadores.totalContratos
            ? `de ${formatear(totalGeneral)} contratos activos`
            : "Contratos activos"
        }
        icono={<FileTextIcon className="size-5 text-muted-foreground" />}
      />
      <TarjetaIndicador
        titulo="EPS"
        valor={indicadores.aseguradoras}
        detalle="Aseguradoras distintas"
        icono={<Building2Icon className="size-5 text-muted-foreground" />}
      />
      <TarjetaIndicador
        titulo="Regionales"
        valor={indicadores.regionales}
        detalle="Regionales con contratos"
        icono={<MapPinIcon className="size-5 text-muted-foreground" />}
      />
      <TarjetaIndicador
        titulo="Legalizados"
        valor={indicadores.legalizados}
        detalle="Incluye legalizados VIVA1A"
        icono={<ShieldCheckIcon className="size-5 text-emerald-600" />}
      />
      <TarjetaIndicador
        titulo="No legalizados"
        valor={indicadores.noLegalizados}
        detalle="Pendientes de legalizar"
        icono={<ShieldXIcon className="size-5 text-red-600" />}
      />
      <TarjetaIndicador
        titulo="Legalizado VIVA1A"
        valor={indicadores.legalizadosViva1a}
        detalle="Subconjunto de legalizados"
        icono={<BadgeCheckIcon className="size-5 text-emerald-600" />}
      />
    </div>
  )
}
