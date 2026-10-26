"use client"

import { Badge } from "@/components/ui/badge"
import { StandardTable, type ColumnDef } from "@/components/ui/standard-table"
import {
  etiquetaEstadoContrato,
  etiquetaModalidad,
} from "@/lib/contratos/constantes"
import type { ContratoRow } from "@/lib/contratos/queries"

import { ContratoAcciones } from "./contrato-acciones"

export function ContratosTabla({
  contratos,
  filtrado = false,
  mensajeVacio = "No hay contratos registrados.",
  volverA,
}: {
  contratos: ContratoRow[]
  filtrado?: boolean
  mensajeVacio?: string
  volverA?: string
}) {
  if (contratos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {filtrado
          ? "No hay contratos que coincidan con los filtros."
          : mensajeVacio}
      </div>
    )
  }

  const columns: ColumnDef<ContratoRow>[] = [
    { header: "Nombre del contrato", accessor: "nombre" },
    { header: "Número", accessor: "numero_contrato" },
    {
      header: "Asegurador",
      accessor: "aseguradores_eps",
      render: (_value, row) => row.aseguradores_eps?.nombre_eps ?? "—",
    },
    {
      header: "Regional",
      accessor: "regionales",
      render: (_value, row) => row.regionales?.nombre ?? "—",
    },
    {
      header: "Modalidad",
      accessor: "modalidad",
      render: (_value, row) => etiquetaModalidad(row.modalidad),
    },
    {
      header: "Tipo",
      accessor: "tipo_contrato",
      render: (_value, row) => row.tipo_contrato?.nombre ?? "—",
    },
    {
      header: "Ejecución",
      accessor: "estado_ejecucion",
      render: (_value, row) => row.estado_ejecucion?.nombre ?? "—",
    },
    {
      header: "Estado",
      accessor: "estado",
      render: (_value, row) => (
        <Badge variant={row.estado === "activo" ? "secondary" : "outline"}>
          {etiquetaEstadoContrato(row.estado)}
        </Badge>
      ),
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

  return <StandardTable data={{ rows: contratos, columns }} />
}
