import { io } from "next/cache"
import { redirect } from "next/navigation"

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
