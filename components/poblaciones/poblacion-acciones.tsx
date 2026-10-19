"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { EyeIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { eliminarPoblacion } from "@/lib/poblaciones/actions"
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
import { Button, buttonVariants } from "@/components/ui/button"

type PoblacionAccionesProps = {
  id: string
  nombre: string
  puedeEditar: boolean
}

export function PoblacionAcciones({
  id,
  nombre,
  puedeEditar,
}: PoblacionAccionesProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await eliminarPoblacion(id)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/poblaciones/${id}`}
        aria-label={`Ver ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <EyeIcon />
      </Link>

      {puedeEditar ? (
        <>
          <Link
            href={`/poblaciones/${id}/editar`}
            aria-label={`Editar ${nombre}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" })
            )}
          >
            <PencilIcon />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Borrar ${nombre}`}
            onClick={() => {
              setError(null)
              setOpen(true)
            }}
          >
            <Trash2Icon />
          </Button>

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Borrar población</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará la población registrada de {nombre}. Esta acción
                  no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={onConfirm}
                >
                  {pending ? <Loader2Icon className="animate-spin" /> : null}
                  Borrar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  )
}
