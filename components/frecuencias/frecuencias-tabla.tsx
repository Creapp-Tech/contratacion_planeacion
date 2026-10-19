import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Frecuencia } from "@/lib/frecuencias/queries"
import { etiquetaTipoFrecuencia } from "@/lib/frecuencias/tipos"

import { FrecuenciaAcciones } from "./frecuencia-acciones"

export function FrecuenciasTabla({
  frecuencias,
}: {
  frecuencias: Frecuencia[]
}) {
  if (frecuencias.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay frecuencias registradas.
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo de frecuencia</TableHead>
            <TableHead>Nota técnica</TableHead>
            <TableHead>Sede</TableHead>
            <TableHead>Régimen</TableHead>
            <TableHead>Asegurador</TableHead>
            <TableHead>Versión</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {frecuencias.map((frecuencia) => (
            <TableRow key={frecuencia.id}>
              <TableCell>
                {etiquetaTipoFrecuencia(frecuencia.tipo_frecuencia)}
              </TableCell>
              <TableCell className="font-medium">
                {frecuencia.nombre_nota_tecnica}
              </TableCell>
              <TableCell>{frecuencia.sede_nombre}</TableCell>
              <TableCell>{frecuencia.regimen_nombre}</TableCell>
              <TableCell>{frecuencia.asegurador_nombre}</TableCell>
              <TableCell>{frecuencia.version}</TableCell>
              <TableCell>
                <FrecuenciaAcciones id={frecuencia.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
