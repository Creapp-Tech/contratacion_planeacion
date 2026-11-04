"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

/**
 * Ejecuta `onReset` cuando la ruta que contiene el componente deja de estar
 * visible o se desmonta.
 *
 * Next.js 16 con `cacheComponents` conserva hasta 3 rutas ocultas mediante
 * `<Activity>`: el DOM y el estado de React (incluido react-hook-form) NO se
 * destruyen al navegar. Sin este reinicio, al volver a una ruta de formulario
 * reaparecen los valores, errores y banderas de la visita anterior.
 *
 * El callback se guarda en un ref para que el reinicio use siempre la última
 * versión (por ejemplo, los `defaultValues` del registro en edición) sin
 * necesidad de re-registrar el efecto.
 */
export function useResetOnHide(onReset: () => void) {
  const onResetRef = useRef(onReset)

  useEffect(() => {
    onResetRef.current = onReset
  })

  useLayoutEffect(() => {
    return () => {
      onResetRef.current()
    }
  }, [])
}
