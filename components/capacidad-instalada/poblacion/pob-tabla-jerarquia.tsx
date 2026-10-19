"use client"

import { Fragment, useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  calcularOcupacion,
  categoriaOcupacion,
  formatoNumero,
  formatoPct,
  idsDelArbol,
  type NodoArbol,
} from "@/lib/capacidad/agregaciones"

const ACENTO_PILL: Record<string, string> = {
  sin: "bg-destructive/10 text-destructive",
  cerca: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  disp: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400",
}

function Filas({
  nodos,
  abiertos,
  onAlternar,
  profundidad,
}: {
  nodos: NodoArbol[]
  abiertos: Set<string>
  onAlternar: (id: string) => void
  profundidad: number
}) {
  return (
    <>
      {nodos.map((nodo) => {
        const conHijos = Boolean(nodo.hijos)
        const abierto = abiertos.has(nodo.id)
        const ocupacion = calcularOcupacion(nodo.poblacion, nodo.capacidad)
        const categoria = categoriaOcupacion(nodo.poblacion, nodo.capacidad)
        const disponibilidad = nodo.capacidad - nodo.poblacion

        return (
          <Fragment key={nodo.id}>
            <TableRow
              className={cn(
                profundidad === 0 && "font-bold",
                profundidad === 1 && "font-semibold",
                conHijos && "cursor-pointer hover:bg-primary/5"
              )}
              aria-expanded={conHijos ? abierto : undefined}
              onClick={conHijos ? () => onAlternar(nodo.id) : undefined}
            >
              <TableCell
                style={{ paddingLeft: `${12 + profundidad * 24}px` }}
              >
                <span className="inline-block w-4 text-primary">
                  {conHijos ? (abierto ? "▾" : "▸") : ""}
                </span>
                {nodo.etiqueta}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatoNumero(nodo.capacidad)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatoNumero(nodo.poblacion)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                    ACENTO_PILL[categoria]
                  )}
                >
                  {ocupacion == null ? "—" : formatoPct(ocupacion)}
                </span>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  disponibilidad < 0 && "text-destructive"
                )}
              >
                {formatoNumero(disponibilidad)}
              </TableCell>
            </TableRow>
            {conHijos && abierto && nodo.hijos ? (
              <Filas
                nodos={nodo.hijos}
                abiertos={abiertos}
                onAlternar={onAlternar}
                profundidad={profundidad + 1}
              />
            ) : null}
          </Fragment>
        )
      })}
    </>
  )
}

export function PobTablaJerarquia({
  nodos,
  titulo,
  primeraColumna,
  etiquetaCapacidad,
  etiquetaPoblacion,
}: {
  nodos: NodoArbol[]
  titulo: string
  primeraColumna: string
  etiquetaCapacidad: string
  etiquetaPoblacion: string
}) {
  const [abiertos, setAbiertos] = useState<Set<string>>(
    () => new Set(idsDelArbol(nodos))
  )

  function alternar(id: string) {
    setAbiertos((actual) => {
      const siguiente = new Set(actual)
      if (siguiente.has(id)) {
        siguiente.delete(id)
      } else {
        siguiente.add(id)
      }
      return siguiente
    })
  }

  function expandirTodo() {
    setAbiertos(new Set(idsDelArbol(nodos)))
  }

  function contraerTodo() {
    setAbiertos(new Set())
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-base font-medium">{titulo}</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={expandirTodo}>
            Expandir todo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={contraerTodo}>
            Contraer todo
          </Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{primeraColumna}</TableHead>
              <TableHead className="text-right">
                Capacidad {etiquetaCapacidad}
              </TableHead>
              <TableHead className="text-right">
                Población {etiquetaPoblacion}
              </TableHead>
              <TableHead className="text-right">% Ocupación</TableHead>
              <TableHead className="text-right">Disponibilidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  Sin resultados para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              <Filas
                nodos={nodos}
                abiertos={abiertos}
                onAlternar={alternar}
                profundidad={0}
              />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
