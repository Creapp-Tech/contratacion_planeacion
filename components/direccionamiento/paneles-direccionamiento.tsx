import { SoloEscritura } from "@/components/auth/permisos-provider"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AsignacionSedeDialog,
} from "@/components/direccionamiento/asignacion-sede-dialog"
import { ContratoDialog } from "@/components/direccionamiento/contrato-dialog"
import { NovedadDialog } from "@/components/direccionamiento/novedad-dialog"
import { ServicioDialog } from "@/components/direccionamiento/servicio-dialog"
import { ValidacionNovedad } from "@/components/direccionamiento/validacion-novedad"
import { RetirarAsignacion } from "@/components/direccionamiento/retirar-asignacion"
import {
  CAMPOS_HISTORIAL_DIRECCIONAMIENTO,
  TABLAS_HISTORIAL_DIRECCIONAMIENTO,
  etiquetaDireccionamiento,
  varianteEstadoDireccionamiento,
} from "@/lib/direccionamiento/constantes"
import type {
  DireccionamientoDetalle,
  OpcionesDireccionamiento,
} from "@/lib/direccionamiento/types"

function fecha(value: string | null) {
  if (!value) return "—"
  const partes = value.split("-")
  if (partes.length !== 3) return value
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function numero(value: number | string | null | undefined) {
  if (value == null || value === "") return "—"
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(
    Number(value)
  )
}

function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      {mensaje}
    </div>
  )
}

type PanelProps = {
  detalle: DireccionamientoDetalle
  opciones: OpcionesDireccionamiento
  puedeEditar: boolean
}

