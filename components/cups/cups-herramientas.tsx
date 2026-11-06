"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { DownloadIcon, Loader2Icon, UploadIcon } from "lucide-react"

import { importarCups } from "@/app/(dashboard)/configuracion/cups/actions"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx"

export function CupsHerramientas() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{
    insertadas: number
    actualizadas: number
    omitidas: { fila: number; motivo: string }[]
  } | null>(null)

  async function manejarDescarga() {
    const res = await fetch("/configuracion/cups/plantilla")
    if (!res.ok) {
      setError("No se pudo descargar la plantilla.")
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-cups.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setError(null)
    setResultado(null)
    setPending(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const hoja = workbook.SheetNames[0]
      if (!hoja) {
        setError("No se encontraron hojas en el archivo.")
        return
      }
      const worksheet = workbook.Sheets[hoja]
      const matriz = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as unknown[][]
      if (matriz.length <= 1) {
        setError("El archivo no contiene filas de datos.")
        return
      }

      const encabezados = (matriz[0] as unknown[]).map((h) => String(h ?? "").trim().toLowerCase())
      const filas = matriz.slice(1).map((fila) => {
        const reg: Record<string, string> = {}
        encabezados.forEach((h, i) => {
          reg[h] = String(fila[i] ?? "").trim()
        })
        return reg
      })

      const result = await importarCups(filas)

      if ("error" in result) {
        setError(result.error)
        return
      }

      setResultado(result)
      router.refresh()
    } catch {
      setError("No se pudo leer el archivo.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 lg:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={manejarDescarga} variant="outline" size="sm">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Descargar plantilla
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onFile}
        />
        <Button
          variant="default"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
          Cargar XLSX
        </Button>
      </div>

      <p className="max-w-md text-xs text-muted-foreground lg:text-right">
        Columnas: codigo* (6 dígitos), nombre*, descripcion, capitulo, seccion,
        extra_vii, extra_viii, extra_ix, version_resolucion*, fecha_inicio*
        (YYYY-MM-DD), fecha_fin (opcional), activo (true/false).
      </p>

      {error ? (
        <div className="mt-2 max-w-md rounded border border-red-200 bg-red-100 p-2 text-xs text-red-800">
          {error}
        </div>
      ) : null}

      {resultado ? (
        <div className="mt-2 max-w-md rounded border border-green-200 bg-green-100 p-2 text-xs text-green-800">
          {resultado.insertadas} nuevas · {resultado.actualizadas} actualizadas ·
          {resultado.omitidas.length} omitidas.
          {resultado.omitidas.length > 0 ? (
            <div className="mt-1">
              Filas con problemas:{" "}
              {resultado.omitidas
                .map((o) => `${o.fila} (${o.motivo})`)
                .join(", ")}.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
