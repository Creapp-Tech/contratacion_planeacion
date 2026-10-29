"use client"

import { useState, useCallback } from "react"
import { Loader2Icon, CheckIcon, AlertCircleIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function CargueMasivoForm({ archivo }: { archivo: File | null }) {
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<{
    creados: number
    rechazados: number
    errores?: { fila: number; motivo: string; campos?: string[] }[]
    detalles?: { fila: number; numero_contrato?: string; creado: boolean; mensaje?: string }[]
  } | null>(null)

  const confirmar = useCallback(async () => {
    if (!archivo) return
    setProcesando(true)
    setResultado(null)

    const formData = new FormData()
    formData.append("archivo", archivo)

    try {
      const res = await fetch("/api/contratos/cargue-masivo", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setResultado({
          creados: 0,
          rechazados: 0,
          errores: [{ fila: 0, motivo: data.error || "Error en el servidor" }],
        })
      } else {
        setResultado({
          creados: data.creados ?? 0,
          rechazados: data.rechazados ?? 0,
          errores: data.errores ?? [],
          detalles: data.detalles ?? [],
        })
      }
    } catch (err: any) {
      setResultado({
        creados: 0,
        rechazados: 0,
        errores: [{ fila: 0, motivo: err?.message || "Error de red" }],
      })
    }
    setProcesando(false)
  }, [archivo])

  const descargarErrores = useCallback(() => {
    if (!resultado || !resultado.errores || resultado.errores.length === 0) {
      alert("No hay errores para descargar. Confirma primero para ver los resultados.")
      return
    }
    const lineas = ["Fila;Motivo;Campos"]
    for (const e of resultado.errores) {
      lineas.push(`${e.fila};${e.motivo.replace(/;/g, ",")};${(e.campos || []).join(";")}`)
    }
    const blob = new Blob([lineas.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `errores_cargue_fila_1_a_${resultado.errores[0]?.fila ?? "?"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [resultado])

  if (!archivo) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Selecciona un archivo .xlsx para iniciar la vista previa.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Button onClick={confirmar} disabled={procesando}>
          {procesando ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <CheckIcon className="mr-2 h-4 w-4" />}
          Confirmar y guardar
        </Button>
        <Button variant="outline" disabled={procesando} onClick={descargarErrores}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Descargar errores (después de confirmar)
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-heading text-sm font-semibold">Vista previa</h3>
          <p className="text-xs text-muted-foreground mb-3">Archivo seleccionado: <span className="font-medium">{archivo.name}</span> ({(archivo.size / 1024).toFixed(1)} KB)</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fila</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultado?.detalles && resultado.detalles.length > 0 ? (
                resultado.detalles.map((d) => (
                  <TableRow key={d.fila}>
                    <TableCell>{d.fila}</TableCell>
                    <TableCell className={d.creado ? "text-emerald-600" : "text-red-600"}>
                      {d.creado ? "Cargado" : "Rechazado"}
                    </TableCell>
                    <TableCell className="text-xs">{d.numero_contrato || "—"} {d.mensaje ? `| ${d.mensaje}` : ""}</TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow><TableCell>2</TableCell><TableCell className="text-muted-foreground">Pendiente</TableCell><TableCell>—</TableCell></TableRow>
                  <TableRow><TableCell>3</TableCell><TableCell className="text-muted-foreground">Pendiente</TableCell><TableCell>—</TableCell></TableRow>
                  <TableRow><TableCell>4</TableCell><TableCell className="text-muted-foreground">Pendiente</TableCell><TableCell>—</TableCell></TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {resultado && (
        <Alert variant={resultado.rechazados > 0 ? "destructive" : "default"}>
          <AlertTitle>Resultado del cargue</AlertTitle>
          <AlertDescription>
            Creado(s): <strong>{resultado.creados}</strong> | Rechazado(s): <strong>{resultado.rechazados}</strong>
            {resultado.errores && resultado.errores.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-xs space-y-1">
                {resultado.errores.map((e, idx) => (
                  <li key={idx}>
                    <span className="font-semibold">Fila {e.fila}</span>: {e.motivo}
                    {e.campos && e.campos.length > 0 && (
                      <span className="block text-muted-foreground ml-1">Campos: {e.campos.join(", ")}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