export function PanelResumen({ detalle }: PanelProps) {
  const pendientes = detalle.novedades.filter(
    (novedad) => novedad.estado_validacion === "pendiente"
  ).length

  const kpis = [
    { titulo: "Contratos", valor: detalle.contratos.length },
    { titulo: "Servicios CUPS", valor: detalle.servicios.length },
    { titulo: "Asignaciones de sede", valor: detalle.asignaciones.length },
    { titulo: "Novedades pendientes", valor: pendientes },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.titulo}
            className="flex flex-col gap-1 rounded-xl border bg-card p-4"
          >
            <span className="text-sm text-muted-foreground">{kpi.titulo}</span>
            <span className="text-2xl font-semibold">{kpi.valor}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <h3 className="font-heading font-medium">Datos del especialista</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Identificación</dt>
              <dd className="font-medium">
                {etiquetaDireccionamiento(detalle.especialista.tipo_identificacion)}{" "}
                {detalle.especialista.numero_identificacion}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipo de persona</dt>
              <dd className="font-medium">
                {etiquetaDireccionamiento(detalle.especialista.tipo_persona)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Especialidad</dt>
              <dd className="font-medium">{detalle.especialista.especialidad}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Regionales / Ciudad</dt>
              <dd className="font-medium">
                {detalle.regionales.length > 0
                  ? detalle.regionales.join(", ")
                  : "Sin sedes asignadas"}{" "}
                · {detalle.especialista.ciudad}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <h3 className="font-heading font-medium">Últimas novedades</h3>
          {detalle.novedades.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no se han registrado novedades.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {detalle.novedades.slice(0, 4).map((novedad) => (
                <li
                  key={novedad.id}
                  className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                >
                  <span>{etiquetaDireccionamiento(novedad.tipo_novedad)}</span>
                  <Badge
                    variant={varianteEstadoDireccionamiento(
                      novedad.estado_validacion
                    )}
                  >
                    {etiquetaDireccionamiento(novedad.estado_validacion)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function PanelContratos({
  detalle,
  opciones,
  puedeEditar,
}: PanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {puedeEditar ? (
          <SoloEscritura>
            <ContratoDialog
              especialistaId={detalle.especialista.id}
              opciones={opciones}
            />
          </SoloEscritura>
        ) : null}
      </div>
      {detalle.contratos.length === 0 ? (
        <Vacio mensaje="Este especialista aún no tiene contratos con aseguradores." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asegurador</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Régimen</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead className="text-right">Servicios</TableHead>
                <TableHead className="text-right">Sedes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalle.contratos.map((contrato) => (
                <TableRow key={contrato.id}>
                  <TableCell className="font-medium">
                    {contrato.aseguradores_eps?.nombre_eps ?? "—"}
                  </TableCell>
                  <TableCell>{contrato.numero_contrato ?? "—"}</TableCell>
                  <TableCell>{contrato.regimenes?.nombre ?? "—"}</TableCell>
                  <TableCell>
                    {etiquetaDireccionamiento(contrato.modalidad_prestacion)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fecha(contrato.fecha_inicio)} –{" "}
                    {fecha(contrato.fecha_terminacion)}
                  </TableCell>
                  <TableCell className="text-right">{contrato.servicios}</TableCell>
                  <TableCell className="text-right">{contrato.sedes}</TableCell>
                  <TableCell>
                    <Badge variant={varianteEstadoDireccionamiento(contrato.estado)}>
                      {etiquetaDireccionamiento(contrato.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {puedeEditar ? (
                      <SoloEscritura>
                        <ContratoDialog
                          especialistaId={detalle.especialista.id}
                          opciones={opciones}
                          contrato={contrato}
                        />
                      </SoloEscritura>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function PanelServicios({ detalle, opciones, puedeEditar }: PanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {puedeEditar ? (
          <SoloEscritura>
            <ServicioDialog
              contratos={detalle.contratos}
              opciones={opciones}
            />
          </SoloEscritura>
        ) : null}
      </div>
      {detalle.servicios.length === 0 ? (
        <Vacio mensaje="Agrega primero un contrato y luego registra sus servicios CUPS." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUPS</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Agrupador</TableHead>
                <TableHead className="text-right">Tarifa</TableHead>
                <TableHead className="text-right">% Dto/Inc</TableHead>
                <TableHead className="text-right">Sedes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalle.servicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {servicio.cups?.codigo ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {servicio.cups?.nombre ?? ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {servicio.contratos_especialistas?.aseguradores_eps?.nombre_eps ?? "—"}
                    {servicio.contratos_especialistas?.numero_contrato
                      ? ` · ${servicio.contratos_especialistas.numero_contrato}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {etiquetaDireccionamiento(servicio.agrupador)}
                  </TableCell>
                  <TableCell className="text-right">
                    {numero(servicio.valor_tarifa)}
                  </TableCell>
                  <TableCell className="text-right">
                    {numero(servicio.porcentaje_descuento_incremento)}
                  </TableCell>
                  <TableCell className="text-right">{servicio.sedes}</TableCell>
                  <TableCell className="text-right">
                    {puedeEditar ? (
                      <SoloEscritura>
                        <ServicioDialog
                          contratos={detalle.contratos}
                          opciones={opciones}
                          servicio={servicio}
                          cupsLabel={
                            servicio.cups?.nombre
                              ? `${servicio.cups.codigo} — ${servicio.cups.nombre}`
                              : servicio.cups?.codigo ?? null
                          }
                        />
                      </SoloEscritura>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function PanelSedes({ detalle, opciones, puedeEditar }: PanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {puedeEditar ? (
          <SoloEscritura>
            <AsignacionSedeDialog
              especialistaId={detalle.especialista.id}
              contratos={detalle.contratos}
              servicios={detalle.servicios}
              sedes={opciones.sedes}
            />
          </SoloEscritura>
        ) : null}
      </div>
      {detalle.asignaciones.length === 0 ? (
        <Vacio mensaje="Aún no hay sedes asignadas. Puedes agregar varias sedes a un servicio en una sola asignación." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sede</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Servicio CUPS</TableHead>
                <TableHead>Tipo de red</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalle.asignaciones.map((asignacion) => (
                <TableRow key={asignacion.id}>
                  <TableCell className="font-medium">
                    {asignacion.sedes?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asignacion.contratos_especialistas?.aseguradores_eps?.nombre_eps ?? "—"}
                    {asignacion.contratos_especialistas?.numero_contrato
                      ? ` · ${asignacion.contratos_especialistas.numero_contrato}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {asignacion.servicios_contratados_especialistas?.cups?.codigo ?? "—"}
                    {asignacion.servicios_contratados_especialistas?.cups?.nombre
                      ? ` — ${asignacion.servicios_contratados_especialistas.cups.nombre}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {etiquetaDireccionamiento(asignacion.tipo_red)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {puedeEditar ? (
                        <SoloEscritura>
                          <AsignacionSedeDialog
                            especialistaId={detalle.especialista.id}
                            contratos={detalle.contratos}
                            servicios={detalle.servicios}
                            sedes={opciones.sedes}
                            asignacion={asignacion}
                          />
                          <RetirarAsignacion
                            id={asignacion.id}
                            sede={asignacion.sedes?.nombre ?? "la sede"}
                          />
                        </SoloEscritura>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function PanelNovedades({ detalle, opciones, puedeEditar }: PanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {puedeEditar ? (
          <SoloEscritura>
            <NovedadDialog
              especialistaId={detalle.especialista.id}
              contratos={detalle.contratos}
              servicios={detalle.servicios}
              asignaciones={detalle.asignaciones}
              opciones={opciones}
            />
          </SoloEscritura>
        ) : null}
      </div>
      {detalle.novedades.length === 0 ? (
        <Vacio mensaje="No hay novedades registradas para este especialista." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Relación</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead>Validación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalle.novedades.map((novedad) => (
                <TableRow key={novedad.id}>
                  <TableCell className="font-medium">
                    {etiquetaDireccionamiento(novedad.tipo_novedad)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {novedad.contratos_especialistas
                      ? `Contrato ${novedad.contratos_especialistas.numero_contrato ?? ""}`.trim()
                      : novedad.servicios_contratados_especialistas
                        ? `CUPS ${novedad.servicios_contratados_especialistas.cups?.codigo ?? ""}`.trim()
                        : novedad.sedes_servicios_especialistas
                          ? `Sede ${novedad.sedes_servicios_especialistas.sedes?.nombre ?? ""}`.trim()
                          : "General"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fecha(novedad.fecha_inicio)} –{" "}
                    {fecha(novedad.fecha_terminacion)}
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
                    {novedad.observaciones ?? "—"}
                  </TableCell>
                  <TableCell>
                    {puedeEditar ? (
                      <SoloEscritura>
                        <ValidacionNovedad
                          id={novedad.id}
                          valor={novedad.estado_validacion}
                        />
                      </SoloEscritura>
                    ) : (
                      <Badge
                        variant={varianteEstadoDireccionamiento(
                          novedad.estado_validacion
                        )}
                      >
                        {etiquetaDireccionamiento(novedad.estado_validacion)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {puedeEditar ? (
                      <SoloEscritura>
                        <NovedadDialog
                          especialistaId={detalle.especialista.id}
                          contratos={detalle.contratos}
                          servicios={detalle.servicios}
                          asignaciones={detalle.asignaciones}
                          opciones={opciones}
                          novedad={novedad}
                        />
                      </SoloEscritura>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function PanelHistorial({ detalle }: PanelProps) {
  if (detalle.historial.length === 0) {
    return <Vacio mensaje="Todavía no se registran cambios en este especialista." />
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Campo</TableHead>
            <TableHead>Valor anterior</TableHead>
            <TableHead>Valor nuevo</TableHead>
            <TableHead>Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalle.historial.map((cambio) => (
            <TableRow key={cambio.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {new Date(cambio.created_at).toLocaleString("es-CO")}
              </TableCell>
              <TableCell>
                {TABLAS_HISTORIAL_DIRECCIONAMIENTO[cambio.tabla] ?? cambio.tabla}
              </TableCell>
              <TableCell className="font-medium">
                {CAMPOS_HISTORIAL_DIRECCIONAMIENTO[cambio.campo] ?? cambio.campo}
              </TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">
                {cambio.valor_anterior ?? "—"}
              </TableCell>
              <TableCell className="max-w-64 truncate">
                {cambio.valor_nuevo ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cambio.usuarios?.nombre_completo ?? "Sistema"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
