import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CatalogoConfig } from "@/lib/catalogos/dominios"
import type { CatalogoItem } from "@/lib/catalogos/queries"

import { CatalogoAcciones } from "./catalogo-acciones"

export function CatalogosTabla({
  config,
  items,
}: {
  config: CatalogoConfig
  items: CatalogoItem[]
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay registros de {config.titulo.toLowerCase()}.
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            {config.usaDescripcion ? <TableHead>Descripción</TableHead> : null}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.nombre}</TableCell>
              {config.usaDescripcion ? (
                <TableCell className=" text-muted-foreground">
                  {item.descripcion ?? "—"}
                </TableCell>
              ) : null}
              <TableCell>
                <CatalogoAcciones
                  dominio={config.dominio}
                  id={item.id}
                  nombre={item.nombre}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
