"use client";

import { MoreHorizontalIcon, Trash2Icon, EyeIcon, EditIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlaneacionListaFila } from "@/lib/infraestructura-personal/types";

function badgeEstado(estado: PlaneacionListaFila["estado"]) {
  const variants: Record<PlaneacionListaFila["estado"], string> = {
    Borrador: "bg-amber-100 text-amber-800 border-amber-200",
    "En revisión": "bg-blue-100 text-blue-800 border-blue-200",
    Aprobada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <Badge variant="secondary" className={variants[estado]}>
      {estado}
    </Badge>
  );
}

export interface InfraestructuraPersonalTablaProps {
  filas: PlaneacionListaFila[];
  puedeEditar: boolean;
  onEditar?: (id: string) => void;
  onVer?: (id: string) => void;
  onEliminar?: (id: string) => void;
}

export function InfraestructuraPersonalTabla({
  filas,
  puedeEditar,
  onEditar,
  onVer,
  onEliminar,
}: InfraestructuraPersonalTablaProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sede</TableHead>
            <TableHead className="text-center">Tipo de sede</TableHead>
            <TableHead>Asegurador</TableHead>
            <TableHead>Régimen</TableHead>
            <TableHead>Regional</TableHead>
            <TableHead>Zonal</TableHead>
            <TableHead className="text-center">Servicios</TableHead>
            <TableHead className="text-center">Apoyos / salas</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                No se encontraron planeaciones con los filtros aplicados.
              </TableCell>
            </TableRow>
          ) : (
            filas.map((fila) => (
              <TableRow key={fila.id}>
                <TableCell className="font-medium">{fila.sede}</TableCell>
                <TableCell className="text-center text-sm">
                  {fila.tipo_sede}
                </TableCell>
                <TableCell className="text-sm">{fila.asegurador}</TableCell>
                <TableCell className="text-sm">{fila.regimen}</TableCell>
                <TableCell className="text-sm">{fila.regional}</TableCell>
                <TableCell className="text-sm">{fila.zonal}</TableCell>
                <TableCell className="text-center text-sm">{fila.servicios}</TableCell>
                <TableCell className="text-center text-sm">{fila.apoyos}</TableCell>
                <TableCell className="text-center">{badgeEstado(fila.estado)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Acciones"
                        >
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      {onVer ? (
                        <DropdownMenuItem onSelect={() => onVer(fila.id)}>
                          <EyeIcon className="mr-2 size-4" /> Ver
                        </DropdownMenuItem>
                      ) : null}
                      {puedeEditar && onEditar ? (
                        <DropdownMenuItem onSelect={() => onEditar(fila.id)}>
                          <EditIcon className="mr-2 size-4" /> Editar borrador
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      {puedeEditar && onEliminar ? (
                        <DropdownMenuItem
                          onSelect={() => onEliminar(fila.id)}
                          className="text-destructive"
                        >
                          <Trash2Icon className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
