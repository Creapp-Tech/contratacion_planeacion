"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { CurrentUsuario } from "@/lib/auth/session"

type Permisos = {
  /**
   * Indica si el usuario actual puede crear, editar o eliminar.
   * Los roles de solo lectura (CEO, CFO y Gerente General) reciben `false`.
   */
  puedeEscribir: boolean
  /**
   * Perfil del usuario autenticado, resuelto por AuthShell.
   * Está disponible sólo cuando la sesión es válida y el perfil se pudo leer.
   */
  usuario: CurrentUsuario | null
}

const PermisosContext = createContext<Permisos>({
  puedeEscribir: true,
  usuario: null,
})

export function PermisosProvider({
  puedeEscribir,
  usuario,
  children,
}: Permisos & { children: ReactNode }) {
  return (
    <PermisosContext.Provider value={{ puedeEscribir, usuario }}>
      {children}
    </PermisosContext.Provider>
  )
}

export function usePermisos() {
  return useContext(PermisosContext)
}

export function useUsuario() {
  const { usuario } = useContext(PermisosContext)
  return usuario
}

/**
 * Renderiza sus hijos sólo cuando el usuario puede escribir.
 * Úsalo para ocultar botones de crear/editar/eliminar/importar/duplicar.
 * La autorización real se valida siempre en el servidor.
 */
export function SoloEscritura({ children }: { children: ReactNode }) {
  const { puedeEscribir } = useContext(PermisosContext)
  return puedeEscribir ? <>{children}</> : null
}
