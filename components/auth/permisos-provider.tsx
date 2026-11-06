"use client"

import { createContext, useContext, type ReactNode } from "react"

type Permisos = {
  /**
   * Indica si el usuario actual puede crear, editar o eliminar.
   * Los roles de solo lectura (CEO, CFO y Gerente General) reciben `false`.
   */
  puedeEscribir: boolean
}

const PermisosContext = createContext<Permisos>({ puedeEscribir: true })

export function PermisosProvider({
  puedeEscribir,
  children,
}: Permisos & { children: ReactNode }) {
  return (
    <PermisosContext.Provider value={{ puedeEscribir }}>
      {children}
    </PermisosContext.Provider>
  )
}

export function usePermisos() {
  return useContext(PermisosContext)
}

/**
 * Renderiza sus hijos sólo cuando el usuario puede escribir.
 * Úsalo para ocultar botones de crear/editar/eliminar/importar/duplicar.
 * La autorización real se valida siempre en el servidor.
 */
export function SoloEscritura({ children }: { children: ReactNode }) {
  const { puedeEscribir } = usePermisos()
  return puedeEscribir ? <>{children}</> : null
}
