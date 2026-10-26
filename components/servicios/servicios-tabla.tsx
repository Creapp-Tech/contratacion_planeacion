import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Servicio } from "@/lib/servicios/queries"

import { ServicioAcciones } from "./servicio-acciones"

export function ServiciosTabla({
  servicios,
  filtrado = false,
}: {
  servicios: Servicio[]
  filtrado?: boolean
}) {
  if (servicios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {filtrado
          ? "No hay servicios que coincidan con los filtros."
          : "No hay servicios registrados."}
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Duración (min)</TableHead>
            <TableHead>Área relacionada</TableHead>
            <TableHead>Tipo de personal</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicios.map((servicio) => (
            <TableRow key={servicio.id}>
              <TableCell className="font-medium">{servicio.nombre}</TableCell>
              <TableCell className="text-muted-foreground">
                {servicio.grupo_nombre ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {servicio.duracion_minutos ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {servicio.area_nombre
                  ? `${servicio.area_categoria ? `${servicio.area_categoria} · ` : ""}${servicio.area_nombre}`
                  : "—"}
              </TableCell>
              <TableCell>{servicio.tipo_personal}</TableCell>
              <TableCell>
                <ServicioAcciones
                  id={servicio.id}
                  nombre={servicio.nombre}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}