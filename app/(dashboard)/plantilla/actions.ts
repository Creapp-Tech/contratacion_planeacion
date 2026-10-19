"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

export async function listPlantilla(filtros: { q?: string } = {}) {
  let query = createAdminClient().from("plantilla").select("*")

  if (filtros.q) {
    query = query.ilike("nombre", `%${filtros.q}%`)
  }

  const { data, error } = await query.order("nombre", { ascending: true })

  if (error) throw error
  return data
}

export async function createPlantilla(data: {
  nombre: string
  descripcion?: string
}) {
  const { data: inserted, error } = await createAdminClient()
    .from("plantilla")
    .insert([{ nombre: data.nombre, descripcion: data.descripcion }])
    .select()
    .single()

  if (error) throw error
  revalidatePath("/plantilla")
  return inserted
}

export async function updatePlantilla(id: string, data: {
  nombre: string
  descripcion?: string
}) {
  const { data: updated, error } = await createAdminClient()
    .from("plantilla")
    .update(data)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  revalidatePath("/plantilla")
  return updated
}

export async function deletePlantilla(id: string) {
  const { error } = await createAdminClient()
    .from("plantilla")
    .delete()
    .eq("id", id)

  if (error) throw error
  revalidatePath("/plantilla")
}