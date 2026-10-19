"use client"

import { Badge } from "@/components/ui/badge"
import { StandardTable, type ColumnDef } from "@/components/ui/standard-table"
import { estadoLabel, rolLabel } from "@/lib/constants/roles"
import type { UsuarioRow } from "@/lib/usuarios/queries"

export function UsuariosTabla({ usuarios }: { usuarios: UsuarioRow[] }) {
  const columns: ColumnDef<UsuarioRow>[] = [
    { header: "Nombre", accessor: "nombre_completo" },
    { header: "Rol", accessor: "rol", render: (_value, row) => rolLabel(row.rol) },
    {
      header: "Regional",
      accessor: "regionales",
      render: (_value, row) => row.regionales?.nombre ?? "—",
    },
    {
      header: "Estado",
      accessor: "estado",
      render: (_value, row) => (
        <Badge variant={row.estado === "activo" ? "secondary" : "outline"}>
          {estadoLabel(row.estado)}
        </Badge>
      ),
    },
    {
      header: "Acciones",
      accessor: "actions",
      render: (_value, row) => (
        <div className="flex gap-2">
          <a
            href={`/usuarios/${row.id}/editar`}
            className="text-primary hover:text-primary/80"
          >
            Editar
          </a>
        </div>
      ),
    },
  ]

  return <StandardTable data={{ rows: usuarios, columns }} />
}
