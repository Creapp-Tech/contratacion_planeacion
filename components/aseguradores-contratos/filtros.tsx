import Link from "next/link"
import { cn } from "cn"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RUTA } from "@/lib/aseguradores-contratos/constantes"
import type {
  AseguradoresContratosFiltros,
  OpcionesAseguradoresContratos,
} from "@/lib/aseguradores-contratos/types"
import { CLASE_SELECT } from "@/lib/prestadores-contratos/ui"

export function FiltrosServicios({
  filtros,
  opciones,
  regionales,
  verRegional,
}: {
  filtros: AseguradoresContratosFiltros
  opciones: OpcionesAseguradoresContratos
  regionales: string[]
  verRegional: boolean
}) {
  return (
    <form
      action={RUTA}
      method="get"
      className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-q" className="text-xs font-medium text-muted-foreground">
          Buscar
        </label>
        <Input
          id="f-q"
          name="q"
          defaultValue={filtros.q ?? ""}
          placeholder="CUPS, contrato o asegurador"
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
        <label htmlFor="f-contrato" className="text-xs font-medium text-muted-foreground">
          Contrato
        </label>
        <select
          id="f-contrato"
          name="contrato"
          defaultValue={filtros.contratoId ?? ""}
          className={CLASE_SELECT}
        >
          <option value="">Todos</option>
          {opciones.contratos.map((contrato) => (
            <option key={contrato.id} value={contrato.id}>
              {contrato.numero_contrato} · {contrato.nombre}
            </option>
          ))}
        </select>
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
            {regionales.map((regional) => (
              <option key={regional} value={regional}>
                {regional}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Link href={RUTA} className={cn(buttonVariants({ variant: "ghost" }))}>
          Limpiar
        </Link>
      </div>
    </form>
  )
}
