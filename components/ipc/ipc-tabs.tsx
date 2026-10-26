"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "cn"

const TABS = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "analisis", etiqueta: "Gráficas y análisis" },
] as const

export type TabIpc = (typeof TABS)[number]["id"]

export function IpcTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activa: TabIpc =
    searchParams.get("tab") === "analisis" ? "analisis" : "resumen"

  function crearHref(tab: TabIpc) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "resumen") {
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
