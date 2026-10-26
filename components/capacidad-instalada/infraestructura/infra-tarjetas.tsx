import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatoNumero, type ResumenInfra } from "@/lib/capacidad/agregaciones"

function Tarjeta({
  titulo,
  valor,
  detalle,
  acento,
}: {
  titulo: string
  valor: string
  detalle: string
  acento?: "positivo" | "negativo"
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
          className={
            acento === "negativo"
              ? "text-2xl font-semibold tabular-nums text-destructive"
              : acento === "positivo"
                ? "text-2xl font-semibold tabular-nums text-green-600"
                : "text-2xl font-semibold tabular-nums"
          }
        >
          {valor}
        </span>
        <span className="text-xs text-muted-foreground">{detalle}</span>
      </CardContent>
    </Card>
  )
}

export function InfraTarjetas({
  resumen,
  personalizada,
}: {
  resumen: ResumenInfra
  personalizada: number | null
}) {
  const difPlaneacion = resumen.capacidadActual - resumen.capacidadPlaneacion
  const difEjecucion = resumen.capacidadActual - resumen.capacidadEjecucion
  const hayPlaneacion = resumen.sedes.some((sede) => sede.frecuenciaPlaneacion)
  const hayEjecucion = resumen.sedes.some((sede) => sede.frecuenciaEjecucion)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tarjeta
        titulo="Población Activa"
        valor={formatoNumero(resumen.poblacionActiva)}
        detalle="Usuarios activos de las sedes filtradas"
      />
      <Tarjeta
        titulo="Población Pagada"
        valor={formatoNumero(resumen.poblacionPagada)}
        detalle="Usuarios con pago vigente"
      />
      <Tarjeta
        titulo="Capacidad Actual"
        valor={formatoNumero(resumen.capacidadActual)}
        detalle="Unidades habilitadas por área"
      />
      <Tarjeta
        titulo="Capacidad por Planeación"
        valor={
          hayPlaneacion
            ? formatoNumero(resumen.capacidadPlaneacion)
            : "Sin frecuencia"
        }
        detalle={
          hayPlaneacion
            ? "Según frecuencia de nota técnica"
            : "No hay nota técnica marcada para el cálculo"
        }
      />
      <Tarjeta
        titulo="Capacidad por Ejecución"
        valor={
          hayEjecucion
            ? formatoNumero(resumen.capacidadEjecucion)
            : "Sin frecuencia"
        }
        detalle={
          hayEjecucion
            ? "Según frecuencia de ejecución de servicios"
            : "No hay ejecución de servicios marcada para el cálculo"
        }
      />
      <Tarjeta
        titulo="Diferencia (Actual − Planeación)"
        valor={hayPlaneacion ? formatoNumero(difPlaneacion) : "Sin frecuencia"}
        detalle={
          hayPlaneacion
            ? "Capacidad actual menos planeada"
            : "No hay nota técnica marcada para el cálculo"
        }
        acento={
          hayPlaneacion
            ? difPlaneacion < 0
              ? "negativo"
              : difPlaneacion > 0
                ? "positivo"
                : undefined
            : undefined
        }
      />
      <Tarjeta
        titulo="Diferencia (Actual − Ejecución)"
        valor={hayEjecucion ? formatoNumero(difEjecucion) : "Sin frecuencia"}
        detalle={
          hayEjecucion
            ? "Capacidad actual menos ejecutada"
            : "No hay ejecución de servicios marcada para el cálculo"
        }
        acento={
          hayEjecucion
            ? difEjecucion < 0
              ? "negativo"
              : difEjecucion > 0
                ? "positivo"
                : undefined
            : undefined
        }
      />
      {personalizada != null ? (
        <Tarjeta
          titulo="Población personalizada"
          valor={formatoNumero(personalizada)}
          detalle="Valor ingresado manualmente"
        />
      ) : null}
    </div>
  )
}
