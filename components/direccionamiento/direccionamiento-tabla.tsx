import Link from "next/link"
import { ChevronLeft, ChevronRight, ExternalLink, Pencil } from "lucide-react"
import { cn } from "cn"

import { SoloEscritura } from "@/components/auth/permisos-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  etiquetaDireccionamiento,
  varianteEstadoDireccionamiento,
} from "@/lib/direccionamiento/constantes"
import { puedeEditarRegistroDireccionamiento } from "@/lib/direccionamiento/permisos"
import type {
  DireccionamientoFiltros,
  EspecialistaListaFila,
  ResumenDireccionamiento,
} from "@/lib/direccionamiento/types"

function numero(value: number) {
  return new Intl.NumberFormat("es-CO").format(value)
}

function Kpi({
  titulo,
  valor,
  detalle,
}: {
  titulo: string
  valor: string
  detalle?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-sm text-muted-foreground">{titulo}</span>
      <span className="text-2xl font-semibold">{valor}</span>
      {detalle ? (
        <span className="text-xs text-muted-foreground">{detalle}</span>
      ) : null}
    </div>
  )
}

function queryParcial(filtros: DireccionamientoFiltros) {
  const params = new URLSearchParams()
  if (filtros.q) params.set("q", filtros.q)
  if (filtros.regional) params.set("regional", filtros.regional)
  if (filtros.ciudad) params.set("ciudad", filtros.ciudad)
  if (filtros.aseguradorId) params.set("asegurador", filtros.aseguradorId)
  if (filtros.especialidad) params.set("especialidad", filtros.especialidad)
  if (filtros.estado) params.set("estado", filtros.estado)
  return params
}

function hrefPagina(
  filtros: DireccionamientoFiltros,
  pagina: number,
  pageSize: number
) {
  const params = queryParcial(filtros)
  if (pageSize !== 10) params.set("pageSize", String(pageSize))
  if (pagina > 1) params.set("page", String(pagina))
  const query = params.toString()
  return query ? `/direccionamiento?${query}` : "/direccionamiento"
}

export function DireccionamientoTabla({
  filas,
  resumen,
  total,
  page,
  pageSize,
  rol,
  regionalUsuario,
  usuarioId,
  filtros,
}: {
  filas: EspecialistaListaFila[]
  resumen: ResumenDireccionamiento
  total: number
  page: number
  pageSize: number
  rol: string
  regionalUsuario: string | null
  usuarioId: string
  filtros: DireccionamientoFiltros
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi titulo="Especialistas" valor={numero(resumen.especialistas)} />
        <Kpi
          titulo="Con contratos vigentes"
          valor={numero(resumen.conContratosVigentes)}
        />
        <Kpi
          titulo="Aseguradores relacionados"
          valor={numero(resumen.aseguradoresRelacionados)}
        />
        <Kpi
          titulo="Sedes direccionadas"
          valor={numero(resumen.sedesDireccionadas)}
        />
        <Kpi
          titulo="Novedades pendientes"
          valor={numero(resumen.pendientesValidacion)}
          detalle="Requieren validación"
        />
      </div>

      {filas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay especialistas que coincidan con los filtros.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Especialista</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Regionales (sedes)</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead className="text-right">Contratos</TableHead>
                <TableHead className="text-right">Aseguradores</TableHead>
                <TableHead className="text-right">Servicios</TableHead>
                <TableHead className="text-right">Sedes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => {
                const puedeEditar = puedeEditarRegistroDireccionamiento(
                  rol,
                  regionalUsuario,
                  fila.regionales,
                  fila.created_by,
                  usuarioId
                )
                return (
                  <TableRow key={fila.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/direccionamiento/${fila.id}`}
                        className="hover:underline"
                      >
                        {fila.nombre_completo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {etiquetaDireccionamiento(fila.tipo_identificacion)} ·{" "}
                      {fila.numero_identificacion}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fila.especialidad}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fila.regionales.length > 0
                        ? fila.regionales.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fila.ciudad}
                    </TableCell>
                    <TableCell className="text-right">{fila.contratos}</TableCell>
                    <TableCell className="text-right">
                      {fila.aseguradores}
                    </TableCell>
                    <TableCell className="text-right">{fila.servicios}</TableCell>
                    <TableCell className="text-right">{fila.sedes}</TableCell>
                    <TableCell>
                      <Badge variant={varianteEstadoDireccionamiento(fila.estado)}>
                        {etiquetaDireccionamiento(fila.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/direccionamiento/${fila.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                          aria-label={`Ver ${fila.nombre_completo}`}
                        >
                          <ExternalLink />
                        </Link>
                        {puedeEditar ? (
                          <SoloEscritura>
                            <Link
                              href={`/direccionamiento/${fila.id}/editar`}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "sm" })
                              )}
                              aria-label={`Editar ${fila.nombre_completo}`}
                            >
                              <Pencil />
                            </Link>
                          </SoloEscritura>
                        ) : null}
                      </div>
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
