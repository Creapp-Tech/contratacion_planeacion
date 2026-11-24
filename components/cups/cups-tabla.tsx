import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  CupsRow,
  GrupoServicioOption,
  ServicioOption,
} from "@/lib/cups/queries"

import { CupFila } from "./cup-fila"

export function CupsTabla({
  cups,
  filtrado = false,
  grupos,
  servicios,
  puedeEditar,
}: {
  cups: CupsRow[]
  filtrado?: boolean
  grupos: GrupoServicioOption[]
  servicios: ServicioOption[]
  puedeEditar: boolean
}) {
  if (cups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {filtrado
          ? "No hay CUPS que coincidan con los filtros."
          : "No hay CUPS registrados."}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Grupo de servicio</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Versión resolución</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cups.map((cup) => (
          <CupFila
            key={cup.id}
            cup={cup}
            grupos={grupos}
            servicios={servicios}
            puedeEditar={puedeEditar}
          />
        ))}
      </TableBody>
    </Table>
  )
}
