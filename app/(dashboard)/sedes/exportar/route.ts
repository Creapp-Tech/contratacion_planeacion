import { requireSuperadmin } from "@/lib/auth/session"
import { construirCsv } from "@/lib/sedes/importar"
import { listSedes } from "@/lib/sedes/queries"

export async function GET() {
  await requireSuperadmin()

  const sedes = await listSedes()

  const filas = sedes.map((sede) => ({
    nombre: sede.nombre,
    codigo_reps: sede.codigo_reps,
    departamento: sede.departamento,
    municipio: sede.municipio,
    barrio: sede.barrio,
    direccion: sede.direccion,
    pais: sede.pais,
    latitud: sede.latitud,
    longitud: sede.longitud,
    gerente: sede.gerente,
    fecha_apertura: sede.fecha_apertura,
    regional: sede.regional,
    zonal: sede.zonal,
    marca: sede.marca,
    nivel: sede.nivel,
    tipo_ips: sede.tipo_ips,
    estado: sede.estado,
    fecha_cierre: sede.fecha_cierre,
    metros_cuadrado: sede.metros_cuadrado,
    capacidad_inicial: sede.capacidad_inicial,
    capacidad_usuarios: sede.capacidad_usuarios,
    numero_pisos: sede.numero_pisos,
    consultorios: sede.consultorios,
    odontologia: sede.odontologia,
    consultorios_fisicos: sede.consultoriosFisicos,
    odontologia_fisica: sede.odontologiaFisica,
  }))

  const csv = construirCsv(filas)

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sedes.csv"',
    },
  })
}
