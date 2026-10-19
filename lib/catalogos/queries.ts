import { createAdminClient } from "@/lib/supabase/admin"

import type { CatalogoDominio } from "./dominios"

export type CatalogoItem = {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export async function listCatalogos(
  dominio: CatalogoDominio
): Promise<CatalogoItem[]> {
  const { data, error } = await createAdminClient()
    .from("catalogos_opciones")
    .select("id, nombre, descripcion, created_at")
    .eq("dominio", dominio)
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as CatalogoItem[]
}

export async function getCatalogo(
  dominio: CatalogoDominio,
  id: string
): Promise<CatalogoItem | null> {
  const { data, error } = await createAdminClient()
    .from("catalogos_opciones")
    .select("id, nombre, descripcion, created_at")
    .eq("dominio", dominio)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as CatalogoItem | null
}
