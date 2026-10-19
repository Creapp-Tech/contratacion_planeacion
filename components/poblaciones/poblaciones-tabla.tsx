import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatoNumero } from "@/lib/sedes/ocupacion"
import {
  resumenPoblaciones,
  type PoblacionFila,
} from "@/lib/poblaciones/queries"

import { PoblacionAcciones } from "./poblacion-acciones"

function Kpi({
  titulo,
  valor,
}: {
  titulo: string
  valor: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-sm text-muted-foreground">{titulo}</span>
      <span className="text-2xl font-semibold tabular-nums">{valor}</span>
    </div>
  )
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—"
  const partes = fecha.split("-")
  if (partes.length !== 3) return fecha
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
    new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
  )
}

export function PoblacionesTabla({
  filas,
  puedeEditar = false,
}: {
  filas: PoblacionFila[]
  puedeEditar?: boolean
}) {
  const resumen = resumenPoblaciones(filas)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Registros" valor={formatoNumero(resumen.registros)} />
        <Kpi titulo="Población activa" valor={formatoNumero(resumen.activa)} />
        <Kpi titulo="Población pagada" valor={formatoNumero(resumen.pagada)} />
        <Kpi
          titulo="Población certificada"
          valor={formatoNumero(resumen.certificada)}
        />
      </div>

      {filas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aún no hay poblaciones registradas — crea la primera.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sede</TableHead>
                <TableHead>Asegurador</TableHead>
                <TableHead>Régimen</TableHead>
                <TableHead className="text-right">Población activa</TableHead>
                <TableHead className="text-right">Población pagada</TableHead>
                <TableHead className="text-right">
                  Población certificada
                </TableHead>
                <TableHead>Fecha actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => (
                <TableRow key={fila.id}>
                  <TableCell className="font-medium">
                    {fila.sedes?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fila.aseguradores_eps?.nombre_eps ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fila.regimenes?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoNumero(fila.poblacion_activa)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoNumero(fila.poblacion_pagada)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoNumero(fila.poblacion_certificada)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatearFecha(fila.fecha_actualizacion)}
                  </TableCell>
                  <TableCell>
                    <PoblacionAcciones
                      id={fila.id}
                      nombre={`${fila.sedes?.nombre ?? "Sede"} · ${
                        fila.aseguradores_eps?.nombre_eps ?? "Asegurador"
                      } · ${fila.regimenes?.nombre ?? "Régimen"}`}
                      puedeEditar={puedeEditar}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
