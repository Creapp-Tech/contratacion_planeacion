"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useResetOnHide } from "@/hooks/use-reset-on-hide"
import type { OpcionesAseguradoresContratos } from "@/lib/aseguradores-contratos/types"

import { CargueMasivoServiciosCups } from "./cargue-masivo-servicios-cups"
import { ServicioCupsForm } from "./servicio-cups-form"

type Modo = "individual" | "masivo"

export function NuevoServicioContenido({
  opciones,
}: {
  opciones: OpcionesAseguradoresContratos
}) {
  const [modo, setModo] = useState<Modo>("individual")

  useResetOnHide(() => setModo("individual"))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Modo de registro">
        <Button
          type="button"
          size="sm"
          variant={modo === "individual" ? "default" : "outline"}
          aria-pressed={modo === "individual"}
          onClick={() => setModo("individual")}
        >
          Registro individual
        </Button>
        <Button
          type="button"
          size="sm"
          variant={modo === "masivo" ? "default" : "outline"}
          aria-pressed={modo === "masivo"}
          onClick={() => setModo("masivo")}
        >
          Carga masiva
        </Button>
      </div>

      {modo === "individual" ? (
        <ServicioCupsForm opciones={opciones} />
      ) : (
        <CargueMasivoServiciosCups opciones={opciones} />
      )}
    </div>
  )
}
