import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { GrupoServicioAdmin } from "@/lib/servicios/queries"

import { GrupoServicioAcciones } from "./grupo-servicio-acciones"

const fecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function formatearFecha(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : fecha.format(date)
}

export function GruposServicioTabla({
  grupos,
}: {
  grupos: GrupoServicioAdmin[]
}) {
  if (grupos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay grupos registrados.
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Servicios</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupos.map((grupo) => (
            <TableRow key={grupo.id}>
              <TableCell className="font-medium">{grupo.nombre}</TableCell>
              <TableCell>
                {grupo.activo ? (
                  <Badge variant="outline">Activo</Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </TableCell>
              <TableCell>{grupo.servicios_count}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatearFecha(grupo.created_at)}
              </TableCell>
              <TableCell>
                <GrupoServicioAcciones
                  id={grupo.id}
                  nombre={grupo.nombre}
                  activo={grupo.activo}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
