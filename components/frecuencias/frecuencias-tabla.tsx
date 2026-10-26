import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Frecuencia } from "@/lib/frecuencias/queries"
import { etiquetaTipoFrecuencia, tipoCalculaOcupacion } from "@/lib/frecuencias/tipos"

import { FrecuenciaAcciones } from "./frecuencia-acciones"
import { FrecuenciaCalculoSwitch } from "./frecuencia-calculo-switch"

export function FrecuenciasTabla({
  frecuencias,
}: {
  frecuencias: Frecuencia[]
}) {
  if (frecuencias.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay frecuencias registradas.
      </div>
    )
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo de frecuencia</TableHead>
            <TableHead>Nota técnica</TableHead>
            <TableHead>Sede</TableHead>
            <TableHead>Régimen</TableHead>
            <TableHead>Asegurador</TableHead>
            <TableHead>Versión</TableHead>
            <TableHead>Cálculo de ocupación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {frecuencias.map((frecuencia) => (
            <TableRow key={frecuencia.id}>
              <TableCell>
                {etiquetaTipoFrecuencia(frecuencia.tipo_frecuencia)}
              </TableCell>
              <TableCell className="font-medium">
                {frecuencia.nombre_nota_tecnica}
              </TableCell>
              <TableCell>{frecuencia.sede_nombre}</TableCell>
              <TableCell>{frecuencia.regimen_nombre}</TableCell>
              <TableCell>{frecuencia.asegurador_nombre}</TableCell>
              <TableCell>{frecuencia.version}</TableCell>
              <TableCell>
                {tipoCalculaOcupacion(frecuencia.tipo_frecuencia) ? (
                  <FrecuenciaCalculoSwitch
                    id={frecuencia.id}
                    sedeNombre={frecuencia.sede_nombre}
                    nombre={frecuencia.nombre_nota_tecnica}
                    version={frecuencia.version}
                    marcada={frecuencia.usar_en_calculo}
                    activa={frecuencia.activo}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <FrecuenciaAcciones
                  id={frecuencia.id}
                  marcada={frecuencia.usar_en_calculo}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
