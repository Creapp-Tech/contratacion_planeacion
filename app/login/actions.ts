"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  claveRateLimit,
  limpiarIntentos,
  obtenerIp,
  registrarIntentoFallido,
  verificarRateLimit,
} from "@/lib/auth/rate-limit"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

// Mensaje único para credenciales inválidas: nunca revela si el usuario existe.
const GENERIC_ERROR = "Credenciales inválidas"

export type LoginState = {
  error?: string
}

/**
 * Valida y normaliza el destino de redirección. Sólo permite rutas internas
 * (empezando por "/") y rechaza cualquier cosa con esquema/host (open redirect).
 */
function rutaInternaSegura(redirectTo: string | undefined): string {
  if (!redirectTo) return "/"
  const valor = redirectTo.trim()
  // Debe empezar con una sola barra (ni "//host" que es protocol-relative).
  if (!valor.startsWith("/") || valor.startsWith("//")) return "/"
  // No permitir backslashes (browsers los tratan como "/\host").
  if (valor.includes("\\")) return "/"
  try {
    const url = new URL(valor, "http://interno.local")
    // Si el parseo introdujo un host distinto al base, es un redirect externo.
    if (url.host !== "interno.local") return "/"
    return `${url.pathname}${url.search}`
  } catch {
    return "/"
  }
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

  const { usuario, password } = parsed.data

  const ip = await obtenerIp()
  const clave = claveRateLimit(ip, usuario)

  // Rate limiting: bloqueo tras 5 intentos fallidos durante 15 minutos.
  const limite = verificarRateLimit(clave)
  if (limite.bloqueado) {
    return {
      error: `Demasiados intentos. Vuelve a intentarlo en ${limite.minutosRestantes} minuto(s).`,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(usuario),
    password,
  })

  if (error) {
    registrarIntentoFallido(clave)
    return { error: GENERIC_ERROR }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: perfil, error: perfilError } = await supabase
      .from("usuarios")
      .select("estado")
      .eq("id", user.id)
      .maybeSingle()

    // Un error de lectura (red/RLS) NO debe cerrar la sesión: el login fue
    // exitoso. Sólo validamos el estado cuando el perfil se pudo leer.
    if (!perfilError && perfil && perfil.estado !== "activo") {
      // No se cierra sesión aquí: mostramos el mensaje en pantalla para evitar
      // el bucle login <-> dashboard. La sesión queda activa pero sin acceso.
      return {
        error: "Tu usuario está inactivo. Contacta al administrador para reactivarlo.",
      }
    }
  }

  // Login correcto: reinicia el contador de intentos de esta clave.
  limpiarIntentos(clave)

  redirect(rutaInternaSegura(parsed.data.redirectTo))
}
