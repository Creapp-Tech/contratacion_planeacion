"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { DownloadIcon, Loader2Icon, UploadIcon } from "lucide-react"

import { importarSedes } from "@/app/(dashboard)/sedes/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { parseCsv } from "@/lib/sedes/importar"
import { parseExcel } from "@/lib/sedes/importar-excel"
import { cn } from "cn"

type Resultado = {
  importadas: number
  actualizadas: number
  omitidas: { fila: number; motivo: string }[]
}

export function SedeHerramientas() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setError(null)
    setResultado(null)
    setPending(true)

    try {
      const esExcel = /\.(xlsx|xls)$/i.test(file.name)
      const filas = esExcel
        ? parseExcel(await file.arrayBuffer())
        : parseCsv(await file.text())

      if (filas.length === 0) {
        setError("El archivo no contiene filas de datos.")
        return
      }

      const result = await importarSedes(filas)

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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- descarga de archivo vía route handler */}
        <a
          href="/sedes/exportar"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <DownloadIcon />
          Exportar CSV
        </a>

        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
          Importar CSV/Excel
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={onFile}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {resultado ? (
        <Alert>
          <AlertDescription>
            {resultado.importadas} importadas · {resultado.actualizadas}{" "}
            actualizadas · {resultado.omitidas.length} omitidas.
            {resultado.omitidas.length > 0
              ? ` Filas con problemas: ${resultado.omitidas
                  .map((o) => `${o.fila} (${o.motivo})`)
                  .join(", ")}.`
              : ""}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
