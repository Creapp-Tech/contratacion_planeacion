import { requireAlcancePlaneacion } from "@/lib/auth/session"
import { puedeEditarPlaneacion } from "@/lib/constants/roles"
import {
  OPCIONES_FILTROS_VACIAS,
  listOpcionesFiltros,
  listSedes,
  resumenSedes,
  type SedeFiltros,
} from "@/lib/sedes/queries"

import { SedeFiltros as SedeFiltrosBar } from "./sede-filtros"
import { SedesTabla } from "./sedes-tabla"
import { SedeHerramientas } from "./sede-herramientas"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function pickRegional(
  params: Record<string, string | string[] | undefined>,
  alcance: Awaited<ReturnType<typeof requireAlcancePlaneacion>>
): string | undefined {
  // Superadmin puede filtrar por cualquier regional desde la URL
  if (alcance.verTodo) {
    return pick(params.regional)
  }
  // Usuarios normales solo pueden filtrar por su regional asignado
  // Si viene de la URL, ignorarlo y usar el de la sesión
  return alcance.regional ?? undefined
}

export async function SedesContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const alcance = await requireAlcancePlaneacion()
  const params = await searchParams

  const filtros: SedeFiltros = {
    q: pick(params.q),
    regional: pickRegional(params, alcance),
    departamento: pick(params.departamento),
    municipio: pick(params.municipio),
    asegurador: pick(params.asegurador),
    marca: pick(params.marca),
  }

  // Opciones en cascada: se calculan sin la restricción de acceso para que el
  // usuario siempre vea las opciones existentes; el listado sí la respeta.
  const filtrosOpciones: SedeFiltros = { ...filtros, regional: undefined }

  let sedes: Awaited<ReturnType<typeof listSedes>> = []
  let opciones = OPCIONES_FILTROS_VACIAS
  let errorMessage: string | null = null

  try {
    const [sedesResultado, opcionesResultado] = await Promise.all([
      listSedes(filtros),
      listOpcionesFiltros(filtrosOpciones),
    ])
    sedes = sedesResultado
    opciones = opcionesResultado
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al cargar las sedes."
  }

  return (
    <div className="flex flex-col gap-4">
      <SedeFiltrosBar
        opciones={opciones}
        filtros={{
          q: filtros.q,
          departamento: filtros.departamento,
          municipio: filtros.municipio,
          asegurador: filtros.asegurador,
          marca: filtros.marca,
        }}
        verRegional={alcance.verTodo}
        opcionesError={
          !errorMessage &&
          Object.values(opciones).every(
            (arr) => Array.isArray(arr) && arr.length === 0
          )
        }
      />
      {alcance.usuario.rol === "superadmin" ? <SedeHerramientas /> : null}
      {errorMessage ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          No se pudieron cargar las sedes. {errorMessage}
        </div>
      ) : null}
      <SedesTabla
        sedes={sedes}
        resumen={resumenSedes(sedes)}
        puedeEditar={puedeEditarPlaneacion(alcance.usuario.rol)}
      />
    </div>
  )
}

