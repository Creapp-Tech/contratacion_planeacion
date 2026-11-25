"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { cn } from "cn"

import { CeldaCme } from "./celda-editable"
import { SoloEscritura } from "@/components/auth/permisos-provider"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RUTA } from "@/lib/aseguradores-contratos/constantes"
import type {
  AseguradoresContratosFiltros,
  ServicioCupsListaFila,
} from "@/lib/aseguradores-contratos/types"

function numero(value: number) {
  return new Intl.NumberFormat("es-CO").format(value)
}

function frecuencia(value: number | string) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 8,
  }).format(Number(value))
}

function queryParcial(filtros: AseguradoresContratosFiltros) {
  const params = new URLSearchParams()
  if (filtros.q) params.set("q", filtros.q)
  if (filtros.aseguradorId) params.set("asegurador", filtros.aseguradorId)
  if (filtros.contratoId) params.set("contrato", filtros.contratoId)
  if (filtros.regional) params.set("regional", filtros.regional)
  return params
}

function hrefPagina(
  filtros: AseguradoresContratosFiltros,
  pagina: number,
  pageSize: number
) {
  const params = queryParcial(filtros)
  if (pageSize !== 10) params.set("pageSize", String(pageSize))
  if (pagina > 1) params.set("page", String(pagina))
  const query = params.toString()
  return query ? `${RUTA}?${query}` : RUTA
}

export function TablaServiciosCups({
  filas,
  total,
  page,
  pageSize,
  filtros,
  editables,
}: {
  filas: ServicioCupsListaFila[]
  total: number
  page: number
  pageSize: number
  filtros: AseguradoresContratosFiltros
  editables: string[]
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-4">
      {filas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay servicios CUPS que coincidan con los filtros.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asegurador</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>CUPS asegurador</TableHead>
                <TableHead>CUPS resolución</TableHead>
                <TableHead className="text-right">Frecuencia</TableHead>
                <TableHead>CME Asegurador</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => {
                const puedeEditar = editables.includes(fila.id)
                return (
                  <TableRow key={fila.id}>
                    <TableCell className="font-medium">{fila.asegurador}</TableCell>
                    <TableCell className="max-w-52 truncate text-muted-foreground" title={fila.contrato}>
                      {fila.contrato}
                    </TableCell>
                    <TableCell>{fila.cups_asegurador}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {fila.cupsResolucion ? (
                        <span className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {fila.cupsResolucion.codigo}
                          </span>
                          <span className="max-w-48 truncate text-xs">
                            {fila.cupsResolucion.nombre ?? "Sin nombre"}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.frecuencia_uso_contratada == null
                        ? "—"
                        : frecuencia(fila.frecuencia_uso_contratada)}
                    </TableCell>
                    <TableCell>
                      <CeldaCme
                        id={fila.id}
                        valor={fila.cme_contratado}
                        puedeEditar={puedeEditar}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {puedeEditar ? (
                        <SoloEscritura>
                          <Link
                            href={`${RUTA}/${fila.id}/editar`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" })
                            )}
                            aria-label={`Editar ${fila.cups_asegurador}`}
                          >
                            <Pencil />
                          </Link>
                        </SoloEscritura>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {total > pageSize ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Mostrando {numero(desde)}–{numero(hasta)} de {numero(total)}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={hrefPagina(filtros, Math.max(1, page - 1), pageSize)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                page <= 1 && "pointer-events-none opacity-50"
              )}
              aria-disabled={page <= 1}
            >
              <ChevronLeft />
              Anterior
            </Link>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPaginas}
            </span>
            <Link
              href={hrefPagina(filtros, Math.min(totalPaginas, page + 1), pageSize)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                page >= totalPaginas && "pointer-events-none opacity-50"
              )}
              aria-disabled={page >= totalPaginas}
            >
              Siguiente
              <ChevronRight />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
