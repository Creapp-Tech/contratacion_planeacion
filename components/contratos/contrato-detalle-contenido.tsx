import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowDownUpIcon, PlusIcon } from "lucide-react"

import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import {
  getContrato,
  listDocumentosContrato,
  listOpcionesContrato,
} from "@/lib/contratos/queries"

import { ContratoForm } from "./contrato-form"
import { ContratoHistorial } from "./contrato-historial"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export async function ContratoDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)
  const { id } = await params

  const [contrato, opciones, documentos] = await Promise.all([
    getContrato(id, alcance),
    listOpcionesContrato(alcance),
    listDocumentosContrato(id),
  ])

  if (!contrato) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Datos del contrato (vigente) */}
      <ContratoForm mode="ver" contrato={contrato} opciones={opciones} />

      {/* Pestaña / Sección Historial */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <ArrowDownUpIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">Historial de documentos</h2>
          </div>
          <Link
            href={`/contratos/${id}/nuevo-documento`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            Nuevo documento
          </Link>
        </div>
        <div className="p-6">
          <ContratoHistorial documentos={documentos} contratoId={id} />
        </div>
      </div>
    </div>
  )
}
