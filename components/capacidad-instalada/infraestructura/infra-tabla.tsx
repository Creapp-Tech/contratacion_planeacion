import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatoNumero, type AreaFila } from "@/lib/capacidad/agregaciones"

export function InfraTabla({
  areas,
  hayAreasDisponibles,
}: {
  areas: AreaFila[]
  hayAreasDisponibles: boolean
}) {
  const totalActual = areas.reduce(
    (suma, area) => suma + area.capacidadActual,
    0
  )
  const totalPlaneacion = areas.reduce(
    (suma, area) => suma + area.capacidadPlaneacion,
    0
  )
  const totalEjecucion = areas.reduce(
    (suma, area) => suma + area.capacidadEjecucion,
    0
  )
  const totalDifPlaneacion = totalActual - totalPlaneacion
  const totalDifEjecucion = totalActual - totalEjecucion

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Áreas</TableHead>
            <TableHead className="text-right">Capacidad Actual</TableHead>
            <TableHead className="text-right">
              Capacidad por planeación
            </TableHead>
            <TableHead className="text-right">
              Capacidad por Ejecución
            </TableHead>
            <TableHead className="text-right">
              Diferencia (Actual − Planeación)
            </TableHead>
            <TableHead className="text-right">
              Diferencia (Actual − Ejecución)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                {hayAreasDisponibles
                  ? "Selecciona al menos un área."
                  : "Sin resultados para los filtros seleccionados."}
              </TableCell>
            </TableRow>
          ) : (
            areas.map((area) => {
              const difPlaneacion = area.capacidadActual - area.capacidadPlaneacion
              const difEjecucion = area.capacidadActual - area.capacidadEjecucion
              return (
                <TableRow key={area.areaId}>
                  <TableCell className="font-medium">{area.area}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoNumero(area.capacidadActual)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoNumero(area.capacidadPlaneacion)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoNumero(area.capacidadEjecucion)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      difPlaneacion < 0 ? "text-destructive" : difPlaneacion > 0 ? "text-green-600" : ""
                    }`}
                  >
                    {formatoNumero(difPlaneacion)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      difEjecucion < 0 ? "text-destructive" : difEjecucion > 0 ? "text-green-600" : ""
                    }`}
                  >
                    {formatoNumero(difEjecucion)}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
        {areas.length > 0 ? (
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatoNumero(totalActual)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatoNumero(totalPlaneacion)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatoNumero(totalEjecucion)}
              </TableCell>
              <TableCell
                className={`text-right tabular-nums ${
                  totalDifPlaneacion < 0 ? "text-destructive" : totalDifPlaneacion > 0 ? "text-green-600" : ""
                }`}
              >
                {formatoNumero(totalDifPlaneacion)}
              </TableCell>
              <TableCell
                className={`text-right tabular-nums ${
                  totalDifEjecucion < 0 ? "text-destructive" : totalDifEjecucion > 0 ? "text-green-600" : ""
                }`}
              >
                {formatoNumero(totalDifEjecucion)}
              </TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  )
}
