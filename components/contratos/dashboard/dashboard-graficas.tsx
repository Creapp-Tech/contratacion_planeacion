"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import type { ContratoDashboard } from "@/lib/contratos/dashboard-queries"

import {
  serieAseguradora,
  serieCiudad,
  serieEjecucion,
  serieLegalizacion,
  serieRegional,
  serieRegimen,
  type PuntoGrafica,
} from "./dashboard-utils"

const formateador = new Intl.NumberFormat("es-CO")

const EJE = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
} as const

const GRID_STROKE = "var(--color-border)"

function formatear(valor: number): string {
  return formateador.format(valor)
}

function formatearContratos(valor: number): string {
  return `${formatear(valor)} contrato${valor === 1 ? "" : "s"}`
}

function truncarEtiqueta(texto: string): string {
  return texto.length > 24 ? `${texto.slice(0, 23)}…` : texto
}

function SinDatos({ mensaje }: { mensaje: string }) {
  return (
    <p className="flex h-[280px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {mensaje}
    </p>
  )
}

function GraficaCircular({
  titulo,
  descripcion,
  datos,
}: {
  titulo: string
  descripcion: string
  datos: PuntoGrafica[]
}) {
  const total = datos.reduce((acumulado, dato) => acumulado + dato.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <SinDatos mensaje="No hay contratos para este indicador con los filtros actuales." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={datos}
                dataKey="total"
                nameKey="etiqueta"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {datos.map((dato) => (
                  <Cell key={dato.clave} fill={dato.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const cantidad = Number(value)
                  const porcentaje =
                    total > 0 ? Math.round((cantidad / total) * 100) : 0
                  return [
                    `${formatearContratos(cantidad)} (${porcentaje}%)`,
                    String(name),
                  ]
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function GraficaBarras({
  titulo,
  descripcion,
  datos,
  anchoEtiquetas = 120,
}: {
  titulo: string
  descripcion: string
  datos: PuntoGrafica[]
  anchoEtiquetas?: number
}) {
  const total = datos.reduce((acumulado, dato) => acumulado + dato.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <SinDatos mensaje="No hay contratos para este indicador con los filtros actuales." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={datos}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
            >
              <CartesianGrid
                stroke={GRID_STROKE}
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={EJE}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="etiqueta"
                tick={EJE}
                tickLine={false}
                axisLine={false}
                width={anchoEtiquetas}
                tickFormatter={truncarEtiqueta}
              />
              <Tooltip
                formatter={(value) => [formatearContratos(Number(value)), "Contratos"]}
              />
              <Bar
                dataKey="total"
                name="Contratos"
                fill="var(--color-primary)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardGraficas({
  contratos,
}: {
  contratos: ContratoDashboard[]
}) {
  const regimen = useMemo(() => serieRegimen(contratos), [contratos])
  const ciudad = useMemo(() => serieCiudad(contratos), [contratos])
  const ejecucion = useMemo(() => serieEjecucion(contratos), [contratos])
  const regional = useMemo(() => serieRegional(contratos), [contratos])
  const legalizacion = useMemo(() => serieLegalizacion(contratos), [contratos])
  const aseguradora = useMemo(() => serieAseguradora(contratos), [contratos])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <GraficaCircular
        titulo="Contratos por régimen"
        descripcion="Cada contrato cuenta una sola vez; «Mixto» agrupa Contributivo y Subsidiado."
        datos={regimen}
      />

      <GraficaBarras
        titulo="Contratos por ciudad"
        descripcion="Las 10 ciudades con más contratos; el resto se agrupa en «Otras ciudades»."
        datos={ciudad}
        anchoEtiquetas={130}
      />

      <GraficaCircular
        titulo="Contratos por estado de ejecución"
        descripcion="Contratos según el estado de ejecución registrado."
        datos={ejecucion}
      />

      <GraficaBarras
        titulo="Contratos por regional"
        descripcion="Un contrato puede estar en más de una regional, por eso la suma puede superar el total."
        datos={regional}
      />

      <GraficaCircular
        titulo="Contratos por legalización"
        descripcion="«Legalizado VIVA1A» se muestra aparte del resto de legalizados."
        datos={legalizacion}
      />

      <GraficaBarras
        titulo="Contratos por EPS"
        descripcion="Las 10 EPS con más contratos; el resto se agrupa en «Otras EPS»."
        datos={aseguradora}
        anchoEtiquetas={150}
      />
    </div>
  )
}
