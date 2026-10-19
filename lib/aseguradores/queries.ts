import { createAdminClient } from "@/lib/supabase/admin"

export type AseguradorAdmin = {
  id: string
  nombre_eps: string
  created_at: string
}

export async function listAseguradoresAdmin(): Promise<AseguradorAdmin[]> {
  const { data, error } = await createAdminClient()
    .from("aseguradores_eps")
    .select("id, nombre_eps, created_at")
    .order("nombre_eps", { ascending: true })

  if (error) throw error
  return (data ?? []) as AseguradorAdmin[]
}

export async function getAsegurador(
  id: string
): Promise<AseguradorAdmin | null> {
  const { data, error } = await createAdminClient()
    .from("aseguradores_eps")
    .select("id, nombre_eps, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as AseguradorAdmin | null
}
