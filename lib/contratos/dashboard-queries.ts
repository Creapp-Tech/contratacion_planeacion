import { createAdminClient } from "@/lib/supabase/admin"

export type ContratoDashboardRegional = {
  id: string
  nombre: string
}

export type ContratoDashboardRegimen = {
  id: string
  nombre: string
}

export type ContratoDashboard = {
  id: string
  nombre: string
  numero_contrato: string
  ciudad: string
  fecha_inicio: string | null
  fecha_fin: string | null
  valor_total: number | null
  updated_at: string
  aseguradora: string | null
  pais: string | null
  estado_legalizacion: string | null
  estado_ejecucion: string | null
  tipo_contrato: string | null
  regionales: ContratoDashboardRegional[]
  regimenes: ContratoDashboardRegimen[]
}

export type AlcanceDashboard = {
  verTodo: boolean
  regionalId: string | null
}

type FilaContratoDashboard = {
  id: string
  nombre: string
  numero_contrato: string
  ciudad: string
  fecha_inicio: string | null
  fecha_fin: string | null
  valor_total: number | null
  updated_at: string
  aseguradores_eps: { nombre_eps: string } | null
  pais: { nombre: string } | null
  estado_legalizacion: { nombre: string } | null
  estado_ejecucion: { nombre: string } | null
  tipo_contrato: { nombre: string } | null
  regionales: { regionales: ContratoDashboardRegional | null }[]
  valores: { regimenes: ContratoDashboardRegimen | null }[]
}

const CAMPOS_DASHBOARD = `
  id,
  nombre,
  numero_contrato,
  ciudad,
  fecha_inicio,
  fecha_fin,
  valor_total,
  updated_at,
  aseguradores_eps(nombre_eps),
  pais:catalogos_opciones!contratos_pais_id_fkey(nombre),
  estado_legalizacion:catalogos_opciones!contratos_estado_legalizacion_id_fkey(nombre),
  estado_ejecucion:catalogos_opciones!contratos_estado_ejecucion_id_fkey(nombre),
  tipo_contrato:catalogos_opciones!contratos_tipo_contrato_id_fkey(nombre),
  regionales:contrato_regionales(regionales(id, nombre)),
  valores:contratos_valores(regimenes(id, nombre))
`

function deduplicarPorId<T extends { id: string }>(items: T[]): T[] {
  const mapa = new Map<string, T>()
  for (const item of items) {
    if (!mapa.has(item.id)) {
      mapa.set(item.id, item)
    }
  }
  return [...mapa.values()]
}

function normalizarNombre(nombre: string): string {
  return nombre.trim()
}

/**
 * Consulta de solo lectura para el Dashboard de contratos.
 *
 * Trae los contratos activos (nacionales e internacionales) con sus catálogos
 * y relaciones N:M de regionales y regímenes. Un gerente regional solo ve los
 * contratos vinculados a su regional; el resto de roles ve todos.
 */
export async function listContratosDashboard(
  alcance: AlcanceDashboard
): Promise<ContratoDashboard[]> {
  const admin = createAdminClient()

  let query = admin
    .from("contratos")
    .select(CAMPOS_DASHBOARD)
    .eq("estado", "activo")

  if (!alcance.verTodo) {
    if (!alcance.regionalId) return []

    const { data: vinculos, error: errorVinculos } = await admin
      .from("contrato_regionales")
      .select("contrato_id")
      .eq("regional_id", alcance.regionalId)

    if (errorVinculos) throw errorVinculos

    const ids = [
      ...new Set(
        ((vinculos ?? []) as { contrato_id: string }[]).map(
          (vinculo) => vinculo.contrato_id
        )
      ),
    ]

    if (ids.length === 0) return []
    query = query.in("id", ids)
  }

  const { data, error } = await query.order("nombre", { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as FilaContratoDashboard[]).map((fila) => {
    const regionales = deduplicarPorId(
      fila.regionales
        .map((relacion) => relacion.regionales)
        .filter(
          (regional): regional is ContratoDashboardRegional => regional !== null
        )
        .map((regional) => ({
          id: regional.id,
          nombre: normalizarNombre(regional.nombre),
        }))
    )
      // En el alcance regional solo se muestra la regional del usuario, aunque
      // el contrato esté vinculado a otras regionales.
      .filter(
        (regional) => alcance.verTodo || regional.id === alcance.regionalId
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))

    const regimenes = deduplicarPorId(
      fila.valores
        .map((valor) => valor.regimenes)
        .filter(
          (regimen): regimen is ContratoDashboardRegimen => regimen !== null
        )
        .map((regimen) => ({
          id: regimen.id,
          nombre: normalizarNombre(regimen.nombre),
        }))
    ).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))

    return {
      id: fila.id,
      nombre: fila.nombre,
      numero_contrato: fila.numero_contrato,
      ciudad: fila.ciudad,
      fecha_inicio: fila.fecha_inicio,
      fecha_fin: fila.fecha_fin,
      valor_total: fila.valor_total,
      updated_at: fila.updated_at,
      aseguradora: fila.aseguradores_eps?.nombre_eps ?? null,
      pais: fila.pais?.nombre ?? null,
      estado_legalizacion: fila.estado_legalizacion?.nombre ?? null,
      estado_ejecucion: fila.estado_ejecucion?.nombre ?? null,
      tipo_contrato: fila.tipo_contrato?.nombre ?? null,
      regionales,
      regimenes,
    }
  })
}
