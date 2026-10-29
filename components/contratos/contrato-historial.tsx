"use client"

import Link from "next/link"
import { TreePineIcon, FileTextIcon, CheckCircleIcon } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import type { ContratoDocumentoRow } from "@/lib/contratos/queries"

export function ContratoHistorial({
  documentos,
  contratoId,
}: {
  documentos: ContratoDocumentoRow[]
  contratoId: string
}) {
  if (documentos.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <TreePineIcon className="mx-auto mb-2 h-6 w-6 opacity-50" />
          Este contrato aún no tiene documentos en su historial.
        </CardContent>
      </Card>
    )
  }

  // Orden cronológico ascendente para mostrar como árbol
  const ordenados = [...documentos].sort(
    (a, b) => (a.numero_version ?? 0) - (b.numero_version ?? 0)
  )

  return (
    <div className="flex flex-col gap-3">
      {ordenados.map((doc, index) => {
        const tipoLabel =
          doc.tipo_documento === "modificatorio"
            ? "Modificatorio"
            : doc.tipo_documento === "otro_si"
            ? "Otro sí"
            : doc.tipo_documento === "anexo"
            ? "Anexo"
            : "Primigenio"
        const esPrimigenio = doc.tipo_documento === "primigenio"
        const esVigente = doc.es_vigente
        const indent = index > 0 ? (index - 1) * 8 : 0

        return (
          <div
            key={doc.id}
            className={cn(
              "relative flex items-start gap-3 rounded-xl border p-4",
              esVigente ? "border-primary/40 bg-primary/5" : "bg-background"
            )}
            style={{ marginLeft: Math.min(indent, 24) }}
          >
            {/* Línea vertical de conexión (tipo árbol) */}
            {index > 0 && (
              <div
                className="absolute -left-3 top-0 bottom-0 w-px bg-border"
                style={{ left: "-12px" }}
              />
            )}

            <div className="mt-0.5 shrink-0">
              {esPrimigenio ? (
                <FileTextIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <TreePineIcon className="h-5 w-5 text-amber-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading text-sm font-semibold">
                  {tipoLabel} — {doc.numero_documento}
                </span>
                {esPrimigenio && (
                  <Badge variant="outline" className="text-xs">
                    Original
                  </Badge>
                )}
                {esVigente && (
                  <Badge variant="default" className="text-xs">
                    <CheckCircleIcon className="mr-1 h-3 w-3" />
                    Vigente
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Versión {doc.numero_version ?? 0}
                {" · "}
                {new Date(doc.fecha_otorgamiento).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              {doc.resumen_cambios && (
                <blockquote className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  “{doc.resumen_cambios}”
                </blockquote>
              )}

              {doc.archivo_url ? (
                <Link
                  href={doc.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <FileTextIcon className="h-3.5 w-3.5" />
                  Ver archivo (OneDrive)
                </Link>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}