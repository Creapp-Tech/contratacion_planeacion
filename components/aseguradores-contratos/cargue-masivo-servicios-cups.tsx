"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { DownloadIcon, Loader2Icon, UploadIcon } from "lucide-react"
import { cn } from "cn"

import {
  importarServiciosCups,
  type ImportarServiciosCupsResultado,
} from "@/app/(dashboard)/aseguradores-contratos/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useResetOnHide } from "@/hooks/use-reset-on-hide"
import { RUTA } from "@/lib/aseguradores-contratos/constantes"
import {
  parseCsvServiciosCups,
  type FilaImportacion,
} from "@/lib/aseguradores-contratos/importar"
import { parseExcelServiciosCups } from "@/lib/aseguradores-contratos/importar-excel"
import type { OpcionesAseguradoresContratos } from "@/lib/aseguradores-contratos/types"
import { CLASE_SELECT } from "@/lib/prestadores-contratos/ui"

const TAMANO_MAXIMO = 5 * 1024 * 1024

export function CargueMasivoServiciosCups({
  opciones,
}: {
  opciones: OpcionesAseguradoresContratos
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const aseguradorInicial = opciones.aseguradores[0]?.id ?? ""
  const contratoInicial =
    opciones.contratos.find(
      (contrato) => contrato.asegurador_id === aseguradorInicial
    )?.id ?? ""

  const [aseguradorId, setAseguradorId] = useState(aseguradorInicial)
  const [contratoId, setContratoId] = useState(contratoInicial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] =
    useState<ImportarServiciosCupsResultado | null>(null)

  const contratos = opciones.contratos.filter(
    (contrato) => contrato.asegurador_id === aseguradorId
  )

  useResetOnHide(() => {
    setAseguradorId(aseguradorInicial)
    setContratoId(contratoInicial)
    setPending(false)
    setError(null)
    setResultado(null)
  })

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    event.target.value = ""
    if (!archivo) return

    setError(null)
    setResultado(null)

    if (!aseguradorId || !contratoId) {
      setError("Selecciona un asegurador y un contrato antes de cargar el archivo.")
      return
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setError("El archivo no puede superar los 5 MB.")
      return
    }

    setPending(true)
    try {
      const esExcel = /\.(xlsx|xls)$/i.test(archivo.name)
      const filas: FilaImportacion[] = esExcel
        ? parseExcelServiciosCups(await archivo.arrayBuffer())
        : parseCsvServiciosCups(await archivo.text())

      if (filas.length === 0) {
        setError("El archivo no contiene filas de datos.")
        return
      }

      const respuesta = await importarServiciosCups(
        aseguradorId,
        contratoId,
        filas
      )
      if ("error" in respuesta) {
        setError(respuesta.error)
        return
      }

      setResultado(respuesta)
      router.refresh()
    } catch {
      setError("No se pudo leer el archivo.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga masiva de servicios CUPS</CardTitle>
        <CardDescription>
          Registra varios CUPS de un mismo contrato desde Excel o CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="masivo-asegurador">Asegurador</FieldLabel>
              <select
                id="masivo-asegurador"
                className={CLASE_SELECT}
                value={aseguradorId}
                onChange={(event) => {
                  const id = event.target.value
                  setAseguradorId(id)
                  setContratoId(
                    opciones.contratos.find(
                      (contrato) => contrato.asegurador_id === id
                    )?.id ?? ""
                  )
                }}
              >
                <option value="">Selecciona un asegurador</option>
                {opciones.aseguradores.map((asegurador) => (
                  <option key={asegurador.id} value={asegurador.id}>
                    {asegurador.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="masivo-contrato">Contrato</FieldLabel>
              <select
                id="masivo-contrato"
                className={CLASE_SELECT}
                value={contratoId}
                disabled={!aseguradorId || contratos.length === 0}
                onChange={(event) => setContratoId(event.target.value)}
              >
                <option value="">
                  {contratos.length === 0
                    ? "Sin contratos para el asegurador"
                    : "Selecciona un contrato"}
                </option>
                {contratos.map((contrato) => (
                  <option key={contrato.id} value={contrato.id}>
                    {contrato.numero_contrato} · {contrato.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={onFile}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
              Cargar archivo
            </Button>
            <a
              href={`${RUTA}/plantilla`}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              <DownloadIcon />
              Descargar plantilla
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Columnas: cups_asegurador* · cups_homologo* ·
            frecuencia_uso_contratada · cme_contratado. Los campos con * son
            obligatorios; frecuencia y CME pueden quedar vacíos. El código
            homologado se resuelve contra el catálogo CUPS. Los duplicados se
            omiten sin sobreescribir registros.
          </p>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {resultado ? (
            <Alert>
              <AlertDescription>
                <p>
                  {resultado.creados} creados · {resultado.rechazados.length}{" "}
                  rechazados.
                </p>
                {resultado.rechazados.length > 0 ? (
                  <ul className="mt-2 max-h-48 list-disc overflow-auto pl-4 text-xs">
                    {resultado.rechazados.map((rechazo, index) => (
                      <li key={`${rechazo.fila}-${index}`}>
                        Fila {rechazo.fila}: {rechazo.motivo}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
