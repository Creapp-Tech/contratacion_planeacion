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
  vencido: "outline",
  sin_fecha: "outline",
}

export function ContratosTabla({
  contratos,
  filtrado = false,
  mensajeVacio = "No hay contratos registrados.",
  volverA,
  vigencia = "todos",
}: {
  contratos: ContratoRow[]
  filtrado?: boolean
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
        <div className="flex min-w-48 flex-col gap-0.5">
          <span className="font-medium">{row.nombre}</span>
          <span className="text-xs text-muted-foreground">
            {row.numero_contrato}
          </span>
        </div>
      ),
    },
    {
      header: "Asegurador",
      accessor: "aseguradores_eps",
      render: (_value, row) => row.aseguradores_eps?.nombre_eps ?? "—",
    },
    {
      header: "Vigencia",
      accessor: "vigencia",
      render: (_value, row) => {
        const vigencia = calcularVigencia(row.fecha_fin)
        return (
          <Badge variant={VARIANTE_VIGENCIA[vigencia.estado]}>
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
