import Link from "next/link"
import { cn } from "cn"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ESTADO_ESPECIALISTA,
} from "@/lib/direccionamiento/constantes"
import type {
  DireccionamientoFiltros,
  OpcionesDireccionamiento,
} from "@/lib/direccionamiento/types"

const CLASE_SELECT =
  "h-9 w-full min-w-0 rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function DireccionamientoFiltrosBar({
  filtros,
  opciones,
  verRegional,
}: {
  filtros: DireccionamientoFiltros
  opciones: OpcionesDireccionamiento
  verRegional: boolean
}) {
  return (
    <form
      action="/direccionamiento"
      method="get"
      className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-q" className="text-xs font-medium text-muted-foreground">
          Buscar
        </label>
        <Input
          id="f-q"
          name="q"
          defaultValue={filtros.q ?? ""}
          placeholder="Nombre o identificación"
        />
      </div>

      {verRegional ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-regional" className="text-xs font-medium text-muted-foreground">
            Regional
          </label>
          <select
            id="f-regional"
            name="regional"
            defaultValue={filtros.regional ?? ""}
            className={CLASE_SELECT}
          >
            <option value="">Todas</option>
            {opciones.regionales.map((regional) => (
              <option key={regional} value={regional}>
                {regional}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-ciudad" className="text-xs font-medium text-muted-foreground">
          Ciudad
        </label>
        <Input
          id="f-ciudad"
          name="ciudad"
          defaultValue={filtros.ciudad ?? ""}
          placeholder="Ej. Medellín"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-asegurador" className="text-xs font-medium text-muted-foreground">
          Asegurador
        </label>
        <select
          id="f-asegurador"
          name="asegurador"
          defaultValue={filtros.aseguradorId ?? ""}
          className={CLASE_SELECT}
        >
          <option value="">Todos</option>
          {opciones.aseguradores.map((asegurador) => (
            <option key={asegurador.id} value={asegurador.id}>
              {asegurador.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-especialidad" className="text-xs font-medium text-muted-foreground">
          Especialidad
        </label>
        <select
          id="f-especialidad"
          name="especialidad"
          defaultValue={filtros.especialidad ?? ""}
          className={CLASE_SELECT}
        >
          <option value="">Todas</option>
          {opciones.especialidades.map((especialidad) => (
            <option key={especialidad} value={especialidad}>
              {especialidad}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-estado" className="text-xs font-medium text-muted-foreground">
          Estado
        </label>
        <select
          id="f-estado"
          name="estado"
          defaultValue={filtros.estado ?? ""}
          className={CLASE_SELECT}
        >
          <option value="">Todos</option>
          {ESTADO_ESPECIALISTA.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Link
          href="/direccionamiento"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Limpiar
        </Link>
      </div>
    </form>
  )
}
