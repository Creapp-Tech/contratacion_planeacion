import { requireSuperadmin } from "@/lib/auth/session"
import { construirCsv } from "@/lib/frecuencias/importar"
import { getFrecuencia } from "@/lib/frecuencias/queries"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperadmin()

  const { id } = await params
  const frecuencia = await getFrecuencia(id)

  if (!frecuencia) {
    return new Response("Frecuencia no encontrada", { status: 404 })
  }

  const filas = frecuencia.servicios.map((servicio) => ({
    tipo_frecuencia: frecuencia.tipo_frecuencia,
    nombre_nota_tecnica: frecuencia.nombre_nota_tecnica,
    sede: frecuencia.sede_nombre,
    regimen: frecuencia.regimen_nombre,
    asegurador: frecuencia.asegurador_nombre,
    version: frecuencia.version,
    servicio: servicio.servicio_nombre,
    frecuencia: servicio.frecuencia,
  }))

  const csv = construirCsv(filas)

  const nombreArchivo = `frecuencia-servicios-${frecuencia.nombre_nota_tecnica
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "export"}.csv`

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  })
}
