import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { CupAcciones } from "./cups-acciones"
import type { CupsRow } from "@/lib/cups/queries"

export function CupsTabla({
  cups,
  filtrado = false,
}: {
  cups: CupsRow[]
  filtrado?: boolean
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
          <TableHead>Capítulo</TableHead>
          <TableHead>Sección</TableHead>
          <TableHead>Grupo de servicio</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Versión resolución</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cups.map((cup) => (
          <TableRow key={cup.id}>
            <TableCell className="font-medium">{cup.codigo}</TableCell>
            <TableCell>{cup.nombre}</TableCell>
            <TableCell className="text-muted-foreground">
              {cup.capitulo ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {cup.seccion ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {cup.grupos_servicio?.nombre ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {cup.servicios?.nombre ?? "—"}
            </TableCell>
            <TableCell>{cup.version_resolucion}</TableCell>
            <TableCell>
              <CupAcciones
                id={cup.id}
                nombre={cup.nombre}
                codigo={cup.codigo}
                activo={cup.activo}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
