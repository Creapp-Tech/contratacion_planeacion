import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { CupAcciones } from "./cups-acciones"

export function CupsTabla({
  cups,
  filtrado = false,
}: {
  cups: any[]
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
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Grupo de servicio</TableHead>
            <TableHead>Servicio</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Sección</TableHead>
            <TableHead>Versión resolución</TableHead>
            <TableHead>Fecha inicio</TableHead>
            <TableHead>Fecha fin</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cups.map((cup) => (
            <TableRow key={cup.id}>
              <TableCell className="font-medium">{cup.codigo}</TableCell>
              <TableCell className="text-muted-foreground">
                {cup.grupos_servicio?.nombre ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cup.servicios?.nombre ?? "—"}
              </TableCell>
              <TableCell>{cup.descripcion}</TableCell>
              <TableCell className="text-muted-foreground">{cup.seccion}</TableCell>
              <TableCell>{cup.version_resolucion}</TableCell>
              <TableCell>{new Date(cup.fecha_inicio).toLocaleDateString()}</TableCell>
              <TableCell>{cup.fecha_fin ? new Date(cup.fecha_fin).toLocaleDateString() : "—"}</TableCell>
              <TableCell>
                <CupAcciones
                  id={cup.id}
                  nombre={cup.descripcion}
                  codigo={cup.codigo}
                  activo={cup.activo}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
