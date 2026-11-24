"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  ExternalLinkIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { eliminarCups } from "@/app/(dashboard)/configuracion/cups/actions"
import { SoloEscritura } from "@/components/auth/permisos-provider"
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
import { cn } from "cn"

type CupAccionesProps = {
  id: string
  nombre: string
  codigo: string
  onEditar: () => void
  puedeEditar: boolean
}

export function CupAcciones({
  id,
  nombre,
  codigo,
  onEditar,
  puedeEditar,
}: CupAccionesProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await eliminarCups(id)
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
        href={`/configuracion/cups/${id}`}
        aria-label={`Ver ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <EyeIcon />
      </Link>
      {puedeEditar ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar grupo y servicio de ${nombre}`}
            onClick={onEditar}
            title="Editar grupo y servicio en la fila"
          >
            <PencilIcon />
          </Button>
          <Link
            href={`/configuracion/cups/${id}/editar`}
            aria-label={`Editar todos los campos de ${nombre}`}
            title="Editar todos los campos"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          >
            <ExternalLinkIcon />
          </Link>
        </>
      ) : null}
      <SoloEscritura>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Eliminar ${nombre}`}
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
              <AlertDialogTitle>Eliminar CUPS</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará el CUPS {codigo} - {nombre}. Esta acción no se puede deshacer.
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
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SoloEscritura>
    </div>
  )
}
