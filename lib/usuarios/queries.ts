import { createAdminClient } from "@/lib/supabase/admin"

export { listRegionales } from "@/lib/regionales/queries"
export type { Regional } from "@/lib/regionales/queries"

export type UsuarioRow = {
  id: string
  email: string
  nombre_completo: string
  telefono: string | null
  rol: string
  estado: string
  regional_id: string | null
  created_at: string
  regionales: { nombre: string } | null
}

export type UsuarioFiltros = {
  q?: string
  rol?: string
  regional?: string
  estado?: string
}

export async function listUsuarios(
  filtros: UsuarioFiltros = {}
): Promise<UsuarioRow[]> {
  let query = createAdminClient()
    .from("usuarios")
    .select("*, regionales (nombre)")

  if (filtros.q) {
    query = query.ilike("nombre_completo", `%${filtros.q}%`)
  }
  if (filtros.rol) {
    query = query.eq("rol", filtros.rol)
  }
  if (filtros.regional) {
    query = query.eq("regional_id", filtros.regional)
  }
  if (filtros.estado) {
    query = query.eq("estado", filtros.estado)
  }

  const { data, error } = await query.order("nombre_completo", {
    ascending: true,
  })

  if (error) throw error
  return (data ?? []) as UsuarioRow[]
}

export async function getUsuario(id: string): Promise<UsuarioRow | null> {
  const { data, error } = await createAdminClient()
    .from("usuarios")
    .select("*, regionales (nombre)")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data as UsuarioRow | null) ?? null
}
