"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"

import {
  alternarFrecuenciaCalculo,
  consultarReemplazoCalculo,
} from "@/app/(dashboard)/frecuencias/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

type FrecuenciaCalculoSwitchProps = {
  id: string
  sedeNombre: string
  nombre: string
  version: string
  marcada: boolean
  activa: boolean
}

type Accion = "marcar" | "desmarcar" | "error"

export function FrecuenciaCalculoSwitch({
  id,
  sedeNombre,
  nombre,
  version,
  marcada: marcadaInicial,
  activa,
}: FrecuenciaCalculoSwitchProps) {
  const router = useRouter()
  const [marcada, setMarcada] = useState(marcadaInicial)
  const [open, setOpen] = useState(false)
  const [accion, setAccion] = useState<Accion>("marcar")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const etiqueta = `«${nombre}» (v${version})`

  function onCheckedChange(next: boolean) {
    setError(null)

    if (!next) {
      setAccion("desmarcar")
      setMensaje(
        `${etiqueta} dejará de usarse para el cálculo. La sede ${sedeNombre} quedará sin frecuencia de cálculo hasta que marques otra.`
      )
      setOpen(true)
      return
    }

    startTransition(async () => {
      const result = await consultarReemplazoCalculo(id)

      if ("error" in result) {
        setAccion("error")
        setMensaje(result.error)
        setOpen(true)
        return
      }

      setAccion("marcar")
      setMensaje(
        result.reemplazo
          ? `${etiqueta} reemplazará a «${result.reemplazo.nombre_nota_tecnica}» (v${result.reemplazo.version}) en ${sedeNombre}. La frecuencia anterior no se borra: solo deja de usarse para el cálculo.`
          : `${etiqueta} se usará para calcular la ocupación de ${sedeNombre}.`
      )
      setOpen(true)
    })
  }

  function onConfirm() {
    if (accion === "error") return

    const marcar = accion === "marcar"
    setError(null)

    startTransition(async () => {
      const result = await alternarFrecuenciaCalculo(id, marcar)

      if ("error" in result) {
        setError(result.error)
        return
      }

      setMarcada(marcar)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`calculo-${id}`}
        checked={marcada}
        disabled={!activa || pending}
        onCheckedChange={onCheckedChange}
        aria-label={
          marcada
            ? "Quitar del cálculo de ocupación"
            : "Usar en el cálculo de ocupación"
        }
      />
      {marcada ? (
        <Badge variant="secondary">En uso para cálculo</Badge>
      ) : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === "marcar"
                ? "Usar para el cálculo de ocupación"
                : accion === "desmarcar"
                  ? "Dejar de usar para el cálculo"
                  : "No se puede marcar la frecuencia"}
            </AlertDialogTitle>
            <AlertDialogDescription>{mensaje}</AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {accion === "error" ? "Entendido" : "Cancelar"}
            </AlertDialogCancel>
            {accion === "error" ? null : (
              <Button
                type="button"
                variant={accion === "desmarcar" ? "destructive" : "default"}
                disabled={pending}
                onClick={onConfirm}
              >
                {pending ? <Loader2Icon className="animate-spin" /> : null}
                {accion === "desmarcar"
                  ? "Dejar de usar"
                  : "Usar esta frecuencia"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
