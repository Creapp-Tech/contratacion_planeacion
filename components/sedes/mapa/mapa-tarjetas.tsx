import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  colorOcupacion,
  formatoNumero,
  formatoPct,
  type ResumenMapa,
} from "@/lib/sedes/ocupacion-utils"

function Tarjeta({
  titulo,
  valor,
  detalle,
  acento,
}: {
  titulo: string
  valor: string
  detalle: string
  acento?: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span
          className="text-2xl font-semibold tabular-nums"
          style={acento ? { color: acento } : undefined}
        >
          {valor}
        </span>
        <span className="text-xs text-muted-foreground">{detalle}</span>
      </CardContent>
    </Card>
  )
}

export function MapaTarjetas({ resumen }: { resumen: ResumenMapa }) {
  const color = colorOcupacion(resumen.ocupacion)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tarjeta
        titulo="Sedes en el mapa"
        valor={formatoNumero(resumen.conUbicacion)}
        detalle={`Filtradas: ${formatoNumero(resumen.sedes)}${
          resumen.sinUbicacion > 0
            ? ` · sin ubicación: ${formatoNumero(resumen.sinUbicacion)}`
            : ""
        }`}
      />
      <Tarjeta
        titulo="Capacidad total"
        valor={formatoNumero(resumen.capacidad)}
        detalle="Capacidad actual de las sedes"
      />
      <Tarjeta
        titulo="Población asignada"
        valor={formatoNumero(resumen.poblacion)}
        detalle="Usuarios asignados (sede + asegurador)"
      />
      <Tarjeta
        titulo="Ocupación global"
        valor={formatoPct(resumen.ocupacion)}
        detalle={color.etiqueta}
        acento={color.texto}
      />
    </div>
  )
}
