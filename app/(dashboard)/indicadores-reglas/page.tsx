import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Indicadores y Reglas",
}

export default function IndicadoresReglasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Indicadores y Reglas
          </h1>
          <p className="text-sm text-muted-foreground">
            Módulo en construcción.
          </p>
        </div>
      </div>
    </div>
  )
}
