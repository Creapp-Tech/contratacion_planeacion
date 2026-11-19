import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatoNumero } from "@/lib/sedes/ocupacion-utils"
import {
  resumenPoblaciones,
  type PoblacionFila,
} from "@/lib/poblaciones/queries"

import { PoblacionFila as PoblacionFilaComponent } from "./poblacion-fila"

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

export function PoblacionesTabla({
  filas,
  puedeEditar = false,
  mensajeVacio,
}: {
  filas: PoblacionFila[]
  puedeEditar?: boolean
  mensajeVacio?: string
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
          {mensajeVacio ?? "Aún no hay poblaciones registradas — crea la primera."}
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
                <PoblacionFilaComponent
                  key={fila.id}
                  fila={fila}
                  puedeEditar={puedeEditar}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
