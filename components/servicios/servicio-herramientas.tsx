"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { DownloadIcon, Loader2Icon, UploadIcon } from "lucide-react"

import { importarServicios } from "@/app/(dashboard)/servicios/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { parseCsv } from "@/lib/servicios/importar"
import { parseExcel } from "@/lib/servicios/importar-excel"
import { cn } from "cn"

const SIN_VALOR = "__sin_valor__"

type Resultado = {
  insertadas: number
  actualizadas: number
  omitidas: { fila: number; motivo: string }[]
}

function toTipoItems(tipos: string[]) {
  return Object.fromEntries([
    [SIN_VALOR, "Sin defecto"],
    ...tipos.map((tipo) => [tipo, tipo]),
  ])
}

export function ServicioHerramientas({
  tiposPersonal,
}: {
  tiposPersonal: string[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [tipoDefecto, setTipoDefecto] = useState("")
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

      const result = await importarServicios(filas, {
        tipoPersonalDefecto: tipoDefecto || undefined,
      })

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
        <span className="text-sm text-muted-foreground">
          Tipo de persona por defecto (filas en blanco)
        </span>
        <Select
          value={tipoDefecto || SIN_VALOR}
          onValueChange={(value) =>
            setTipoDefecto(!value || value === SIN_VALOR ? "" : value)
          }
          items={toTipoItems(tiposPersonal)}
        >
          <SelectTrigger className="w-64" size="sm">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN_VALOR}>Sin defecto</SelectItem>
            {tiposPersonal.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={onFile}
        />
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
          Importar CSV/Excel
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- descarga de archivo vía route handler */}
        <a
          href="/servicios/exportar"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <DownloadIcon />
          Exportar CSV
        </a>
      </div>

      <p className="text-xs text-muted-foreground">
        Columnas: nombre* · grupo* · area · tipo de persona. Si el servicio ya
        existe por nombre, se actualiza su grupo, área y tipo de persona. Las
        opciones se omiten si el área o el tipo de persona no existen en el
        catálogo.
      </p>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {resultado ? (
        <Alert>
          <AlertDescription>
            {resultado.insertadas} nuevas · {resultado.actualizadas}{" "}
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
