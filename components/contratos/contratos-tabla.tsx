"use client"

import { Badge } from "@/components/ui/badge"
import { StandardTable, type ColumnDef } from "@/components/ui/standard-table"
import {
  calcularContrato,
  calcularVigencia,
  formatearFecha,
  formatearMoneda,
  type EstadoVigencia,
  type FiltroVigencia,
} from "@/lib/contratos/constantes"
import type { ContratoRow } from "@/lib/contratos/queries"
import { formatoNumero } from "@/lib/sedes/ocupacion-utils"

import { ContratoAcciones } from "./contrato-acciones"

function aplicarFiltroVigencia(
  contratos: ContratoRow[],
  filtro: FiltroVigencia
): ContratoRow[] {
  if (filtro === "todos") return contratos

  return contratos.filter((row) => {
    const vigencia = calcularVigencia(row.fecha_fin)
    switch (filtro) {
      case "vigente":
        return vigencia.estado === "vigente"
      case "proximo_vencer":
        return vigencia.estado === "proximo_vencer"
      case "vencido":
        return vigencia.estado === "vencido"
      default:
        return true
    }
  })
}

const VARIANTE_VIGENCIA: Record<
  EstadoVigencia,
  "default" | "secondary" | "destructive" | "outline"
> = {
  vigente: "secondary",
  proximo_vencer: "destructive",
  vencido: "destructive",
  sin_fecha: "outline",
}

export function ContratosTabla({
  contratos,
  filtrado = false,
  mostrarPais = false,
  mensajeVacio = "No hay contratos registrados.",
  volverA,
  vigencia = "todos",
}: {
  contratos: ContratoRow[]
  filtrado?: boolean
  mostrarPais?: boolean
  mensajeVacio?: string
  volverA?: string
  vigencia?: FiltroVigencia
}) {
  const contratosFiltrados = aplicarFiltroVigencia(contratos, vigencia)

  if (contratosFiltrados.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {filtrado
          ? "No hay contratos que coincidan con los filtros."
          : mensajeVacio}
      </div>
    )
  }

  const columns: ColumnDef<ContratoRow>[] = [
    {
      header: "Nombre del contrato",
      accessor: "nombre",
      render: (_value, row) => (
        <div
          className="max-w-[16rem] overflow-hidden text-ellipsis"
          title={row.nombre}
        >
          <span className="font-medium block overflow-hidden text-ellipsis">
            {row.nombre}
          </span>
          <span className="text-xs text-muted-foreground block mt-0.5">
            {row.numero_contrato}
          </span>
        </div>
      ),
      cellClassName: "w-[16rem]",
    },
    {
      header: "Asegurador",
      accessor: "aseguradores_eps",
      render: (_value, row) => row.aseguradores_eps?.nombre_eps ?? "—",
    },
    ...(mostrarPais
      ? [
          {
            header: "País",
            accessor: "pais",
            render: (_value: unknown, row: ContratoRow) =>
              row.pais?.nombre ?? "—",
          } satisfies ColumnDef<ContratoRow>,
        ]
      : []),
    {
      header: "Regionales",
      accessor: "regionales",
      render: (_value, row) => {
        const nombres = row.regionales
          .map((regional) => regional.regionales?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre))
          .sort((a, b) => a.localeCompare(b, "es"))

        if (nombres.length === 0) return "—"

        return (
          <div className="flex max-w-56 flex-wrap gap-1">
            {nombres.map((nombre) => (
              <Badge key={nombre} variant="outline">
                {nombre}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      header: "Vigencia",
      accessor: "vigencia",
      render: (_value, row) => {
        const vigencia = calcularVigencia(row.fecha_fin)
        // ClassNames personalizadas por estado: verde, naranja y rojo
        const customClassName = {
          vigente: "bg-green-500 text-white",
          proximo_vencer: "bg-orange-500 text-white",
          vencido: "bg-red-500 text-white",
          sin_fecha: "bg-gray-500 text-white",
        }[vigencia.estado]
        return (
          <Badge className={customClassName} variant="default">
            {vigencia.etiqueta}
          </Badge>
        )
      },
    },
    {
      header: "Fecha de vencimiento",
      accessor: "fecha_fin",
      render: (_value, row) => formatearFecha(row.fecha_fin),
    },
    {
      header: "Valor del contrato",
      accessor: "valor_total",
      render: (_value, row) => formatearMoneda(row.valor_total),
    },
    {
      header: "Población",
      accessor: "poblacion_total",
      render: (_value, row) => formatoNumero(row.poblacion_total),
    },
    {
      header: "Costo usuario",
      accessor: "costo_usuario",
      render: (_value, row) =>
        formatearMoneda(calcularContrato(row).valorPercapita),
    },
    {
      header: "Acciones",
      accessor: "actions",
      render: (_value, row) => (
        <ContratoAcciones
          id={row.id}
          nombre={row.nombre}
          volverA={volverA}
        />
      ),
    },
  ]

  return <StandardTable data={{ rows: contratosFiltrados, columns }} />
}
