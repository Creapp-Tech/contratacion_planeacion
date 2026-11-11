"use server"

import { revalidatePath } from "next/cache"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { esPaisNacional } from "@/lib/contratos/constantes"
import { catalogoSchema, type CatalogoInput } from "@/lib/validations/catalogo"

import { CATALOGOS, isCatalogoDominio } from "./dominios"

export type CatalogoActionResult = { success: true } | { error: string }

const UNIQUE_VIOLATION = "23505"

/**
 * "Colombia" es el país que define el módulo de contratos nacionales; su
 * nombre no puede cambiar ni puede eliminarse desde el catálogo.
 */
async function esPaisNacionalProtegido(id: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("catalogos_opciones")
    .select("nombre")
    .eq("id", id)
    .eq("dominio", "pais")
    .maybeSingle()

  return esPaisNacional((data as { nombre: string } | null)?.nombre)
}

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

  if (
    dominio === "pais" &&
    !esPaisNacional(parsed.data.nombre) &&
    (await esPaisNacionalProtegido(id))
  ) {
    return {
      error:
        "El país Colombia no se puede renombrar: define los contratos nacionales",
    }
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

  if (dominio === "pais" && (await esPaisNacionalProtegido(id))) {
    return {
      error:
        "El país Colombia no se puede eliminar: define los contratos nacionales",
    }
  }

  const { error } = await createAdminClient()
    .from("catalogos_opciones")
    .delete()
    .eq("id", id)
    .eq("dominio", dominio)

  if (error) {
    if (error.code === "23503" || error.code === "23502") {
      return { error: "No se puede eliminar: el registro está en uso" }
    }
    return { error: error.message }
  }

  revalidatePath(CATALOGOS[dominio].ruta)
  return { success: true }
}
