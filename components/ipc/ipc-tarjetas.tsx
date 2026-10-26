import {
  ArrowDownRightIcon,
  PercentIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ResumenIpc } from "@/lib/ipc/agregaciones"
import { formatearMoneda, formatearPorcentaje } from "@/lib/ipc/constantes"
import { cn } from "cn"

type TarjetaProps = {
  titulo: string
  valor: string
  detalle: string
  icono: React.ReactNode
  tono?: "default" | "destructive" | "success"
}

function Tarjeta({ titulo, valor, detalle, icono, tono = "default" }: TarjetaProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground",
              tono === "destructive" &&
                "bg-destructive/10 text-destructive",
              tono === "success" && "bg-emerald-500/10 text-emerald-600"
            )}
          >
            {icono}
          </span>
          {titulo}
        </CardDescription>
        <CardTitle className="font-heading text-2xl font-semibold tabular-nums">
          {valor}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  )
}

export function IpcTarjetas({ resumen }: { resumen: ResumenIpc }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tarjeta
        titulo="Registros IPC"
        valor={String(resumen.totalRegistros)}
        detalle={`${resumen.totalContratos} contrato${
          resumen.totalContratos === 1 ? "" : "s"
        } con seguimiento`}
        icono={<TrendingUpIcon className="size-4" />}
      />

      <Tarjeta
        titulo="Promedio % IPC"
        valor={formatearPorcentaje(resumen.promedioIpc)}
        detalle={
          resumen.promedioNacional == null
            ? "Sin IPC nacional de referencia"
            : `IPC nacional promedio: ${formatearPorcentaje(
                resumen.promedioNacional
              )}`
        }
        icono={<PercentIcon className="size-4" />}
      />

      <Tarjeta
        titulo="Por debajo del nacional"
        valor={String(resumen.debajo)}
        detalle={
          resumen.porcentajeDebajo == null
            ? "Sin registros comparables"
            : `${formatearPorcentaje(
                resumen.porcentajeDebajo,
                1
              )} de ${resumen.comparables} registros comparables`
        }
        tono={resumen.debajo > 0 ? "destructive" : "success"}
        icono={<ArrowDownRightIcon className="size-4" />}
      />

      <Tarjeta
        titulo="Costo usuario promedio"
        valor={formatearMoneda(resumen.costoPromedio)}
        detalle={`Total registrado: ${formatearMoneda(resumen.costoTotal)}`}
        icono={<WalletIcon className="size-4" />}
      />
    </div>
  )
}
