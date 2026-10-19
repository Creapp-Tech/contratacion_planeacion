"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

const GENERIC_ERROR = "Usuario o contraseña incorrectos"

export type LoginState = {
  error?: string
}

function toEmail(usuario: string) {
  const value = usuario.trim().toLowerCase()
  if (value.includes("@")) {
    return value
  }
  const domain = process.env.AUTH_EMAIL_DOMAIN ?? "app.local"
  return `${value}@${domain}`
}

export async function login(input: LoginInput): Promise<LoginState> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    return { error: GENERIC_ERROR }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(parsed.data.usuario),
    password: parsed.data.password,
  })

  if (error) {
    return { error: GENERIC_ERROR }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("estado")
      .eq("id", user.id)
      .maybeSingle()

    if (perfil && perfil.estado !== "activo") {
      await supabase.auth.signOut()
      return {
        error: "Tu usuario está inactivo. Contacta al administrador.",
      }
    }
  }

  redirect("/")
}
