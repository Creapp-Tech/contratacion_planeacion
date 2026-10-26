"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  serieComparativo,
  serieCosto,
  serieDistribucion,
  serieEvolucion,
} from "@/lib/ipc/agregaciones"
import {
  formatearMoneda,
  formatearPuntos,
  formatearPorcentaje,
} from "@/lib/ipc/constantes"
import type { IpcConReferencia } from "@/lib/ipc/queries"

const EJE = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
} as const

const GRID_STROKE = "var(--color-border)"

function SinDatos({ mensaje }: { mensaje: string }) {
  return (
    <p className="flex h-[260px] items-center justify-center text-center text-sm text-muted-foreground">
      {mensaje}
    </p>
  )
}

export function IpcGraficas({ filas }: { filas: IpcConReferencia[] }) {
  const evolucion = useMemo(() => serieEvolucion(filas), [filas])
  const comparativo = useMemo(() => serieComparativo(filas, 10), [filas])
  const costo = useMemo(() => serieCosto(filas), [filas])
  const distribucion = useMemo(() => serieDistribucion(filas), [filas])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Evolución del % IPC</CardTitle>
          <CardDescription>
            Promedio de los contratos frente al IPC nacional de Colombia por
            año.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evolucion.length === 0 ? (
            <SinDatos mensaje="No hay datos para graficar la evolución." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={evolucion} margin={{ left: 0, right: 12 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="anio" tick={EJE} tickLine={false} />
                <YAxis
                  tick={EJE}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatearPorcentaje(Number(value)),
                    name === "nacional" ? "IPC nacional" : "Promedio contratos",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "nacional" ? "IPC nacional" : "Promedio contratos"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="ipc"
                  name="ipc"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="nacional"
                  name="nacional"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Distribución vs. nacional</CardTitle>
          <CardDescription>
            Cantidad de registros por encima, en línea o por debajo del IPC
            nacional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {distribucion.length === 0 ? (
            <SinDatos mensaje="No hay datos para graficar la distribución." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distribucion}
                  dataKey="total"
                  nameKey="etiqueta"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {distribucion.map((punto) => (
                    <Cell key={punto.estado} fill={punto.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value)} registro${Number(value) === 1 ? "" : "s"}`,
                    String(name),
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Mayores brechas negativas
          </CardTitle>
          <CardDescription>
            Contratos con el % IPC más alejado por debajo del nacional (puntos
            porcentuales).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comparativo.length === 0 ? (
            <SinDatos mensaje="No hay registros comparables o ningún contrato está por debajo del nacional." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={comparativo}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis type="number" tick={EJE} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="etiqueta"
                  tick={EJE}
                  tickLine={false}
                  axisLine={false}
                  width={150}
                />
                <Tooltip
                  formatter={(value) => [
                    formatearPuntos(Number(value)),
                    "Brecha vs. nacional",
                  ]}
                />
                <Bar dataKey="diferencia" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Costo usuario por año</CardTitle>
          <CardDescription>
            Suma del costo usuario registrado en cada año.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {costo.length === 0 ? (
            <SinDatos mensaje="No hay datos de costo usuario para graficar." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costo} margin={{ left: 8, right: 12 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="anio" tick={EJE} tickLine={false} />
                <YAxis
                  tick={EJE}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("es-CO", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(Number(value))
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    formatearMoneda(Number(value)),
                    "Costo usuario total",
                  ]}
                />
                <Bar
                  dataKey="costo"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
