import { createAdminClient } from "@/lib/supabase/admin"

export type Regimen = {
  id: string
  nombre: string
  created_at: string
}

export async function listRegimenes(): Promise<Regimen[]> {
  const { data, error } = await createAdminClient()
    .from("regimenes")
    .select("id, nombre, created_at")
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as Regimen[]
}
