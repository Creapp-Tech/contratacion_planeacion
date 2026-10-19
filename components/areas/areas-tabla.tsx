import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Area } from "@/lib/areas/queries"

import { AreaAcciones } from "./area-acciones"

const fecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function formatearFecha(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : fecha.format(date)
}

export function AreasTabla({ areas }: { areas: Area[] }) {
  if (areas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay áreas registradas.
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Medida</TableHead>
            <TableHead>Mide capacidad</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map((area) => (
            <TableRow key={area.id}>
              <TableCell className="font-medium">{area.categoria}</TableCell>
              <TableCell>{area.nombre}</TableCell>
              <TableCell>{area.medida}</TableCell>
              <TableCell>
                {area.mide_capacidad_ocupacion ? (
                  <Badge variant="outline">Sí</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatearFecha(area.created_at)}
              </TableCell>
              <TableCell>
                <AreaAcciones
                  id={area.id}
                  nombre={area.nombre}
                  grupo={area.categoria}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
