import type { ResumenAseguradoresContratos } from "@/lib/aseguradores-contratos/types"

function numero(value: number) {
  return new Intl.NumberFormat("es-CO").format(value)
}

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function Kpi({
  titulo,
  valor,
  detalle,
}: {
  titulo: string
  valor: string
  detalle?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-sm text-muted-foreground">{titulo}</span>
      <span className="text-2xl font-semibold">{valor}</span>
      {detalle ? (
        <span className="text-xs text-muted-foreground">{detalle}</span>
      ) : null}
    </div>
  )
}

export function KpisServicios({
  resumen,
}: {
  resumen: ResumenAseguradoresContratos
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Kpi titulo="Servicios CUPS" valor={numero(resumen.servicios)} />
      <Kpi titulo="Contratos" valor={numero(resumen.contratos)} />
      <Kpi titulo="Aseguradores" valor={numero(resumen.aseguradores)} />
      <Kpi
        titulo="Con CUPS resolución"
        valor={numero(resumen.conCupsResolucion)}
        detalle="Referenciados al catálogo oficial"
      />
      <Kpi
        titulo="CME promedio"
        valor={money(resumen.cmePromedio)}
        detalle={`Sobre ${numero(resumen.conCme)} registros con CME`}
      />
    </div>
  )
}
