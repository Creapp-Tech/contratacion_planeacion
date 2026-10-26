"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { CopyIcon, Loader2Icon } from "lucide-react"

import { duplicarContrato } from "@/app/(dashboard)/contratos/actions"
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
import { Button } from "@/components/ui/button"

type DuplicarContratoBotonProps = {
  id: string
  nombre?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "icon-sm"
  showLabel?: boolean
  volverA?: string
}

export function DuplicarContratoBoton({
  id,
  nombre,
  variant = "ghost",
  size = "icon-sm",
  showLabel = false,
  volverA = "/contratos",
}: DuplicarContratoBotonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await duplicarContrato(id)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setOpen(false)
      const destino =
        volverA === "/historial"
          ? `/contratos/${result.id}/editar?volver=${encodeURIComponent(volverA)}`
          : `/contratos/${result.id}/editar`
      router.push(destino)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        aria-label={nombre ? `Duplicar ${nombre}` : "Duplicar contrato"}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <CopyIcon />
        {showLabel ? "Duplicar" : null}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará una copia{nombre ? ` de ${nombre}` : ""} con sus sedes,
              programas y valores. La copia quedará activa con un número nuevo
              basado en el original; podrás ajustar los datos en la pantalla de
              edición.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button type="button" disabled={pending} onClick={onConfirm}>
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              Duplicar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
