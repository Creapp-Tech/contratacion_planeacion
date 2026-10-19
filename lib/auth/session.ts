import { io } from "next/cache"
import { redirect } from "next/navigation"

import {
  alcanceTotal,
  puedeAccederPlaneacion,
  puedeEditarPlaneacion,
} from "@/lib/constants/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type CurrentUsuario = {
  id: string
  email: string
  nombre_completo: string
  rol: string
  estado: string
  regional_id: string | null
}

export async function getCurrentUsuario(): Promise<CurrentUsuario | null> {
  await io()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from("usuarios")
    .select("id, email, nombre_completo, rol, estado, regional_id")
    .eq("id", user.id)
    .maybeSingle()

  return data ?? null
}

export async function requireSuperadmin(): Promise<CurrentUsuario> {
  const usuario = await getCurrentUsuario()

  if (!usuario || usuario.rol !== "superadmin" || usuario.estado !== "activo") {
    redirect("/")
  }

  return usuario
}

export type AlcanceUsuario = {
  usuario: CurrentUsuario
  verTodo: boolean
  regional: string | null
}

export async function requireAccesoPlaneacion(): Promise<CurrentUsuario> {
  const usuario = await getCurrentUsuario()

  if (
    !usuario ||
    usuario.estado !== "activo" ||
    !puedeAccederPlaneacion(usuario.rol)
  ) {
    redirect("/")
  }

  return usuario
}

export async function alcanceDelUsuario(
  usuario: CurrentUsuario
): Promise<AlcanceUsuario> {
  if (alcanceTotal(usuario.rol)) {
    return { usuario, verTodo: true, regional: null }
  }

  if (!usuario.regional_id) {
    return { usuario, verTodo: false, regional: null }
  }

  const { data } = await createAdminClient()
    .from("regionales")
    .select("nombre")
    .eq("id", usuario.regional_id)
    .maybeSingle()

  return {
    usuario,
    verTodo: false,
    regional: (data as { nombre: string } | null)?.nombre ?? null,
  }
}

export async function requireAlcancePlaneacion(): Promise<AlcanceUsuario> {
  const usuario = await requireAccesoPlaneacion()
  return alcanceDelUsuario(usuario)
}

export async function requireEditorPlaneacion(): Promise<CurrentUsuario> {
  const usuario = await getCurrentUsuario()

  if (
    !usuario ||
    usuario.estado !== "activo" ||
    !puedeEditarPlaneacion(usuario.rol)
  ) {
    redirect("/")
  }

  return usuario
}

export async function usuarioEditor(): Promise<CurrentUsuario | null> {
  const usuario = await getCurrentUsuario()

  if (
    !usuario ||
    usuario.estado !== "activo" ||
    !puedeEditarPlaneacion(usuario.rol)
  ) {
    return null
  }

  return usuario
}

export function mismaRegional(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export async function regionalNombre(
  regionalId: string | null
): Promise<string | null> {
  if (!regionalId) return null

  const { data } = await createAdminClient()
    .from("regionales")
    .select("nombre")
    .eq("id", regionalId)
    .maybeSingle()

  return (data as { nombre: string } | null)?.nombre ?? null
}

export async function puedeGestionarRegional(
  usuario: CurrentUsuario,
  regionalObjetivo: string | null | undefined
): Promise<boolean> {
  if (alcanceTotal(usuario.rol)) return true
  const propia = await regionalNombre(usuario.regional_id)
  return mismaRegional(propia, regionalObjetivo)
}
