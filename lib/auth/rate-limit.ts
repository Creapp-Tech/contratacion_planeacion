import { headers } from "next/headers"

/**
 * Rate limiting en memoria para el login.
 * Límite: 5 intentos fallidos por ventana de 15 minutos, por clave
 * (IP + identificador de usuario). Tras superar el límite se bloquea hasta
 * que expira la ventana.
 *
 * Nota: es estado en memoria del proceso. En despliegues con múltiples
 * instancias cada una mantiene su propio contador; para producción a gran
 * escala conviene respaldarlo en Redis o en la base de datos. Para este
 * proyecto de una sola instancia es suficiente.
 */

const MAX_INTENTOS = 5
const VENTANA_MS = 15 * 60 * 1000

type Registro = {
  intentos: number
  expira: number
}

const registros = new Map<string, Registro>()

export type RateLimitResult =
  | { bloqueado: false }
  | { bloqueado: true; minutosRestantes: number }

function limpiarExpirados(ahora: number) {
  for (const [clave, registro] of registros) {
    if (registro.expira <= ahora) {
      registros.delete(clave)
    }
  }
}

export async function obtenerIp(): Promise<string> {
  const headerStore = await headers()
  const forwarded = headerStore.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]!.trim()
  }
  return headerStore.get("x-real-ip") ?? "desconocida"
}

export function claveRateLimit(ip: string, identificador: string): string {
  return `${ip}:${identificador.trim().toLowerCase()}`
}

export function verificarRateLimit(clave: string): RateLimitResult {
  const ahora = Date.now()
  limpiarExpirados(ahora)

  const registro = registros.get(clave)
  if (!registro || registro.expira <= ahora) {
    return { bloqueado: false }
  }

  if (registro.intentos >= MAX_INTENTOS) {
    const minutosRestantes = Math.max(
      1,
      Math.ceil((registro.expira - ahora) / 60000)
    )
    return { bloqueado: true, minutosRestantes }
  }

  return { bloqueado: false }
}

export function registrarIntentoFallido(clave: string): void {
  const ahora = Date.now()
  const registro = registros.get(clave)

  if (!registro || registro.expira <= ahora) {
    registros.set(clave, { intentos: 1, expira: ahora + VENTANA_MS })
    return
  }

  registro.intentos += 1
}

export function limpiarIntentos(clave: string): void {
  registros.delete(clave)
}

export const RATE_LIMIT_MAX = MAX_INTENTOS
export const RATE_LIMIT_MINUTOS = VENTANA_MS / 60000
