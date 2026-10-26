"use client"

import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { StandardTable, type ColumnDef } from "@/components/ui/standard-table"
import {
  ETIQUETAS_ESTADO_IPC,
  formatearMoneda,
  formatearPorcentaje,
  formatearPuntos,
} from "@/lib/ipc/constantes"
import type { IpcConReferencia } from "@/lib/ipc/queries"

import { IpcAcciones } from "./ipc-acciones"

function EstadoIpcBadge({ fila }: { fila: IpcConReferencia }) {
  if (fila.estado === "debajo") {
    return (
      <Badge variant="destructive">
        <ArrowDownRightIcon />
        {ETIQUETAS_ESTADO_IPC.debajo}
      </Badge>
    )
  }

  if (fila.estado === "arriba") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      >
        <ArrowUpRightIcon />
        {ETIQUETAS_ESTADO_IPC.arriba}
      </Badge>
    )
  }

  if (fila.estado === "igual") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      >
        <MinusIcon />
        {ETIQUETAS_ESTADO_IPC.igual}
      </Badge>
    )
  }

  return <Badge variant="ghost">{ETIQUETAS_ESTADO_IPC.sin_referencia}</Badge>
}

export function IpcTabla({
  filas,
  filtrado = false,
}: {
  filas: IpcConReferencia[]
  filtrado?: boolean
}) {
  if (filas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {filtrado
          ? "No hay registros IPC que coincidan con los filtros."
          : "No hay registros IPC. Crea el primero con el botón «Nuevo registro»."}
      </div>
    )
  }

  const columns: ColumnDef<IpcConReferencia>[] = [
    {
      header: "Contrato",
      accessor: "contratos",
      render: (_value, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.contratos.numero_contrato}</span>
          <span className="text-xs text-muted-foreground">
            {row.contratos.nombre}
          </span>
        </div>
      ),
    },
    {
      header: "Asegurador",
      accessor: "asegurador",
      render: (_value, row) =>
        row.contratos.aseguradores_eps?.nombre_eps ?? "—",
    },
    {
      header: "Regional",
      accessor: "regional",
      render: (_value, row) => row.contratos.regionales?.nombre ?? "—",
    },
    {
      header: "Ejecución",
      accessor: "estado_ejecucion",
      render: (_value, row) => {
        const estado = row.contratos.estado_ejecucion?.nombre ?? "Sin estado"
        const enEjecucion = estado === "En ejecución"

        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              enEjecucion
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-amber-800 dark:text-amber-500"
            )}
          >
            {!enEjecucion ? (
              <span aria-hidden className="size-1.5 rounded-full bg-current" />
            ) : null}
            {estado}
          </span>
        )
      },
    },
    {
      header: "Año",
      accessor: "anio",
      render: (_value, row) => (
        <span className="tabular-nums">{row.anio}</span>
      ),
    },
    {
      header: "Costo usuario",
      accessor: "costo_usuario",
      render: (_value, row) => (
        <span className="tabular-nums">
          {formatearMoneda(row.costo_usuario)}
        </span>
      ),
    },
    {
      header: "UPC Contributivo",
      accessor: "upc",
      render: (_value, row) => (
        <span className="tabular-nums">{formatearMoneda(row.upc)}</span>
      ),
    },
    {
      header: "UPC Subsidiado",
      accessor: "upc_subsidiado",
      render: (_value, row) => (
        <span className="tabular-nums">
          {formatearMoneda(row.upc_subsidiado)}
        </span>
      ),
    },
    {
      header: "% IPC",
      accessor: "porcentaje_ipc",
      render: (_value, row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold tabular-nums",
            row.estado === "debajo" && "text-destructive"
          )}
        >
          {row.estado === "debajo" ? <ArrowDownRightIcon className="size-3.5" /> : null}
          {formatearPorcentaje(row.porcentaje_ipc)}
        </span>
      ),
    },
    {
      header: "IPC nacional",
      accessor: "ipc_nacional",
      render: (_value, row) =>
        row.ipc_nacional == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="tabular-nums">
            {formatearPorcentaje(row.ipc_nacional)}
          </span>
        ),
    },
    {
      header: "Diferencia",
      accessor: "diferencia",
      render: (_value, row) =>
        row.diferencia == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              "tabular-nums",
              row.diferencia < 0 && "font-medium text-destructive",
              row.diferencia > 0 && "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {formatearPuntos(row.diferencia)}
          </span>
        ),
    },
    {
      header: "Estado",
      accessor: "estado",
      render: (_value, row) => <EstadoIpcBadge fila={row} />,
    },
    {
      header: "Acciones",
      accessor: "actions",
      render: (_value, row) => (
        <IpcAcciones
          id={row.id}
          etiqueta={`${row.contratos.numero_contrato} · ${row.anio}`}
        />
      ),
    },
  ]

  return <StandardTable data={{ rows: filas, columns }} />
}
