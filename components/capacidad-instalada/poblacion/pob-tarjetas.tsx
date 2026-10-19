"use client"

import { XIcon } from "lucide-react"
import { cn } from "cn"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CATEGORIAS,
  ETIQUETAS_CATEGORIA,
  formatoNumero,
  formatoPct,
  type CategoriaOcupacion,
} from "@/lib/capacidad/agregaciones"

import { useParametrosBusqueda } from "../use-parametros"

const PARAM_CATEGORIA = "p_cat"

const ACENTO: Record<CategoriaOcupacion, string> = {
  sin: "border-l-destructive",
  cerca: "border-l-amber-500",
  disp: "border-l-emerald-600",
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-semibold tabular-nums">{valor}</span>
      </CardContent>
    </Card>
  )
}

export function PobTarjetas({
  capacidad,
  poblacion,
  ocupacion,
  conteo,
  categoria,
  etiquetaPoblacion,
  etiquetaCapacidad,
}: {
  capacidad: number
  poblacion: number
  ocupacion: number | null
  conteo: Record<CategoriaOcupacion, number>
  categoria?: CategoriaOcupacion
  etiquetaPoblacion: string
  etiquetaCapacidad: string
}) {
  const { actualizar, searchParams } = useParametrosBusqueda()

  function alternarCategoria(valor: CategoriaOcupacion) {
    const actual = searchParams.get(PARAM_CATEGORIA)
    actualizar({
      [PARAM_CATEGORIA]: actual === valor ? undefined : valor,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta
          titulo={`Total capacidad de la sede (${etiquetaCapacidad})`}
          valor={formatoNumero(capacidad)}
        />
        <Tarjeta
          titulo={`Población ${etiquetaPoblacion}`}
          valor={formatoNumero(poblacion)}
        />
        <Tarjeta
          titulo="Porcentaje de ocupación"
          valor={formatoPct(ocupacion)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CATEGORIAS.map((valor) => {
          const meta = ETIQUETAS_CATEGORIA[valor]
          const seleccionada = categoria === valor
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={seleccionada}
              onClick={() => alternarCategoria(valor)}
              className={cn(
                "rounded-xl border border-l-4 bg-card p-4 text-left shadow-xs transition-transform hover:-translate-y-0.5",
                ACENTO[valor],
                seleccionada && "ring-2 ring-primary"
              )}
            >
              <span className="block text-xs text-muted-foreground">
                {meta.titulo}
              </span>
              <span className="mt-1 block text-2xl font-semibold tabular-nums">
                {conteo[valor]}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {meta.detalle}
              </span>
            </button>
          )
        })}
      </div>

      {categoria ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtrando por:</span>
          <button
            type="button"
            onClick={() => actualizar({ [PARAM_CATEGORIA]: undefined })}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {ETIQUETAS_CATEGORIA[categoria].larga}
            <XIcon className="size-3" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
