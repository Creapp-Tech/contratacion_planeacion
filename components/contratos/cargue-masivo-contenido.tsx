"use client"

import { useState, useCallback, useRef } from "react"
import { DownloadIcon, UploadIcon, FileSpreadsheetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { CargueMasivoForm } from "./cargue-masivo-form"

export function CargueMasivoContenido() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const manejarDescarga = useCallback(async () => {
    const res = await fetch("/api/plantilla/plantilla-contratos")
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_contratos.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={manejarDescarga} variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Descargar plantilla
        </Button>

        {/* Input de archivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && f.size > 5 * 1024 * 1024) {
              alert("El archivo excede 5 MB")
              return
            }
            setArchivo(f ?? null)
          }}
        />

        {/* Botón normal que dispara el clic del input mediante useRef */}
        <Button 
          variant="default" 
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          Cargue masivo
        </Button>
      </div>

      {archivo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheetIcon className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-medium">{archivo.name}</p>
                <p className="text-xs text-muted-foreground">{(archivo.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CargueMasivoForm archivo={archivo} />
    </div>
  )
}