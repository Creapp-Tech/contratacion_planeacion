"use client"

import { StandardTable, type ColumnDef } from "@/components/ui/standard-table"
import {
  formatearMoneda,
  formatearPorcentaje,
} from "@/lib/ipc/constantes"
import type { IpcNacionalRow } from "@/lib/ipc/queries"

import { IpcNacionalAcciones } from "./ipc-nacional-acciones"

function formatearFecha(value: string): string {
  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return "—"
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(fecha)
}

export function IpcNacionalTabla({ filas }: { filas: IpcNacionalRow[] }) {
  if (filas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay registros de IPC nacional. Crea el primero con el botón «Nuevo
        registro».
      </div>
    )
  }

  const columns: ColumnDef<IpcNacionalRow>[] = [
    {
      header: "País",
      accessor: "pais",
      render: (_value, row) => (
        <span className="font-medium">{row.pais}</span>
      ),
    },
    {
      header: "Año",
      accessor: "anio",
      render: (_value, row) => (
        <span className="tabular-nums">{row.anio}</span>
      ),
    },
    {
      header: "% IPC",
      accessor: "porcentaje_ipc",
      render: (_value, row) => (
        <span className="tabular-nums">
          {formatearPorcentaje(row.porcentaje_ipc)}
        </span>
      ),
    },
    {
      header: "Valor UPC Contributivo",
      accessor: "valor_upc_contributivo",
      render: (_value, row) => (
        <span className="tabular-nums">
          {formatearMoneda(row.valor_upc_contributivo)}
        </span>
      ),
    },
    {
      header: "Valor UPC Subsidiado",
      accessor: "valor_upc_subsidiado",
      render: (_value, row) =>
        row.valor_upc_subsidiado == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="tabular-nums">
            {formatearMoneda(row.valor_upc_subsidiado)}
          </span>
        ),
    },
    {
      header: "Actualizado",
      accessor: "updated_at",
      render: (_value, row) => (
        <span className="text-xs text-muted-foreground">
          {formatearFecha(row.updated_at)}
        </span>
      ),
    },
    {
      header: "Acciones",
      accessor: "actions",
      render: (_value, row) => (
        <IpcNacionalAcciones
          id={row.id}
          etiqueta={`${row.pais} · ${row.anio}`}
        />
      ),
    },
  ]

  return <StandardTable data={{ rows: filas, columns }} />
}
