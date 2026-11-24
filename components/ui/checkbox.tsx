"use client"

import * as React from "react"
import { cn } from "cn"

/**
 * Checkbox nativo accesible. Mantiene el comportamiento de teclado del
 * navegador y permite fijar `indeterminate` desde la tabla.
 */
export function Checkbox({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
