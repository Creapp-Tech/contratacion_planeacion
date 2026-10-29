"use client"

import Link from "next/link"
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { TooltipContentProps } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  colorOcupacion,
  formatoNumero,
  formatoPct,
  type SedeMapa,
} from "@/lib/sedes/ocupacion-utils"

function TooltipDonut({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null

  return (
    <div className="rounded-md border bg-background p-2 text-xs shadow-md">
      <p className="font-medium">{String(item.name)}</p>
      <p className="tabular-nums">{formatoNumero(Number(item.value))}</p>
    </div>
  )
}

export function TarjetaOcupacionPorSede({ sedes }: { sedes: SedeMapa[] }) {
  const filas = sedes
    .map((sede) => {
      const capacidad = sede.capacidad_usuarios ?? 0
      return {
        id: sede.id,
        nombre: sede.nombre,
        municipio: sede.municipio,
        poblacion: sede.poblacion,
        capacidad,
        ocupacion: sede.ocupacion,
        color: colorOcupacion(sede.ocupacion),
      }
    })
    .sort((a, b) => (b.ocupacion ?? -1) - (a.ocupacion ?? -1))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ocupación por sede</CardTitle>
        <CardDescription>
          Población asignada frente a la capacidad actual — el color indica el
          nivel de ocupación
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay sedes para mostrar con los filtros seleccionados.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filas.map((fila) => (
              <Link
                key={fila.id}
                href={`/sedes/${fila.id}`}
                className="flex flex-col gap-2 rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {fila.nombre}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {fila.municipio ?? "Sin municipio"}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: fila.color.texto }}
                  >
                    {formatoPct(fila.ocupacion)}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(fila.ocupacion ?? 0, 100)}%`,
                      backgroundColor: fila.color.hex,
                    }}
                  />
                </div>

                <span className="text-xs text-muted-foreground">
                  {formatoNumero(fila.poblacion)} de{" "}
                  {formatoNumero(fila.capacidad)} usuarios · {fila.color.etiqueta}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TarjetaOcupacionGlobal({ sedes }: { sedes: SedeMapa[] }) {
  const capacidad = sedes.reduce(
    (total, sede) => total + (sede.capacidad_usuarios ?? 0),
    0
  )
  const poblacion = sedes.reduce((total, sede) => total + sede.poblacion, 0)
  const ocupacion =
    capacidad > 0 ? (poblacion / capacidad) * 100 : null
  const color = colorOcupacion(ocupacion)
  const disponible = Math.max(capacidad - poblacion, 0)

  const datos = [
    { name: "Población asignada", value: poblacion },
    { name: "Capacidad disponible", value: disponible },
  ]

  const vacio = capacidad === 0

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ocupación global</CardTitle>
        <CardDescription>Población asignada vs. capacidad total</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        {vacio ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Las sedes no tienen capacidad registrada.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={datos}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                >
                  <Cell fill={color.hex} />
                  <Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip content={(props) => <TooltipDonut {...props} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <text
                  x="50%"
                  y="47%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={22}
                  fontWeight={600}
                  className="fill-foreground"
                >
                  {formatoPct(ocupacion)}
                </text>
                <text
                  x="50%"
                  y="62%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  className="fill-muted-foreground"
                >
                  ocupación
                </text>
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-muted-foreground">
              {formatoNumero(poblacion)} de {formatoNumero(capacidad)} usuarios ·{" "}
              {color.etiqueta}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
