import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AseguradorAdmin } from "@/lib/aseguradores/queries"

import { AseguradorAcciones } from "./asegurador-acciones"

export function AseguradoresTabla({
  aseguradores,
}: {
  aseguradores: AseguradorAdmin[]
}) {
  if (aseguradores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay aseguradores registrados.
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aseguradores.map((asegurador) => (
            <TableRow key={asegurador.id}>
              <TableCell className="font-medium">
                {asegurador.nombre_eps}
              </TableCell>
              <TableCell>
                <AseguradorAcciones
                  id={asegurador.id}
                  nombre={asegurador.nombre_eps}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
