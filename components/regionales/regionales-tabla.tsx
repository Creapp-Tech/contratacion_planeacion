import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Regional } from "@/lib/regionales/queries"

import { RegionalAcciones } from "./regional-acciones"

const fecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function formatearFecha(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : fecha.format(date)
}

export function RegionalesTabla({ regionales }: { regionales: Regional[] }) {
  if (regionales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay regionales registradas.
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regionales.map((regional) => (
            <TableRow key={regional.id}>
              <TableCell className="font-medium">{regional.nombre}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatearFecha(regional.created_at)}
              </TableCell>
              <TableCell>
                <RegionalAcciones id={regional.id} nombre={regional.nombre} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
