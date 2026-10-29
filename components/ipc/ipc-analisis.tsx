import { ArrowDownRightIcon } from "lucide-react"
import { cn } from "cn"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { peoresBrechas, type ResumenIpc } from "@/lib/ipc/agregaciones"
import {
  formatearMoneda,
  formatearPorcentaje,
  formatearPuntos,
} from "@/lib/ipc/constantes"
import type { IpcConReferencia } from "@/lib/ipc/queries"

import { IpcGraficas } from "./ipc-graficas"

type FilaAsegurador = {
  nombre: string
  registros: number
  promedioIpc: number
  debajo: number
  costoTotal: number
}

function resumenPorAsegurador(filas: IpcConReferencia[]): FilaAsegurador[] {
  const mapa = new Map<
    string,
    { valores: number[]; debajo: number; costoTotal: number }
  >()

  for (const fila of filas) {
    const nombre = fila.contratos.aseguradores_eps?.nombre_eps ?? "Sin asegurador"
    const actual = mapa.get(nombre) ?? { valores: [], debajo: 0, costoTotal: 0 }
    actual.valores.push(fila.porcentaje_ipc)
    actual.costoTotal += fila.costo_usuario
    if (fila.estado === "debajo") actual.debajo += 1
    mapa.set(nombre, actual)
  }

  return [...mapa.entries()]
    .map(([nombre, actual]) => ({
      nombre,
      registros: actual.valores.length,
      promedioIpc:
        actual.valores.reduce((total, valor) => total + valor, 0) /
        actual.valores.length,
      debajo: actual.debajo,
      costoTotal: actual.costoTotal,
    }))
    .sort((a, b) => b.debajo - a.debajo || b.promedioIpc - a.promedioIpc)
}

export function IpcAnalisis({
  filas,
  resumen,
}: {
  filas: IpcConReferencia[]
  resumen: ResumenIpc
}) {
  const brechas = peoresBrechas(filas, 6)
  const aseguradores = resumenPorAsegurador(filas)

  return (
    <div className="flex flex-col gap-6">
      <IpcGraficas filas={filas} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              Alertas: IPC por debajo del nacional
            </CardTitle>
            <CardDescription>
              Registros con la mayor brecha negativa. Ajusta el % IPC de estos
              contratos o verifica el histórico nacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {brechas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Ningún registro comparable está por debajo del IPC nacional.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {brechas.map((fila) => (
                  <li
                    key={fila.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {fila.contratos.numero_contrato} · {fila.anio}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {fila.contratos.aseguradores_eps?.nombre_eps ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm tabular-nums">
                      <span className="text-destructive font-semibold">
                        {formatearPorcentaje(fila.porcentaje_ipc)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        nacional {formatearPorcentaje(fila.ipc_nacional)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-destructive">
                        <ArrowDownRightIcon className="size-3.5" />
                        {formatearPuntos(fila.diferencia)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Análisis por asegurador</CardTitle>
            <CardDescription>
              Desempeño del % IPC y costo usuario agrupado por asegurador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aseguradores.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay registros para analizar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asegurador</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">% IPC prom.</TableHead>
                    <TableHead className="text-right">Por debajo</TableHead>
                    <TableHead className="text-right">Costo total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aseguradores.map((fila) => (
                    <TableRow key={fila.nombre}>
                      <TableCell className=" truncate font-medium">
                        {fila.nombre}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fila.registros}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatearPorcentaje(fila.promedioIpc)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          fila.debajo > 0 &&
                            "font-semibold text-destructive"
                        )}
                      >
                        {fila.debajo}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatearMoneda(fila.costoTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        {resumen.comparables} de {resumen.totalRegistros} registros tienen IPC
        nacional de referencia para comparar.
      </p>
    </div>
  )
}
