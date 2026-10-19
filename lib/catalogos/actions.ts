"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { catalogoSchema, type CatalogoInput } from "@/lib/validations/catalogo"

import { CATALOGOS, isCatalogoDominio } from "./dominios"

export type CatalogoActionResult = { success: true } | { error: string }

const UNIQUE_VIOLATION = "23505"

function mensajeError(error: { code?: string; message: string }) {
  if (error.code === UNIQUE_VIOLATION) {
    return "Ya existe un registro con ese nombre"
  }
  return error.message
}

export async function crearCatalogo(
  dominio: string,
  input: CatalogoInput
): Promise<CatalogoActionResult> {
  await requireSuperadmin()

  if (!isCatalogoDominio(dominio)) {
    return { error: "Catálogo inválido" }
  }

  const parsed = catalogoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("catalogos_opciones")
    .insert([
      {
        dominio,
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion || null,
      },
    ])

  if (error) return { error: mensajeError(error) }

  revalidatePath(CATALOGOS[dominio].ruta)
  return { success: true }
}

export async function actualizarCatalogo(
  dominio: string,
  id: string,
  input: CatalogoInput
): Promise<CatalogoActionResult> {
  await requireSuperadmin()

  if (!isCatalogoDominio(dominio)) {
    return { error: "Catálogo inválido" }
  }

  const parsed = catalogoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("catalogos_opciones")
    .update({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("dominio", dominio)

  if (error) return { error: mensajeError(error) }

  revalidatePath(CATALOGOS[dominio].ruta)
  return { success: true }
}

export async function eliminarCatalogo(
  dominio: string,
  id: string
): Promise<CatalogoActionResult> {
  await requireSuperadmin()

  if (!isCatalogoDominio(dominio)) {
    return { error: "Catálogo inválido" }
  }

  const { error } = await createAdminClient()
    .from("catalogos_opciones")
    .delete()
    .eq("id", id)
    .eq("dominio", dominio)

  if (error) return { error: error.message }

  revalidatePath(CATALOGOS[dominio].ruta)
  return { success: true }
}
