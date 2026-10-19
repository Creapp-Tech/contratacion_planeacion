import { requireSuperadmin } from "@/lib/auth/session"
import { construirCsv } from "@/lib/servicios/importar"
import { listServicios } from "@/lib/servicios/queries"

export async function GET() {
  await requireSuperadmin()

  const servicios = await listServicios()

  const filas = servicios.map((servicio) => ({
    nombre: servicio.nombre,
    grupo: servicio.grupo,
    area: servicio.area_nombre,
    tipo_personal: servicio.tipo_personal,
    activo: servicio.activo ? "si" : "no",
  }))

  const csv = construirCsv(filas)

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="servicios.csv"',
    },
  })
}
