import { io } from "next/cache"
import { redirect } from "next/navigation"

import {
  alcanceTotal,
  puedeAccederContratacion,
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

/**
 * Error de perfil: la sesión es válida (el usuario existe en auth), pero su
 * registro en `public.usuarios` falta o es inválido. NUNCA debe provocar un
 * signOut: la sesión sigue siendo válida y sólo falla la lectura de datos.
 */
export class PerfilError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PerfilError"
  }
}

export type PerfilStatus = "ok" | "sin_sesion" | "sin_perfil" | "inactivo"

export type GetCurrentUsuarioResult = {
  usuario: CurrentUsuario | null
  status: PerfilStatus
}

/**
 * Lee el usuario autenticado y su perfil.
 *
 * Reglas clave:
 * - Si no hay usuario en auth => `sin_sesion` (el middleware/guard redirige a /login).
 * - Si hay usuario en auth pero falla la lectura del perfil (registro faltante,
 *   error de red/RLS) => `sin_perfil` o `inactivo`, PERO la sesión se conserva.
 *   No se llama a signOut ni se fuerza logout por un error de datos.
 */
export async function getCurrentUsuarioResult(): Promise<GetCurrentUsuarioResult> {
  await io()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { usuario: null, status: "sin_sesion" }
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, email, nombre_completo, rol, estado, regional_id")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    // Error de datos (red/RLS): la sesión sigue válida. No cerramos sesión.
    return { usuario: null, status: "sin_perfil" }
  }

  if (!data) {
    return { usuario: null, status: "sin_perfil" }
  }

  if (data.estado !== "activo") {
    return { usuario: data, status: "inactivo" }
  }

  return { usuario: data, status: "ok" }
}

export async function getCurrentUsuario(): Promise<CurrentUsuario | null> {
  const { usuario } = await getCurrentUsuarioResult()
  return usuario
}

export async function requireSuperadmin(): Promise<CurrentUsuario> {
  const { usuario, status } = await getCurrentUsuarioResult()

  if (status === "sin_sesion") {
    redirect("/login")
  }

  if (status === "sin_perfil") {
    throw new PerfilError(
      "No encontramos tu perfil de usuario. Contacta al administrador para que lo restablezca."
    )
  }

  if (status === "inactivo" || !usuario) {
    throw new PerfilError(
      "Tu usuario está inactivo. Contacta al administrador para reactivarlo."
    )
  }

  if (usuario.rol !== "superadmin") {
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
  const { usuario, status } = await getCurrentUsuarioResult()

  if (status === "sin_sesion") {
    redirect("/login")
  }

  if (status === "sin_perfil") {
    throw new PerfilError(
      "No encontramos tu perfil de usuario. Contacta al administrador para que lo restablezca."
    )
  }

  if (status === "inactivo" || !usuario) {
    throw new PerfilError(
      "Tu usuario está inactivo. Contacta al administrador para reactivarlo."
    )
  }

  if (!puedeAccederPlaneacion(usuario.rol)) {
    redirect("/")
  }

  return usuario
}

export async function requireAccesoContratacion(): Promise<CurrentUsuario> {
  const { usuario, status } = await getCurrentUsuarioResult()

  if (status === "sin_sesion") {
    redirect("/login")
  }

  if (status === "sin_perfil") {
    throw new PerfilError(
      "No encontramos tu perfil de usuario. Contacta al administrador para que lo restablezca."
    )
  }

  if (status === "inactivo" || !usuario) {
    throw new PerfilError(
      "Tu usuario está inactivo. Contacta al administrador para reactivarlo."
    )
  }

  if (!puedeAccederContratacion(usuario.rol)) {
    redirect("/")
  }

  return usuario
}

export type AlcanceContratos = {
  usuario: CurrentUsuario
  verTodo: boolean
  regionalId: string | null
}

export function alcanceContratos(usuario: CurrentUsuario): AlcanceContratos {
  if (alcanceTotal(usuario.rol)) {
    return { usuario, verTodo: true, regionalId: null }
  }

  return { usuario, verTodo: false, regionalId: usuario.regional_id }
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
  const { usuario, status } = await getCurrentUsuarioResult()

  if (status === "sin_sesion") {
    redirect("/login")
  }

  if (status === "sin_perfil") {
    throw new PerfilError(
      "No encontramos tu perfil de usuario. Contacta al administrador para que lo restablezca."
    )
  }

  if (status === "inactivo" || !usuario) {
    throw new PerfilError(
      "Tu usuario está inactivo. Contacta al administrador para reactivarlo."
    )
  }

  if (!puedeEditarPlaneacion(usuario.rol)) {
    redirect("/")
  }

  return usuario
}

export async function usuarioEditor(): Promise<CurrentUsuario | null> {
  const { usuario, status } = await getCurrentUsuarioResult()

  if (status !== "ok" || !usuario) {
    return null
  }

  if (!puedeEditarPlaneacion(usuario.rol)) {
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
