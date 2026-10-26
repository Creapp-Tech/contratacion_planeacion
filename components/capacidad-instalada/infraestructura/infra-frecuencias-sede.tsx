import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SedeFrecuenciaFila } from "@/lib/capacidad/agregaciones"

function CeldaFrecuencia({ valor }: { valor: string | null }) {
  if (!valor) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sin frecuencia de cálculo
      </Badge>
    )
  }

  return <span className="text-sm">{valor}</span>
}

export function InfraFrecuenciasSede({
  sedes,
}: {
  sedes: SedeFrecuenciaFila[]
}) {
  if (sedes.length === 0) return null

  const sinPlaneacion = sedes.filter(
    (sede) => !sede.frecuenciaPlaneacion
  ).length
  const sinEjecucion = sedes.filter(
    (sede) => !sede.frecuenciaEjecucion
  ).length

  return (
    <div className="flex flex-col gap-3">
      {sinPlaneacion > 0 || sinEjecucion > 0 ? (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Hay sedes sin frecuencia de cálculo</AlertTitle>
          <AlertDescription>
            {sinPlaneacion > 0
              ? `${sinPlaneacion} ${sinPlaneacion === 1 ? "sede no tiene" : "sedes no tienen"} frecuencia de nota técnica viva marcada para planeación.`
              : null}
            {sinPlaneacion > 0 && sinEjecucion > 0 ? " " : null}
            {sinEjecucion > 0
              ? `${sinEjecucion} ${sinEjecucion === 1 ? "sede no tiene" : "sedes no tienen"} frecuencia de ejecución de servicios marcada.`
              : null}{" "}
            Esas sedes muestran capacidad 0 porque no hay frecuencia marcada, no
            porque la capacidad sea realmente cero.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">
          Frecuencia usada por sede
        </h2>
        <p className="text-sm text-muted-foreground">
          Solo se calcula con la frecuencia marcada para ocupación.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sede</TableHead>
              <TableHead>Regional</TableHead>
              <TableHead>Planeación (nota técnica viva)</TableHead>
              <TableHead>Ejecución de servicios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sedes.map((sede) => (
              <TableRow key={sede.sedeId}>
                <TableCell className="font-medium">{sede.sede}</TableCell>
                <TableCell>{sede.regional}</TableCell>
                <TableCell>
                  <CeldaFrecuencia valor={sede.frecuenciaPlaneacion} />
                </TableCell>
                <TableCell>
                  <CeldaFrecuencia valor={sede.frecuenciaEjecucion} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
