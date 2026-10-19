"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "cn"

const TABS = [
  { id: "poblacion", etiqueta: "por Población" },
  { id: "infraestructura", etiqueta: "Infraestructura" },
] as const

export type TabCapacidad = (typeof TABS)[number]["id"]

export function CapacidadTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activa: TabCapacidad =
    searchParams.get("tab") === "poblacion" ? "poblacion" : "infraestructura"

  function crearHref(tab: TabCapacidad) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "infraestructura") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  return (
    <div className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={crearHref(tab.id)}
          aria-current={activa === tab.id ? "page" : undefined}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors",
            activa === tab.id
              ? "border-primary font-semibold text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.etiqueta}
        </Link>
      ))}
    </div>
  )
}
