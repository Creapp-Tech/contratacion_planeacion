import { createAdminClient } from "@/lib/supabase/admin"

export type Regional = {
  id: string
  nombre: string
  created_at: string
}

export async function listRegionales(): Promise<Regional[]> {
  const { data, error } = await createAdminClient()
    .from("regionales")
    .select("id, nombre, created_at")
    .order("nombre", { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getRegional(id: string): Promise<Regional | null> {
  const { data, error } = await createAdminClient()
    .from("regionales")
    .select("id, nombre, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}
