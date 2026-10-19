import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { etiquetaEstadoSede, varianteEstadoSede } from "@/lib/sedes/estados"
import type { ResumenSedes, SedeListaFila } from "@/lib/sedes/queries"

import { SedeAcciones } from "./sede-acciones"

function numero(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("es-CO").format(value)
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

export function SedesTabla({
  sedes,
  resumen,
}: {
  sedes: SedeListaFila[]
  resumen: ResumenSedes
}) {
  const delta = resumen.capacidadActual - resumen.capacidadInicial
  const consultoriosDisponibles =
    resumen.consultoriosFisicos - resumen.consultorios
  const odontologiaDisponible =
    resumen.odontologiaFisica - resumen.odontologia

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Sedes" valor={numero(resumen.sedes)} />
        <Kpi
          titulo="Capacidad actual"
          valor={numero(resumen.capacidadActual)}
          detalle={`Inicial: ${numero(resumen.capacidadInicial)} (${delta >= 0 ? "+" : ""}${numero(delta)})`}
        />
        <Kpi
          titulo="Consultorios"
          valor={numero(resumen.consultorios)}
          detalle={
            consultoriosDisponibles > 0
              ? `Físicas: ${numero(resumen.consultoriosFisicos)} · Disponibles: ${numero(consultoriosDisponibles)}`
              : undefined
          }
        />
        <Kpi
          titulo="Unid. odontológicas"
          valor={numero(resumen.odontologia)}
          detalle={
            odontologiaDisponible > 0
              ? `Físicas: ${numero(resumen.odontologiaFisica)} · Disponibles: ${numero(odontologiaDisponible)}`
              : undefined
          }
        />
      </div>

      {sedes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aún no hay sedes registradas — crea la primera.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sede</TableHead>
                <TableHead>Regional</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Cap. inicial</TableHead>
                <TableHead className="text-right">Cap. actual</TableHead>
                <TableHead className="text-right">m²</TableHead>
                <TableHead className="text-right">Consultorios</TableHead>
                <TableHead className="text-right">Unid. odontológicas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sedes.map((sede) => (
                <TableRow key={sede.id}>
                  <TableCell className="font-medium">{sede.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {sede.regional ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sede.marca ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {numero(sede.capacidad_inicial)}
                  </TableCell>
                  <TableCell className="text-right">
                    {numero(sede.capacidad_usuarios)}
                  </TableCell>
                  <TableCell className="text-right">
                    {numero(sede.metros_cuadrado)}
                  </TableCell>
                  <TableCell className="text-right">
                    {numero(sede.consultorios)}
                  </TableCell>
                  <TableCell className="text-right">
                    {numero(sede.odontologia)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={varianteEstadoSede(sede.estado)}>
                      {etiquetaEstadoSede(sede.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SedeAcciones
                      id={sede.id}
                      nombre={sede.nombre}
                      estado={sede.estado}
                    />
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
